import type { IpcMain } from "electron";
import type { AppDatabase } from '../db';

export function registerHeldSalesHandlers(ipcMain: IpcMain, db: AppDatabase) {

    // Hold Sale
    ipcMain.handle('hold-sale', async (_event, data) => {
        if (!db) return { success: false, error: 'Database not initialized' };
        try {
            const result = db.transaction(() => {
                const stmt = db.prepare(`
                    INSERT INTO held_sales (user_id, customer_id, total_amount, notes, timestamp)
                    VALUES (@user_id, @customer_id, @total_amount, @notes, @timestamp)
                `);

                const now = new Date().toISOString();
                const info = stmt.run({
                    user_id: data.userId || null,
                    customer_id: data.customerId || null,
                    total_amount: data.totalAmount,
                    notes: data.notes || '',
                    timestamp: now
                });

                const heldSaleId = info.lastInsertRowid;

                const itemStmt = db.prepare(`
                    INSERT INTO held_sale_items (held_sale_id, product_id, variant_id, quantity, price_at_hold)
                    VALUES (@held_sale_id, @product_id, @variant_id, @quantity, @price_at_hold)
                `);

                for (const item of data.items) {
                    itemStmt.run({
                        held_sale_id: heldSaleId,
                        product_id: item.id,
                        variant_id: item.variantId,
                        quantity: item.quantity,
                        price_at_hold: item.selling_price
                    });
                }

                return heldSaleId;
            })();

            return { success: true, id: result };
        } catch (error: any) {
            console.error('Failed to hold sale:', error);
            return { success: false, error: error.message };
        }
    });

    // Get Held Sales
    ipcMain.handle('get-held-sales', async () => {
        if (!db) return [];
        try {
            const heldSales = db.prepare(`
                SELECT hs.*, c.name as customer_name, u.username as cashier_name
                FROM held_sales hs
                LEFT JOIN customers c ON hs.customer_id = c.id
                LEFT JOIN users u ON hs.user_id = u.id
                ORDER BY hs.timestamp DESC
            `).all() as any[];

            const results = await Promise.all(heldSales.map(async (hs) => {
                const items = db.prepare(`
                    SELECT hsi.*, p.name as product_name, pv.variation_name
                    FROM held_sale_items hsi
                    JOIN products p ON hsi.product_id = p.id
                    LEFT JOIN product_variants pv ON hsi.variant_id = pv.id
                    WHERE hsi.held_sale_id = ?
                `).all(hs.id);
                return { ...hs, items };
            }));

            return results;
        } catch (error) {
            console.error('Failed to get held sales:', error);
            return [];
        }
    });

    // Delete Held Sale
    ipcMain.handle('delete-held-sale', async (_event, id) => {
        if (!db) return { success: false, error: 'Database not initialized' };
        try {
            db.prepare('DELETE FROM held_sales WHERE id = ?').run(id);
            return { success: true };
        } catch (error: any) {
            console.error('Failed to delete held sale:', error);
            return { success: false, error: error.message };
        }
    });
}
