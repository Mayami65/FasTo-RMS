import * as fs from 'fs';
import * as path from 'path';
import { getAppPaths } from './paths';

const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_BACKUP_LOGS = 3;

export class Logger {
    private logFile: string;

    constructor() {
        const paths = getAppPaths();
        this.logFile = path.join(paths.logs, 'app.log');
    }

    private rotateLogs() {
        if (!fs.existsSync(this.logFile)) return;

        const stats = fs.statSync(this.logFile);
        if (stats.size < MAX_LOG_SIZE) return;

        // Shift old logs
        for (let i = MAX_BACKUP_LOGS - 1; i >= 1; i--) {
            const oldPath = `${this.logFile}.${i}`;
            const newPath = `${this.logFile}.${i + 1}`;
            if (fs.existsSync(oldPath)) {
                fs.renameSync(oldPath, newPath);
            }
        }

        // Rename current to .1
        fs.renameSync(this.logFile, `${this.logFile}.1`);
    }

    log(message: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
        this.rotateLogs();
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] [${level}] ${message}\n`;

        console.log(formattedMessage.trim());
        fs.appendFileSync(this.logFile, formattedMessage);
    }

    info(message: string) { this.log(message, 'INFO'); }
    warn(message: string) { this.log(message, 'WARN'); }
    error(message: string) { this.log(message, 'ERROR'); }
}

export const logger = new Logger();
