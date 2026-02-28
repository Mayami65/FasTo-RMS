import type { IpcMain } from "electron";
import type { AppDatabase } from '../db';
import { AnalyticsService, AnalyticsRange } from '../services/analyticsService';

export function registerAnalyticsHandlers(ipcMain: IpcMain, db: AppDatabase) {
    const analyticsService = new AnalyticsService(db);

    ipcMain.handle('get-executive-overview', async (_event, range: AnalyticsRange) => {
        try {
            return analyticsService.getExecutiveOverview(range);
        } catch (error: any) {
            console.error('Failed to get executive overview:', error);
            return { error: error.message };
        }
    });

    ipcMain.handle('get-customer-intelligence', async (_event, range: AnalyticsRange) => {
        try {
            return analyticsService.getCustomerIntelligence(range);
        } catch (error: any) {
            console.error('Failed to get customer intelligence:', error);
            return { error: error.message };
        }
    });

    ipcMain.handle('debug-dates', async () => {
        try {
            const rows = analyticsService['db'].prepare('SELECT id, timestamp FROM sales ORDER BY id DESC LIMIT 5').all();
            console.log("\n++++++++++ RAW DB TIMESTAMPS ++++++++++");
            console.log(rows);
            console.log("+++++++++++++++++++++++++++++++++++++++\n");
            return rows;
        } catch (error: any) {
            return { error: error.message };
        }
    });

    ipcMain.handle('get-product-intelligence', async (_event, range: AnalyticsRange) => {
        try {
            return analyticsService.getProductIntelligence(range);
        } catch (error: any) {
            console.error('Failed to get product intelligence:', error);
            return { error: error.message };
        }
    });

    ipcMain.handle('get-operational-intelligence', async (_event, range: AnalyticsRange) => {
        try {
            return analyticsService.getOperationalIntelligence(range);
        } catch (error: any) {
            console.error('Failed to get operational intelligence:', error);
            return { error: error.message };
        }
    });
}
