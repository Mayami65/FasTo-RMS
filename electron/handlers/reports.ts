import type { IpcMain } from "electron";
import type { AppDatabase } from '../db';

function getLocalDateForSqlInput(date: Date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function registerReportHandlers(ipcMain: IpcMain, db: AppDatabase) {

    // One-time fix for ISO strings if any still exist in the old format (UTC 'Z' or 'T')
    // This isn't a full migration but it helps consistency for the date() function
    try {
        db.prepare("UPDATE sales SET timestamp = replace(timestamp, 'Z', '') WHERE timestamp LIKE '%Z'").run();
    } catch (e) { /* ignore */ }

    // Helper for Sales Report Logic
    function getSalesReportData(startDate: string, endDate: string, page: number = 1, limit: number = 10, search: string = '') {
        const totalInDb = db.prepare("SELECT COUNT(*) as count FROM sales").get() as any;
        console.log(`[REPORT] Total sales in entire database: ${totalInDb.count}`);
        console.log(`[REPORT] Loading data for ${startDate} to ${endDate}, page ${page}, search "${search}"`);
        if (!db) {
            return {
                sales: [],
                summary: {
                    totalRevenue: 0,
                    totalProfit: 0,
                    totalTransactions: 0,
                    totalItemsSold: 0,
                    paymentBreakdown: { CASH: 0, MOBILE_MONEY: 0, HIRE_PURCHASE: 0, BANK_CARD: 0 },
                },
                pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }
            };
        }

        const offset = (page - 1) * limit;
        const sDate = startDate.trim();
        const eDate = endDate.trim();

        let whereClause = `WHERE date(s.timestamp) BETWEEN ? AND ?`;
        const params: any[] = [sDate, eDate];

        if (search) {
            whereClause += ` AND (s.id LIKE ? OR u.username LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        // 1. Get total count for pagination
        const countResult = db.prepare(`
            SELECT COUNT(*) as count FROM sales s
            ${whereClause}
        `).get(...params) as any;
        const totalTransactions = countResult?.count || 0;
        const totalPages = Math.ceil(totalTransactions / limit);
        console.log(`[REPORT] Found ${totalTransactions} transactions for range ${sDate} to ${eDate}`);

        const sales = db.prepare(`
            SELECT
                s.id, s.total_amount, s.payment_method, s.timestamp, s.user_id,
                s.momo_transaction_id, s.momo_provider,
                u.username as cashier_name
            FROM sales s
            LEFT JOIN users u ON s.user_id = u.id
            ${whereClause}
            ORDER BY s.timestamp DESC
            LIMIT ? OFFSET ?
        `).all(...params, limit, offset) as any[];

        if (sales.length > 0) {
            console.log(`[REPORT] Sample timestamp: "${sales[0].timestamp}", Substr: "${sales[0].timestamp.substring(0, 10)}"`);
        } else {
            const raw = db.prepare("SELECT timestamp FROM sales ORDER BY id DESC LIMIT 1").get() as any;
            if (raw) {
                console.log(`[REPORT] No results found. Latest DB timestamp: "${raw.timestamp}", Looking for range: ${startDate} to ${endDate}`);
            } else {
                console.log(`[REPORT] No results found and DB is empty.`);
            }
        }

        for (const sale of sales) {
            sale.items = db.prepare(`
                SELECT si.id, si.sale_id, si.product_id, si.quantity, si.price_at_sale, p.name as product_name
                FROM sale_items si
                JOIN products p ON si.product_id = p.id
                WHERE si.sale_id = ?
                ORDER BY si.id ASC
            `).all(sale.id);
        }

        // 3. Get Items Sold and Cost for the filtered transactions
        const itemsResult = db.prepare(`
            SELECT SUM(si.quantity) as total_items, SUM(si.quantity * p.cost_price) as total_cost
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            JOIN products p ON si.product_id = p.id
            WHERE date(s.timestamp) BETWEEN ? AND ?
        `).get(sDate, eDate) as any;

        const totalRevenue = sales.reduce((sum: number, sale: any) => sum + sale.total_amount, 0);
        const totalItemsSold = itemsResult?.total_items || 0;
        const totalCost = itemsResult?.total_cost || 0;

        // Calculate Summary for the WHOLE range (not just filtered/paginated)
        const totalRevenueInRangeResult = db.prepare(`SELECT SUM(total_amount) as total FROM sales s WHERE date(s.timestamp) BETWEEN ? AND ?`).get(sDate, eDate) as any;
        const totalTransactionsInRangeResult = db.prepare(`SELECT COUNT(*) as count FROM sales s WHERE date(s.timestamp) BETWEEN ? AND ?`).get(sDate, eDate) as any;

        const paymentBreakdownResult = db.prepare(`
            SELECT payment_method, SUM(total_amount) as total 
            FROM sales s 
            WHERE date(s.timestamp) BETWEEN ? AND ?
            GROUP BY payment_method
        `).all(sDate, eDate) as any[];

        const paymentBreakdown = {
            CASH: 0,
            MOBILE_MONEY: 0,
            HIRE_PURCHASE: 0,
            BANK_CARD: 0,
        };

        paymentBreakdownResult.forEach((row: any) => {
            const method = row.payment_method as keyof typeof paymentBreakdown;
            if (method in paymentBreakdown) {
                paymentBreakdown[method] = row.total;
            }
        });

        return {
            sales,
            summary: {
                totalRevenue: totalRevenueInRangeResult.total || 0,
                totalProfit: (totalRevenueInRangeResult.total || 0) - totalCost,
                totalTransactions: totalTransactionsInRangeResult.count || 0,
                totalItemsSold,
                paymentBreakdown,
            },
            pagination: {
                total: totalTransactions,
                page,
                limit,
                totalPages
            }
        };
    }

    // Get Sales Report
    ipcMain.handle('get-sales-report', async (_event, { startDate, endDate, page = 1, limit = 10, search = '' } = {}) => {
        try {
            // Default to today if no dates provided
            const today = getLocalDateForSqlInput();
            const start = startDate || today;
            const end = endDate || today;
            return getSalesReportData(start, end, page, limit, search);
        } catch (error) {
            console.error('Failed to get sales report:', error);
            return { sales: [], summary: {}, pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
        }
    });

    // Get Dashboard Stats
    ipcMain.handle('get-dashboard-stats', async () => {
        if (!db) return null;
        try {
            const today = getLocalDateForSqlInput(new Date());
            const yesterdayDate = new Date();
            yesterdayDate.setDate(yesterdayDate.getDate() - 1);
            const yesterday = getLocalDateForSqlInput(yesterdayDate);

            // 1. Today's Revenue and Transactions
            const todayStats = db.prepare(`
                SELECT 
                    COUNT(*) as transactions,
                    SUM(total_amount) as revenue
                FROM sales 
                WHERE date(timestamp) = ?
            `).get(today) as any;

            // 2. Yesterday's Revenue and Transactions (for trend)
            const yesterdayStats = db.prepare(`
                SELECT 
                    COUNT(*) as transactions,
                    SUM(total_amount) as revenue
                FROM sales 
                WHERE date(timestamp) = ?
            `).get(yesterday) as any;

            // 3. Active Agreements
            const activeAgreements = db.prepare(`
                SELECT COUNT(*) as count FROM hire_purchase_agreements WHERE TRIM(UPPER(status)) = 'ACTIVE'
            `).get() as any;

            // 4. Low Stock Count
            const lowStock = db.prepare(`
                SELECT COUNT(*) as count FROM products WHERE stock_quantity <= reorder_level AND stock_quantity > 0
            `).get() as any;

            const calculateTrend = (current: number, previous: number) => {
                if (previous === 0) return current > 0 ? 100 : 0;
                return ((current - previous) / previous) * 100;
            };

            return {
                todayRevenue: todayStats.revenue || 0,
                todayTransactions: todayStats.transactions || 0,
                revenueTrend: calculateTrend(todayStats.revenue || 0, yesterdayStats.revenue || 0),
                transactionsTrend: calculateTrend(todayStats.transactions || 0, yesterdayStats.transactions || 0),
                activeAgreements: activeAgreements.count || 0,
                lowStockCount: lowStock.count || 0
            };
        } catch (error) {
            console.error('Failed to get dashboard stats:', error);
            return null;
        }
    });

    // Get Top Products
    ipcMain.handle('get-top-products', async (_event, { limit = 5 } = {}) => {
        if (!db) return [];
        try {
            // Get top selling products by revenue
            const topProducts = db.prepare(`
                SELECT 
                    p.id, 
                    p.name, 
                    SUM(si.quantity) as total_quantity, 
                    SUM(si.quantity * si.price_at_sale) as total_revenue
                FROM sale_items si
                JOIN sales s ON si.sale_id = s.id
                JOIN products p ON si.product_id = p.id
                GROUP BY p.id
                ORDER BY total_revenue DESC
                LIMIT ?
            `).all(limit);
            return topProducts;
        } catch (error) {
            console.error('Failed to get top products:', error);
            return [];
        }
    });

    // Get Category Performance
    ipcMain.handle('get-category-performance', async (_event, { startDate, endDate }) => {
        if (!db) return [];
        try {
            const startStr = `${startDate} 00:00:00`;
            const endStr = `${endDate} 23:59:59`;

            // Query to get sales and profit by category
            return db.prepare(`
                SELECT 
                    c.id,
                    c.name,
                    c.color,
                    COUNT(si.id) as units_sold,
                    SUM(si.quantity * si.price_at_sale) as total_sales,
                    SUM(si.quantity * (si.price_at_sale - p.cost_price)) as total_profit
                FROM categories c
                LEFT JOIN products p ON p.category_id = c.id
                LEFT JOIN sale_items si ON si.product_id = p.id
                LEFT JOIN sales s ON si.sale_id = s.id
                WHERE date(s.timestamp) BETWEEN ? AND ? OR s.id IS NULL
                GROUP BY c.id
                ORDER BY total_sales DESC
            `).all(startDate, endDate);
        } catch (error) {
            console.error('Failed to get category performance:', error);
            return [];
        }
    });

    // Get Daily Sales Chart
    ipcMain.handle('get-daily-sales-chart', async (_event, days = 7) => {
        if (!db) return [];
        try {
            const result = db.prepare(`
                SELECT 
                    strftime('%Y-%m-%d', timestamp) as date,
                    SUM(total_amount) as revenue
                FROM sales
                WHERE timestamp >= date('now', '-' || ? || ' days')
                GROUP BY date
                ORDER BY date ASC
            `).all(days);
            return result;
        } catch (error) {
            console.error('Failed to get daily sales chart:', error);
            return [];
        }
    });

    // Get Daily Summary for Closing
    ipcMain.handle('get-daily-summary', async (_event, dateStr) => {
        if (!db) return null;
        try {
            const date = dateStr || getLocalDateForSqlInput();
            const startStr = `${date} 00:00:00`;
            const endStr = `${date} 23:59:59`;

            // Check if already closed
            const existingClosing = db.prepare('SELECT * FROM day_closings WHERE closing_date = ?').get(date) as any;

            // Calculate totals from sales
            const salesStats = db.prepare(`
                SELECT 
                    COUNT(*) as total_sales_count,
                    SUM(total_amount) as total_revenue
                FROM sales 
                WHERE date(timestamp) = ?
            `).get(date) as any;

            const paymentStats = db.prepare(`
                SELECT 
                    payment_method,
                    SUM(total_amount) as total
                FROM sales
                WHERE date(timestamp) = ?
                GROUP BY payment_method
            `).all(date) as any[];

            const getPaymentTotal = (method: string) => {
                const stat = paymentStats.find(s => s.payment_method === method);
                return stat ? stat.total : 0;
            };

            return {
                is_closed: !!existingClosing,
                total_revenue: salesStats.total_revenue || 0,
                total_sales_count: salesStats.total_sales_count || 0,
                cash_total: getPaymentTotal('CASH'),
                momo_total: getPaymentTotal('MOBILE_MONEY'),
                hp_total: getPaymentTotal('HIRE_PURCHASE'),
                notes: existingClosing?.notes || ''
            };
        } catch (error) {
            console.error('Failed to get daily summary:', error);
            return null;
        }
    });

    // Get Closing History
    ipcMain.handle('get-closing-history', async () => {
        if (!db) return [];
        try {
            return db.prepare('SELECT * FROM day_closings ORDER BY closing_date DESC LIMIT 30').all();
        } catch (error) {
            console.error('Failed to get closing history:', error);
            return [];
        }
    });

    // Close Day
    ipcMain.handle('close-day-transactions', async (_event, { date, summary, notes, userId }) => {
        if (!db) return { success: false, error: 'Database not initialized' };
        try {
            const insert = db.prepare(`
                INSERT INTO day_closings (closing_date, total_sales_count, total_revenue, cash_total, momo_total, hp_total, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            insert.run(
                date,
                summary.total_sales_count,
                summary.total_revenue,
                summary.cash_total,
                summary.momo_total,
                summary.hp_total,
                notes
            );

            return { success: true };
        } catch (error: any) {
            console.error('Failed to close day:', error);
            return { success: false, error: error.message };
        }
    });
}
