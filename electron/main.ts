import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import * as path from 'path';
import { initDb } from './db';
import { registerAllHandlers } from './ipc';
import { ensureDirectories } from './utils/paths';
import { logger } from './utils/logger';

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

// Attempt to enable Chromium print preview features
app.commandLine.appendSwitch('enable-print-preview');
app.commandLine.appendSwitch('disable-site-isolation-trials');

// Single-instance lock — prevent multiple windows opening
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
    process.exit(0);
}

// Global Exception Handlers
process.on('uncaughtException', (error) => {
    logger.error('CRITICAL: Uncaught Exception - ' + (error?.stack || error?.message || String(error)));
});

process.on('unhandledRejection', (reason) => {
    logger.error('CRITICAL: Unhandled Rejection: ' + String(reason));
});

let mainWindow: BrowserWindow | null = null;

function createWindow() {
    logger.info('Creating main window...');
    try {
        mainWindow = new BrowserWindow({
            width: 1280,
            height: 800,
            minWidth: 1024,
            minHeight: 600,
            show: false, // Don't show until ready
            backgroundColor: '#0f172a',
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js'),
            },
        });

        // Hide the default menu bar for a cleaner desktop app feel
        Menu.setApplicationMenu(null);

        if (!app.isPackaged) {
            logger.info('Loading development URL: http://localhost:5173');
            mainWindow.loadURL('http://localhost:5173').catch(err => {
                logger.error(`Failed to load dev URL: ${err.message}`);
                mainWindow?.show();
            });
            mainWindow.webContents.openDevTools();
        } else {
            // In production: __dirname = <install>/resources/app.asar/electron/dist/
            // dist/index.html is at: <install>/resources/app.asar/dist/index.html
            const indexPath = path.join(__dirname, '../../dist/index.html');
            logger.info(`Loading production file: ${indexPath}`);
            mainWindow.loadFile(indexPath).catch(err => {
                logger.error(`Failed to load index.html: ${err.message}`);
                mainWindow?.show();
            });
        }

        mainWindow.once('ready-to-show', () => {
            logger.info('Window ready to show.');
            mainWindow?.show();
            mainWindow?.focus();
        });

        mainWindow.on('closed', () => {
            logger.info('Window closed.');
            mainWindow = null;
        });

        logger.info('Window creation complete.');
    } catch (error: any) {
        logger.error('Error during window creation: ' + error.message);
    }
}

app.whenReady().then(() => {
    try {
        ensureDirectories();
        logger.info('Starting application v' + app.getVersion());

        // Register custom protocol for serving local media files
        const { protocol, net } = require('electron') as typeof import('electron');
        const { pathToFileURL } = require('url') as typeof import('url');

        protocol.handle('media', (request: Request) => {
            let filePath = request.url.replace('media://', '');
            if (filePath.startsWith('/')) filePath = filePath.slice(1);
            const decodedPath = decodeURIComponent(filePath);
            try {
                return net.fetch(pathToFileURL(decodedPath).toString());
            } catch (error) {
                logger.error('Failed to fetch media file: ' + decodedPath);
                return new Response('File not found', { status: 404 });
            }
        });

        // Initialize Database
        const db = initDb();
        logger.info('Database initialized.');

        // Register static IPC handlers
        ipcMain.handle('get-app-info', () => ({
            version: app.getVersion(),
            dbPath: path.join(app.getPath('userData'), 'db', 'main.sqlite')
        }));

        // Register all feature handlers
        registerAllHandlers(ipcMain, db);
        const { registerLicenseHandlers } = require('./handlers/license');
        registerLicenseHandlers();
        const { registerAnalyticsHandlers } = require('./handlers/analytics');
        registerAnalyticsHandlers(ipcMain, db);
        logger.info('All IPC handlers registered.');

        createWindow();
    } catch (error: any) {
        logger.error('CRITICAL: Failed to initialize application: ' + error.message);
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
