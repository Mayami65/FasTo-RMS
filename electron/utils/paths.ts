import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

const APP_NAME = 'FasTo RMS';

export const getAppPaths = () => {
    const userData = app.getPath('userData');
    const documents = app.getPath('documents');

    return {
        userData,
        db: path.join(userData, 'db'),
        logs: path.join(userData, 'logs'),
        backups: path.join(userData, 'backups'),
        autoBackups: path.join(userData, 'backups', 'auto'),
        config: path.join(userData, 'config'),
        temp: path.join(userData, 'temp'),
        cache: path.join(userData, 'cache'),
        exports: path.join(documents, APP_NAME),
    };
};

export const ensureDirectories = () => {
    const paths = getAppPaths();
    const dirs = [
        paths.db,
        paths.logs,
        paths.autoBackups,
        paths.config,
        paths.temp,
        paths.cache,
        paths.exports
    ];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};
