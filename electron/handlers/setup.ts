import { type IpcMain } from "electron";
import type { AppDatabase } from '../db';
import * as bcrypt from 'bcryptjs';

export function registerSetupHandlers(ipcMain: IpcMain, db: AppDatabase) {

    // Check if app has any users (to determine if setup is needed)
    ipcMain.handle('setup:has-users', async () => {
        if (!db) return { hasUsers: false, error: 'Database not initialized' };
        try {
            console.log('[SETUP] Checking for users in DB:', db.name);
            const result: any = db.prepare('SELECT count(*) as count FROM users').get();
            console.log('[SETUP] User count:', result.count);
            return { hasUsers: result.count > 0 };
        } catch (error) {
            console.error('Failed to check users:', error);
            return { hasUsers: false, error: error };
        }
    });

    // Initialize Shop (Create Owner & Shop Profile)
    ipcMain.handle('setup:initialize', async (_event, payload) => {
        if (!db) return { success: false, error: 'Database not initialized' };
        const { shopName, shopPhone, shopAddress, username, password } = payload;

        if (!shopName || !username || !password) {
            return { success: false, error: 'Missing required fields' };
        }

        try {
            // Transaction: Create Settings + Create User
            const transaction = db.transaction(() => {
                // 1. Save Shop Profile to Settings
                const insertSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
                insertSetting.run('shop_name', shopName);
                if (shopPhone) insertSetting.run('shop_phone', shopPhone);
                if (shopAddress) insertSetting.run('shop_address', shopAddress);

                // 2. Create Owner User
                const hashedPassword = bcrypt.hashSync(password, 10);
                db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
                    .run(username, hashedPassword, 'OWNER');
            });

            transaction();
            return { success: true };
        } catch (error: any) {
            console.error('Setup failed:', error);
            return { success: false, error: error.message };
        }
    });
}
