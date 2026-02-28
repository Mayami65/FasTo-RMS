import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import * as path from 'path';
import * as isDev from 'electron-is-dev';
import { initDb } from './db';
import { registerAllHandlers } from './ipc';
import { ensureDirectories } from './utils/paths';
import { logger } from './utils/logger';

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

// Attempt to enable Chromium print preview features
app.commandLine.appendSwitch('enable-print-preview');
app.commandLine.appendSwitch('disable-site-isolation-trials');

let mainWindow: BrowserWindow | null = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    // Hide the default menu bar for a cleaner desktop app feel
    Menu.setApplicationMenu(null);

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', () => {
    try {
        ensureDirectories();
        logger.info('Starting application...');

        // Register custom protocol for local media
        const { protocol } = require('electron');
        protocol.registerFileProtocol('media', (request: any, callback: any) => {
            const url = request.url.replace('media://', '');
            try {
                return callback(decodeURIComponent(url));
            } catch (error) {
                console.error('Failed to register protocol', error);
            }
        });

        // Initialize Database
        const db = initDb();

        // Register IPC Handlers
        ipcMain.handle('get-app-info', () => {
            return {
                version: app.getVersion(),
                dbPath: path.join(app.getPath('userData'), 'db', 'main.sqlite')
            };
        });

        registerAllHandlers(ipcMain, db);
        const { registerLicenseHandlers } = require('./handlers/license');
        registerLicenseHandlers();
        const { registerAnalyticsHandlers } = require('./handlers/analytics');
        registerAnalyticsHandlers(ipcMain, db);
        logger.info('Handlers registered.');

        createWindow();
    } catch (error: any) {
        logger.error('Failed to initialize application: ' + error.message);
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
