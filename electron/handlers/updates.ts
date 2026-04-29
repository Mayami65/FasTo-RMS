import { app, ipcMain, BrowserWindow, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

function isMissingGitHubReleaseFeed(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes('releases.atom') && message.includes('404');
}

// Configure auto updater
autoUpdater.logger = logger;

export function setupUpdates(mainWindow: BrowserWindow) {
    const checkForUpdatesSafely = async () => {
        if (!app.isPackaged) {
            return { updateInfo: null, skipped: true };
        }

        try {
            const result = await autoUpdater.checkForUpdates();
            return result;
        } catch (error: any) {
            if (isMissingGitHubReleaseFeed(error)) {
                logger.error('Update feed check failed: GitHub releases feed not found.');
                throw new Error('Update feed is unavailable. Confirm that GitHub Releases are published and accessible.');
            }

            logger.error('Error checking for updates: ' + error.message);
            throw error;
        }
    };

    // IPC handlers for renderer process
    ipcMain.handle('check-for-updates', async () => {
        return checkForUpdatesSafely();
    });

    // Start update download
    ipcMain.handle('download-update', async () => {
        if (!app.isPackaged) {
            return { success: false, error: 'Updates are only available in packaged builds.' };
        }

        try {
            await autoUpdater.downloadUpdate();
            return { success: true };
        } catch (error: any) {
            logger.error('Error downloading update: ' + error.message);
            throw error;
        }
    });

    // Install and restart (with pre-install backup)
    ipcMain.handle('install-update', async () => {
        if (!app.isPackaged) {
            return { success: false, error: 'Updates are only available in packaged builds.' };
        }

        try {
            // Perform a safe backup of user data (database) before installing
            try {
                const userData = app.getPath('userData');
                const dbPath = path.join(userData, 'db', 'main.sqlite');
                const backupsDir = path.join(userData, 'backups');
                if (!fs.existsSync(backupsDir)) {
                    fs.mkdirSync(backupsDir, { recursive: true });
                }

                if (fs.existsSync(dbPath)) {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const backupPath = path.join(backupsDir, `update-backup-${timestamp}.sqlite`);
                    fs.copyFileSync(dbPath, backupPath);
                    logger.info(`Pre-update DB backup created at ${backupPath}`);
                } else {
                    logger.warn(`Pre-update backup skipped: DB not found at ${dbPath}`);
                }
            } catch (backupErr: any) {
                logger.error('Failed to create pre-update backup: ' + (backupErr?.message || String(backupErr)));
                // Proceeding with install even if backup fails, but this is logged
            }

            autoUpdater.quitAndInstall(false, true);
            return { success: true };
        } catch (err: any) {
            logger.error('Error during install-update: ' + (err?.message || String(err)));
            throw err;
        }
    });

    // List available backups
    ipcMain.handle('list-backups', async () => {
        try {
            const userData = app.getPath('userData');
            const backupsDir = path.join(userData, 'backups');

            if (!fs.existsSync(backupsDir)) {
                return { backups: [] };
            }

            const files = fs.readdirSync(backupsDir).filter(f => f.endsWith('.sqlite'));
            const backups = files
                .map(file => {
                    const filePath = path.join(backupsDir, file);
                    const stats = fs.statSync(filePath);
                    // Extract timestamp from filename: update-backup-<timestamp>.sqlite
                    const timestampMatch = file.match(/update-backup-(.+)\.sqlite/);
                    const timestamp = timestampMatch ? timestampMatch[1] : file;
                    const createdAt = new Date(timestamp.replace(/-/g, ':').replace(/^(.+)-(.+)-(.+)T/, '$1-$2-$3T'));

                    return {
                        filename: file,
                        path: filePath,
                        sizeBytes: stats.size,
                        sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
                        createdAt: createdAt.toISOString(),
                        createdAtFormatted: createdAt.toLocaleString(),
                    };
                })
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            logger.info(`Found ${backups.length} backup(s)`);
            return { backups };
        } catch (err: any) {
            logger.error('Error listing backups: ' + (err?.message || String(err)));
            throw err;
        }
    });

    // Restore a backup
    ipcMain.handle('restore-backup', async (_event, backupPath: string) => {
        try {
            const userData = app.getPath('userData');
            const dbPath = path.join(userData, 'db', 'main.sqlite');

            // Validate backup exists and is in the backups directory
            const backupsDir = path.join(userData, 'backups');
            const normalizedBackupPath = path.normalize(backupPath);
            const normalizedBackupsDir = path.normalize(backupsDir);

            if (!normalizedBackupPath.startsWith(normalizedBackupsDir)) {
                throw new Error('Invalid backup path: access denied');
            }

            if (!fs.existsSync(normalizedBackupPath)) {
                throw new Error('Backup file not found');
            }

            // Create a safety backup of current DB
            if (fs.existsSync(dbPath)) {
                const safetyBackupPath = path.join(backupsDir, `pre-restore-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`);
                fs.copyFileSync(dbPath, safetyBackupPath);
                logger.info(`Safety backup created at ${safetyBackupPath}`);
            }

            // Restore the backup
            fs.copyFileSync(normalizedBackupPath, dbPath);
            logger.info(`Database restored from ${normalizedBackupPath}`);

            return { success: true, message: 'Database restored successfully. Please restart the app.' };
        } catch (err: any) {
            logger.error('Error restoring backup: ' + (err?.message || String(err)));
            throw err;
        }
    });

    // Delete a backup
    ipcMain.handle('delete-backup', async (_event, backupPath: string) => {
        try {
            const userData = app.getPath('userData');
            const backupsDir = path.join(userData, 'backups');

            // Validate backup is in the backups directory
            const normalizedBackupPath = path.normalize(backupPath);
            const normalizedBackupsDir = path.normalize(backupsDir);

            if (!normalizedBackupPath.startsWith(normalizedBackupsDir)) {
                throw new Error('Invalid backup path: access denied');
            }

            if (!fs.existsSync(normalizedBackupPath)) {
                throw new Error('Backup file not found');
            }

            fs.unlinkSync(normalizedBackupPath);
            logger.info(`Backup deleted: ${normalizedBackupPath}`);

            return { success: true, message: 'Backup deleted' };
        } catch (err: any) {
            logger.error('Error deleting backup: ' + (err?.message || String(err)));
            throw err;
        }
    });

    if (!app.isPackaged) {
        logger.info('Update handlers registered in development mode; auto-check loop disabled.');
        return;
    }

    setTimeout(() => {
        autoUpdater.checkForUpdates().catch(err => {
            if (isMissingGitHubReleaseFeed(err)) {
                logger.info('No published release feed found yet; skipping update check.');
                return;
            }

            logger.error('Error checking for updates: ' + err);
        });
    }, 5000);

    // Check for updates every hour after app starts
    setInterval(() => {
        autoUpdater.checkForUpdates().catch(err => {
            if (isMissingGitHubReleaseFeed(err)) {
                logger.info('No published release feed found yet; skipping update check.');
                return;
            }

            logger.error('Error checking for updates: ' + err);
        });
    }, 60 * 60 * 1000); // 1 hour

    // Send update available event to renderer
    autoUpdater.on('update-available', (info) => {
        logger.info('Update available: ' + info.version);
        mainWindow.webContents.send('update-available', {
            version: info.version,
            releaseDate: info.releaseDate,
            releaseNotes: info.releaseNotes,
        });
    });

    // Send update not available
    autoUpdater.on('update-not-available', () => {
        logger.info('No updates available');
        mainWindow.webContents.send('update-not-available');
    });

    // Send download progress
    autoUpdater.on('download-progress', (progressObj) => {
        const progress = Math.round((progressObj.transferred / progressObj.total) * 100);
        logger.info(`Update download progress: ${progress}%`);
        mainWindow.webContents.send('update-download-progress', progress);
    });

    // Update downloaded
    autoUpdater.on('update-downloaded', (info) => {
        logger.info('Update downloaded: ' + info.version);
        mainWindow.webContents.send('update-downloaded', {
            version: info.version,
        });
    });

    // Error handler
    autoUpdater.on('error', (error) => {
        if (isMissingGitHubReleaseFeed(error)) {
            logger.error('Update feed is unavailable (GitHub releases feed not found).');
            mainWindow.webContents.send('update-error', 'Update feed is unavailable. Confirm that GitHub Releases are published and accessible.');
            return;
        }

        logger.error('Update error: ' + error.message);
        mainWindow.webContents.send('update-error', error.message);
    });
}
