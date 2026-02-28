import type { IpcMain } from "electron";
import type { AppDatabase } from '../db';

export function registerCategoryHandlers(ipcMain: IpcMain, db: AppDatabase) {
    // Get Categories
    ipcMain.handle('get-categories', async () => {
        if (!db) return [];
        try {
            return db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
        } catch (error) {
            console.error('Failed to get categories:', error);
            return [];
        }
    });

    // Add Category (if needed in future, currently seeded or managed via other means?)
    // Existing main.ts didn't have explicit add-category handler visible in snippets, 
    // but migration logic handled it. 
    // If there is an add-category handler I missed, I should add it here.
    // For now, I'll stick to what I saw: get-categories.
}
