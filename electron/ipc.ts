import type { IpcMain } from "electron";
import type { AppDatabase } from "./db";

import { registerAuthHandlers } from "./handlers/auth";
import { registerProductHandlers } from "./handlers/products";
import { registerCategoryHandlers } from "./handlers/categories";
import { registerSalesHandlers } from "./handlers/sales";
import { registerReportHandlers } from "./handlers/reports";
import { registerCustomerHandlers } from "./handlers/customers";
import { registerHirePurchaseHandlers } from "./handlers/hirePurchase";
import { registerSystemHandlers } from "./handlers/system";
import { registerSetupHandlers } from "./handlers/setup";
import { registerHeldSalesHandlers } from "./handlers/held-sales";

export function registerAllHandlers(ipcMain: IpcMain, db: AppDatabase) {
    registerAuthHandlers(ipcMain, db);
    registerProductHandlers(ipcMain, db);
    registerCategoryHandlers(ipcMain, db);
    registerSalesHandlers(ipcMain, db);
    registerReportHandlers(ipcMain, db);
    registerCustomerHandlers(ipcMain, db);
    registerHirePurchaseHandlers(ipcMain, db);
    registerSystemHandlers(ipcMain, db);
    registerSetupHandlers(ipcMain, db);
    registerHeldSalesHandlers(ipcMain, db);
}
