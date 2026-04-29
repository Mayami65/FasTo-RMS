import type { IpcMain } from "electron";
import type { AppDatabase } from '../db';
import { audit } from "../services/audit";

export function registerSalesHandlers(ipcMain: IpcMain, db: AppDatabase) {

    const getSaleItemsBySaleId = (saleId: number) => {
        return db.prepare(`
            SELECT si.*, p.name as product_name, pv.variation_name
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            LEFT JOIN product_variants pv ON si.variant_id = pv.id
            WHERE si.sale_id = ?
            ORDER BY si.id ASC
        `).all(saleId) as any[];
    };

    const getSaleById = (saleId: number) => {
        return db.prepare(`
            SELECT s.*, u.username as cashier_name, c.name as customer_name
            FROM sales s
            LEFT JOIN users u ON s.user_id = u.id
            LEFT JOIN customers c ON s.customer_id = c.id
            WHERE s.id = ?
        `).get(saleId) as any;
    };

    const calculateNextPaymentDate = (duration: string): string => {
        const now = new Date();
        let nextDate = new Date(now);

        switch (duration) {
            case 'ONE_WEEK':
                nextDate.setDate(nextDate.getDate() + 7);
                break;
            case 'TWO_WEEKS':
                nextDate.setDate(nextDate.getDate() + 14);
                break;
            case 'MONTHLY':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
            case 'QUARTERLY':
                nextDate.setMonth(nextDate.getMonth() + 3);
                break;
            case 'SEMI_ANNUAL':
                nextDate.setMonth(nextDate.getMonth() + 6);
                break;
            default:
                nextDate.setDate(nextDate.getDate() + 30); // Default 30 days
        }

        return nextDate.toISOString().split('T')[0] + ' ' + nextDate.toTimeString().split(' ')[0];
    };

    // Process Sale
    ipcMain.handle('process-sale', async (_event, saleData) => {
        if (!db) return { success: false, error: 'Database not initialized' };
        try {
            const result = db.transaction(() => {
                // 1. Create Sale Record
                const saleStmt = db.prepare(`
                    INSERT INTO sales (user_id, total_amount, payment_method, timestamp, momo_transaction_id, momo_provider, discount_amount, coupon_id, customer_id)
                    VALUES (@user_id, @total_amount, @payment_method, @timestamp, @momo_transaction_id, @momo_provider, @discount_amount, @coupon_id, @customer_id)
                `);

                const now = new Date();
                const timestamp = now.toISOString();

                const saleInfo = saleStmt.run({
                    user_id: saleData.userId,
                    total_amount: saleData.totalAmount,
                    payment_method: saleData.paymentMethod,
                    timestamp: timestamp,
                    momo_transaction_id: saleData.momoTransactionId || null,
                    momo_provider: saleData.momoProvider || null,
                    discount_amount: saleData.discountAmount || 0,
                    coupon_id: saleData.couponId || null,
                    customer_id: saleData.customerId || null
                });

                const saleId = saleInfo.lastInsertRowid;

                // 2. Add Sale Items & Update Stock
                const itemStmt = db.prepare(`
                    INSERT INTO sale_items (sale_id, product_id, variant_id, quantity, price_at_sale, discount_amount, cost_price_at_sale)
                    VALUES (@sale_id, @product_id, @variant_id, @quantity, @price_at_sale, @discount_amount, @cost_price_at_sale)
                `);

                const stockStmt = db.prepare(`
                    UPDATE product_variants 
                    SET stock_quantity = stock_quantity - @quantity 
                    WHERE id = @variant_id
                `);

                // Fallback for non-variant products (legacy support if needed, or if variant logic handles all)
                // Assuming all products have variants now due to migration in db.ts.

                const costStmt = db.prepare(`SELECT cost_price FROM product_variants WHERE id = ?`);

                for (const item of saleData.items) {
                    const variantData = costStmt.get(item.variantId) as any;
                    const costPrice = variantData ? variantData.cost_price : 0;

                    itemStmt.run({
                        sale_id: saleId,
                        product_id: item.productId,
                        variant_id: item.variantId,
                        quantity: item.quantity,
                        price_at_sale: item.price,
                        discount_amount: item.discount || 0,
                        cost_price_at_sale: costPrice
                    });

                    stockStmt.run({
                        quantity: item.quantity,
                        variant_id: item.variantId
                    });
                }

                // 3. Create Hire Purchase Agreement if payment method is HIRE_PURCHASE
                if (saleData.paymentMethod === 'HIRE_PURCHASE' && saleData.customerId) {
                    const nextPaymentDate = calculateNextPaymentDate(saleData.hpDuration || 'TWO_WEEKS');
                    const balanceDue = saleData.totalAmount - (saleData.depositAmount || 0);

                    const hpStmt = db.prepare(`
                        INSERT INTO hire_purchase_agreements (customer_id, sale_id, total_amount, balance_due, status, next_payment_date)
                        VALUES (?, ?, ?, ?, 'ACTIVE', ?)
                    `);

                    const hpResult = hpStmt.run(saleData.customerId, saleId, saleData.totalAmount, balanceDue, nextPaymentDate);
                    const agreementId = hpResult.lastInsertRowid;

                    // If there was a deposit, create an installment record for it
                    if (saleData.depositAmount && saleData.depositAmount > 0 && agreementId) {
                        const installmentStmt = db.prepare(`
                            INSERT INTO installments (agreement_id, amount_paid, payment_date, notes)
                            VALUES (?, ?, ?, ?)
                        `);
                        
                        const now = new Date().toISOString();
                        installmentStmt.run(agreementId, saleData.depositAmount, now, 'Initial deposit');
                    }
                }

                return saleId;
            })();

            audit(db, {
                userId: saleData.userId,
                action: 'SALE_CREATE',
                details: `Processed sale for GH₵ ${saleData.totalAmount}`,
                entity: 'sale',
                entityId: result
            });

            return { success: true, saleId: result };
        } catch (error: any) {
            console.error('Failed to process sale:', error);
            return { success: false, error: error.message };
        }
    });

    // Get Sale Details (for receipt reprint etc)
    ipcMain.handle('get-sale-details', async (_event, saleId) => {
        if (!db) return null;
        try {
            const sale = getSaleById(saleId);

            if (!sale) return null;

            const items = getSaleItemsBySaleId(saleId);

            return { ...sale, items };
        } catch (error) {
            console.error('Failed to get sale details:', error);
            return null;
        }
    });

    // Get Discounts
    ipcMain.handle('get-discounts', async () => {
        if (!db) return [];
        try {
            return db.prepare('SELECT * FROM discounts WHERE is_active = 1').all();
        } catch (error) {
            console.error('Failed to get discounts:', error);
            return [];
        }
    });

    // Add Discount
    ipcMain.handle('add-discount', async (_event, discount) => {
        if (!db) return { success: false, error: 'Database not initialized' };
        try {
            const stmt = db.prepare(`
                INSERT INTO discounts (name, type, value, min_purchase, start_date, end_date, is_active)
                VALUES (@name, @type, @value, @min_purchase, @start_date, @end_date, @is_active)
            `);
            const info = stmt.run({
                name: discount.name,
                type: discount.type,
                value: discount.value,
                min_purchase: discount.minPurchase || 0,
                start_date: discount.startDate,
                end_date: discount.endDate,
                is_active: 1
            });
            return { success: true, id: info.lastInsertRowid };
        } catch (error: any) {
            console.error('Failed to add discount:', error);
            return { success: false, error: error.message };
        }
    });

    // Update Discount
    ipcMain.handle('update-discount', async (_event, discount) => {
        if (!db) return { success: false, error: 'Database not initialized' };
        try {
            const stmt = db.prepare(`
                UPDATE discounts 
                SET name = @name, type = @type, value = @value, min_purchase = @min_purchase, start_date = @start_date, end_date = @end_date, is_active = @is_active
                WHERE id = @id
            `);
            stmt.run({
                id: discount.id,
                name: discount.name,
                type: discount.type,
                value: discount.value,
                min_purchase: discount.minPurchase || 0,
                start_date: discount.startDate,
                end_date: discount.endDate,
                is_active: discount.isActive !== undefined ? (discount.isActive ? 1 : 0) : 1
            });
            return { success: true };
        } catch (error: any) {
            console.error('Failed to update discount:', error);
            return { success: false, error: error.message };
        }
    });

    // Delete Discount
    ipcMain.handle('delete-discount', async (_event, id) => {
        if (!db) return { success: false, error: 'Database not initialized' };
        try {
            // Soft delete
            db.prepare('UPDATE discounts SET is_active = 0 WHERE id = ?').run(id);
            return { success: true };
        } catch (error: any) {
            console.error('Failed to delete discount:', error);
            return { success: false, error: error.message };
        }
    });

    // Get Sale For Refund
    ipcMain.handle('get-sale-for-refund', async (_event, saleId) => {
        if (!db) return null;
        try {
            const sale = db.prepare(`
                SELECT s.*, u.username as cashier_name 
                FROM sales s 
                LEFT JOIN users u ON s.user_id = u.id 
                WHERE s.id = ?
            `).get(saleId) as any;

            if (!sale) return null;

            // Get items
            const items = db.prepare(`
                SELECT si.*, p.name as product_name, pv.variation_name 
                FROM sale_items si 
                JOIN products p ON si.product_id = p.id 
                LEFT JOIN product_variants pv ON si.variant_id = pv.id
                WHERE si.sale_id = ?
            `).all(saleId) as any[];

            // Calculate refundable quantities (qty sold - already refunded)
            const refundItems = await Promise.all(items.map(async (item) => {
                const refundedResult = db.prepare(`
                    SELECT SUM(quantity) as refunded_qty 
                    FROM refund_items 
                    WHERE sale_item_id = ?
                `).get(item.id) as any;

                const refundedQty = refundedResult?.refunded_qty || 0;
                const refundableQty = item.quantity - refundedQty;

                return {
                    ...item,
                    refunded_quantity: refundedQty,
                    refundable_quantity: refundableQty
                };
            }));

            // Calculate total amount already refunded
            const totalRefundedResult = db.prepare(`
                SELECT SUM(refund_amount) as total 
                FROM refunds 
                WHERE sale_id = ?
            `).get(saleId) as any;

            return {
                sale,
                items: refundItems,
                refunded_total: totalRefundedResult?.total || 0
            };
        } catch (error) {
            console.error('Failed to get sale for refund:', error);
            return null;
        }
    });

    // Process Refund
    ipcMain.handle('process-refund', async (_event, data) => {
        if (!db) return { success: false, error: 'Database not initialized' };
        try {
            const result = db.transaction(() => {
                // Calculate total refund amount
                let totalRefundAmount = 0;
                const refundItems = [];

                for (const item of data.items) {
                    const saleItem = db.prepare('SELECT * FROM sale_items WHERE id = ?').get(item.saleItemId) as any;
                    if (!saleItem) throw new Error(`Sale item not found: ${item.saleItemId}`);

                    const refundAmount = saleItem.price_at_sale * item.quantity;
                    totalRefundAmount += refundAmount;

                    refundItems.push({
                        saleItemId: item.saleItemId,
                        productId: saleItem.product_id,
                        quantity: item.quantity,
                        amount: refundAmount,
                        variantId: saleItem.variant_id
                    });
                }

                // Create Refund Record
                const refundStmt = db.prepare(`
                    INSERT INTO refunds (sale_id, user_id, reason, refund_amount, timestamp)
                    VALUES (@sale_id, @user_id, @reason, @refund_amount, @timestamp)
                `);

                const refundInfo = refundStmt.run({
                    sale_id: data.saleId,
                    user_id: data.userId || null,
                    reason: data.reason,
                    refund_amount: totalRefundAmount,
                    timestamp: new Date().toISOString()
                });

                const refundId = refundInfo.lastInsertRowid;

                // Create Refund Items and Restore Stock
                const refundItemStmt = db.prepare(`
                    INSERT INTO refund_items (refund_id, sale_item_id, product_id, variant_id, quantity, refund_amount)
                    VALUES (@refund_id, @sale_item_id, @product_id, @variant_id, @quantity, @refund_amount)
                `);

                const stockStmt = db.prepare(`
                    UPDATE product_variants 
                    SET stock_quantity = stock_quantity + @quantity 
                    WHERE id = @variant_id
                `);

                for (const item of refundItems) {
                    refundItemStmt.run({
                        refund_id: refundId,
                        sale_item_id: item.saleItemId,
                        product_id: item.productId,
                        variant_id: item.variantId,
                        quantity: item.quantity,
                        refund_amount: item.amount
                    });

                    // Restore stock logic (optional, dependent on business rule, usually yes for valid returns)
                    stockStmt.run({
                        quantity: item.quantity,
                        variant_id: item.variantId
                    });
                }

                return { refundId, totalRefundAmount };
            })();

            audit(db, {
                userId: data.userId,
                action: 'REFUND_PROCESS',
                details: `Processed refund of GH₵ ${result.totalRefundAmount} for Sale #${data.saleId}`,
                entity: 'refund',
                entityId: result.refundId
            });

            return { success: true, refundId: result.refundId, refundAmount: result.totalRefundAmount };
        } catch (error: any) {
            console.error('Failed to process refund:', error);
            return { success: false, error: error.message };
        }
    });

    // Update Sale
    ipcMain.handle('update-sale', async (_event, data) => {
        if (!db) return { success: false, error: 'Database not initialized' };
        try {
            const result = db.transaction(() => {
                const saleId = Number(data.saleId);
                if (!saleId) throw new Error('Invalid sale id');

                const existingSale = getSaleById(saleId);
                if (!existingSale) throw new Error('Sale not found');

                const existingItems = getSaleItemsBySaleId(saleId);
                const existingQtyByVariant = new Map<number, number>();
                for (const item of existingItems) {
                    if (!item.variant_id) continue;
                    existingQtyByVariant.set(item.variant_id, (existingQtyByVariant.get(item.variant_id) || 0) + item.quantity);
                }

                const incomingItems = Array.isArray(data.items) ? data.items : [];
                if (incomingItems.length === 0) {
                    throw new Error('Sale must contain at least one item');
                }

                const newQtyByVariant = new Map<number, { quantity: number; productId: number; variantId: number; price: number }>();
                let recalculatedTotal = 0;

                for (const item of incomingItems) {
                    const variantId = Number(item.variantId);
                    if (!variantId) throw new Error('Each sale item must have a valid variant');

                    const quantity = Number(item.quantity) || 0;
                    if (quantity <= 0) throw new Error('Item quantity must be greater than zero');

                    const productId = Number(item.productId);
                    const price = Number(item.price) || 0;

                    newQtyByVariant.set(variantId, { quantity, productId, variantId, price });
                    recalculatedTotal += quantity * price;
                }

                const allVariantIds = new Set<number>([
                    ...Array.from(existingQtyByVariant.keys()),
                    ...Array.from(newQtyByVariant.keys()),
                ]);

                const variantStmt = db.prepare('SELECT stock_quantity, cost_price FROM product_variants WHERE id = ?');
                const adjustStockStmt = db.prepare('UPDATE product_variants SET stock_quantity = ? WHERE id = ?');
                const deleteItemsStmt = db.prepare('DELETE FROM sale_items WHERE sale_id = ?');
                const insertItemStmt = db.prepare(`
                    INSERT INTO sale_items (sale_id, product_id, variant_id, quantity, price_at_sale, discount_amount, cost_price_at_sale)
                    VALUES (@sale_id, @product_id, @variant_id, @quantity, @price_at_sale, @discount_amount, @cost_price_at_sale)
                `);

                for (const variantId of allVariantIds) {
                    const stockRow = variantStmt.get(variantId) as any;
                    if (!stockRow) throw new Error(`Variant not found: ${variantId}`);

                    const originalQty = existingQtyByVariant.get(variantId) || 0;
                    const newQty = newQtyByVariant.get(variantId)?.quantity || 0;
                    const finalStock = Number(stockRow.stock_quantity || 0) + originalQty - newQty;

                    if (finalStock < 0) {
                        throw new Error(`Insufficient stock for variant ${variantId}`);
                    }
                }

                db.prepare(`
                    UPDATE sales
                    SET total_amount = @total_amount,
                        payment_method = @payment_method,
                        customer_id = @customer_id
                    WHERE id = @sale_id
                `).run({
                    sale_id: saleId,
                    total_amount: data.totalAmount ?? recalculatedTotal,
                    payment_method: data.paymentMethod ?? existingSale.payment_method,
                    customer_id: data.customerId ?? existingSale.customer_id ?? null,
                });

                // Update Hire Purchase Agreement if applicable
                const newPaymentMethod = data.paymentMethod ?? existingSale.payment_method;
                const newTotalAmount = data.totalAmount ?? recalculatedTotal;
                const newCustomerId = data.customerId ?? existingSale.customer_id;

                if (newPaymentMethod === 'HIRE_PURCHASE') {
                    const hpAgreement = db.prepare('SELECT id, balance_due FROM hire_purchase_agreements WHERE sale_id = ?').get(saleId) as any;
                    
                    if (hpAgreement) {
                        // Existing HP agreement - update amount
                        const amountDiff = newTotalAmount - (data.totalAmount ? existingSale.total_amount : existingSale.total_amount);
                        const newBalanceDue = Math.max(0, hpAgreement.balance_due + amountDiff);
                        
                        db.prepare(`
                            UPDATE hire_purchase_agreements 
                            SET total_amount = ?, balance_due = ?
                            WHERE id = ?
                        `).run(newTotalAmount, newBalanceDue, hpAgreement.id);
                    } else if (newCustomerId) {
                        // No existing HP agreement but payment method is now HP - create one
                        const nextPaymentDate = calculateNextPaymentDate(data.hpDuration || 'TWO_WEEKS');
                        const balanceDue = newTotalAmount - (data.depositAmount || 0);
                        
                        db.prepare(`
                            INSERT INTO hire_purchase_agreements (customer_id, sale_id, total_amount, balance_due, status, next_payment_date)
                            VALUES (?, ?, ?, ?, 'ACTIVE', ?)
                        `).run(newCustomerId, saleId, newTotalAmount, balanceDue, nextPaymentDate);
                    }
                } else {
                    // Payment method is not HP anymore - mark any existing HP agreement as cancelled or update status
                    db.prepare('UPDATE hire_purchase_agreements SET status = ? WHERE sale_id = ? AND status = ?')
                        .run('CANCELLED', saleId, 'ACTIVE');
                }

                deleteItemsStmt.run(saleId);

                for (const item of newQtyByVariant.values()) {
                    const currentStock = variantStmt.get(item.variantId) as any;
                    const originalQty = existingQtyByVariant.get(item.variantId) || 0;
                    const finalStock = Number(currentStock.stock_quantity || 0) + originalQty - item.quantity;
                    const costPriceAtSale = Number(currentStock.cost_price || 0);

                    insertItemStmt.run({
                        sale_id: saleId,
                        product_id: item.productId,
                        variant_id: item.variantId,
                        quantity: item.quantity,
                        price_at_sale: item.price,
                        discount_amount: 0,
                        cost_price_at_sale: costPriceAtSale,
                    });

                    adjustStockStmt.run(finalStock, item.variantId);
                }

                return { saleId, totalAmount: data.totalAmount ?? recalculatedTotal };
            })();

            audit(db, {
                userId: data.userId,
                action: 'SALE_UPDATE',
                details: `Updated sale #${data.saleId} to GH₵ ${result.totalAmount}`,
                entity: 'sale',
                entityId: result.saleId,
            });

            return { success: true, saleId: result.saleId, totalAmount: result.totalAmount };
        } catch (error: any) {
            console.error('Failed to update sale:', error);
            return { success: false, error: error.message };
        }
    });

    // Get Refunds
    ipcMain.handle('get-refunds', async (_event, { page = 1, limit = 10, search = '' } = {}) => {
        if (!db) return { data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
        try {
            const offset = (page - 1) * limit;
            let query = `
                SELECT r.*, u.username as cashier_name, s.payment_method as original_payment_method
                FROM refunds r
                LEFT JOIN users u ON r.user_id = u.id
                LEFT JOIN sales s ON r.sale_id = s.id
            `;
            const countQuery = `SELECT COUNT(*) as count FROM refunds r`;

            const params: any[] = [];
            if (search) {
                const searchSql = ` WHERE r.reason LIKE ? OR r.sale_id LIKE ?`;
                query += searchSql;
                // countQuery += searchSql; // Simplification: count query needs to be constructed properly if search is involved, but for now let's focus on main data
                params.push(`%${search}%`, `%${search}%`);
            }

            query += ` ORDER BY r.timestamp DESC LIMIT ? OFFSET ?`;

            const refunds = db.prepare(query).all(...params, limit, offset);

            // For count, we need simpler logic or just get total count for now
            const totalResult = db.prepare('SELECT COUNT(*) as count FROM refunds').get() as any;
            const total = totalResult.count;
            const totalPages = Math.ceil(total / limit);

            return {
                data: refunds,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages
                }
            };
        } catch (error) {
            console.error('Failed to get refunds:', error);
            return { data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
        }
    });

    // Search Sales by Phone
    ipcMain.handle('search-sales-by-phone', async (_event, phone) => {
        if (!db) return [];
        try {
            const normalizedPhone = phone ? phone.replace(/[\s\-\(\)]/g, '') : null;
            if (!normalizedPhone) return [];

            return db.prepare(`
                SELECT s.*, u.username as cashier_name
                FROM sales s
                JOIN customers c ON s.customer_id = c.id
                LEFT JOIN users u ON s.user_id = u.id
                WHERE c.phone = ?
                ORDER BY s.timestamp DESC
                LIMIT 5
            `).all(normalizedPhone);
        } catch (error) {
            console.error('Failed to search sales by phone:', error);
            return [];
        }
    });

    // Search Sales by Customer Name (partial match)
    ipcMain.handle('search-sales-by-customer-name', async (_event, name) => {
        if (!db) return [];
        try {
            const q = name ? name.trim() : '';
            if (!q) return [];

            const like = `%${q}%`;
            return db.prepare(`
                SELECT s.*, u.username as cashier_name
                FROM sales s
                JOIN customers c ON s.customer_id = c.id
                LEFT JOIN users u ON s.user_id = u.id
                WHERE LOWER(c.name) LIKE LOWER(?)
                ORDER BY s.timestamp DESC
                LIMIT 10
            `).all(like);
        } catch (error) {
            console.error('Failed to search sales by customer name:', error);
            return [];
        }
    });
}
