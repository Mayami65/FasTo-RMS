import { type IpcMain, dialog, BrowserWindow, app, shell } from 'electron';
import type { AppDatabase } from '../db';
import * as fs from 'fs';
import * as path from 'path';
import { getAppPaths } from '../utils/paths';
import { logger } from '../utils/logger';

export function registerSystemHandlers(ipcMain: IpcMain, db: AppDatabase) {

    // Settings Handlers
    ipcMain.handle('get-settings', async () => {
        if (!db) return {};
        try {
            const settings = db.prepare('SELECT * FROM settings').all() as any[];
            const settingsObj: Record<string, string> = {};
            settings.forEach(s => {
                settingsObj[s.key] = s.value;
            });
            return settingsObj;
        } catch (error: any) {
            logger.error('Failed to get settings: ' + error.message);
            return {};
        }
    });

    ipcMain.handle('update-settings', async (_event, settings: Record<string, string>) => {
        if (!db) return { success: false, error: 'Database not initialized' };
        try {
            const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
            const transaction = db.transaction((data: Record<string, string>) => {
                for (const [key, value] of Object.entries(data)) {
                    stmt.run(key, value);
                }
            });
            transaction(settings);
            return { success: true };
        } catch (error: any) {
            logger.error('Failed to update settings: ' + error.message);
            return { success: false, error: error.message };
        }
    });

    // Database Backup & Restore
    ipcMain.handle('backup-database', async () => {
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (!mainWindow) return { success: false, error: 'Window not found' };

        try {
            const { filePath } = await dialog.showSaveDialog(mainWindow, {
                title: 'Backup Database',
                defaultPath: path.join(app.getPath('documents'), `FasTo_Backup_${new Date().toISOString().split('T')[0]}.db`),
                filters: [{ name: 'Database Files', extensions: ['db', 'sqlite'] }]
            });

            if (!filePath) return { success: false, error: 'Backup cancelled' };

            logger.info(`Starting manual backup to: ${filePath}`);
            db.prepare(`VACUUM INTO ?`).run(filePath);
            logger.info('Manual backup complete.');

            return { success: true, path: filePath };
        } catch (error: any) {
            logger.error('Manual backup failed: ' + error.message);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('restore-database', async () => {
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (!mainWindow) return { success: false, error: 'Window not found' };

        try {
            const { filePaths } = await dialog.showOpenDialog(mainWindow, {
                title: 'Select Backup to Restore',
                filters: [{ name: 'Database Files', extensions: ['db', 'sqlite'] }],
                properties: ['openFile']
            });

            if (!filePaths || filePaths.length === 0) return { success: false, error: 'Restore cancelled' };
            const backupPath = filePaths[0];
            const currentDbPath = db.name;

            logger.warn(`RESTORE REQUESTED from: ${backupPath}`);

            // Critical Section: Close DB and replace
            db.close();
            fs.copyFileSync(backupPath, currentDbPath);

            logger.info('Restore successful. Relaunching application...');
            app.relaunch();
            app.quit();

            return { success: true };
        } catch (error: any) {
            logger.error('Restore failed: ' + error.message);
            return { success: false, error: error.message };
        }
    });

    // Folder Management
    ipcMain.handle('open-data-folder', async () => {
        const paths = getAppPaths();
        try {
            await shell.openPath(paths.userData);
            return { success: true };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    });

    ipcMain.handle('open-exports-folder', async () => {
        const paths = getAppPaths();
        try {
            await shell.openPath(paths.exports);
            return { success: true };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    });

    // Printing
    ipcMain.handle('print-receipt', async () => {
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (!mainWindow) return { success: false, error: 'Main window not available' };

        return new Promise((resolve) => {
            mainWindow.webContents.print({
                silent: false,
                printBackground: true,
                color: false,
            }, (success, failureReason) => {
                if (success) {
                    resolve({ success: true });
                } else {
                    logger.error('Print failed: ' + failureReason);
                    resolve({ success: false, error: failureReason });
                }
            });
        });
    });
}
