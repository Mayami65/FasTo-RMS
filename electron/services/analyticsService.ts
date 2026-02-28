import type { AppDatabase } from '../db';

export interface AnalyticsRange {
    startDate: string; // ISO 8601 (e.g., "2023-10-01T00:00:00Z")
    endDate: string;   // ISO 8601
    compare?: "previous_period" | "previous_month" | "previous_year";
    storeId?: string;
}

export class AnalyticsService {
    private db: AppDatabase;

    constructor(db: AppDatabase) {
        this.db = db;
    }

    /**
     * Executive Overview: High-level KPIs
     */
    getExecutiveOverview(range: AnalyticsRange) {
        if (!this.db) return null;

        try {
            console.log("\n----- ANALYTICS DEBUG -----");
            console.log("Input Range:", range);
            const debugStmt = this.db.prepare("SELECT id, timestamp FROM sales ORDER BY id DESC LIMIT 5");
            console.log("Recent DB Rows:", debugStmt.all());
            console.log("---------------------------\n");

            // 1. Core Revenue & Profit (Cash, MoMo, HP)
            const revenueStmt = this.db.prepare(`
                SELECT 
                    COUNT(s.id) as totalTransactions,
                    SUM(s.total_amount) as netRevenue,
                    SUM(s.discount_amount) as totalDiscounts
                FROM sales s
                WHERE s.timestamp >= ? AND s.timestamp <= ?
            `);
            const revenueData = revenueStmt.get(range.startDate, range.endDate) as any;

            // Gross Profit requires joining sale_items to get cost_price
            const profitStmt = this.db.prepare(`
                SELECT SUM((si.price_at_sale - si.cost_price_at_sale) * si.quantity) as grossProfit
                FROM sale_items si
                JOIN sales s ON si.sale_id = s.id
                WHERE s.timestamp >= ? AND s.timestamp <= ?
            `);
            const profitData = profitStmt.get(range.startDate, range.endDate) as any;

            // 2. Active Customers (Distinct customers who bought in this period)
            const activeCustStmt = this.db.prepare(`
                SELECT COUNT(DISTINCT customer_id) as activeCustomers
                FROM sales
                WHERE timestamp >= ? AND timestamp <= ? AND customer_id IS NOT NULL
            `);
            const activeCustData = activeCustStmt.get(range.startDate, range.endDate) as any;

            // 3. Refund Metrics
            const refundStmt = this.db.prepare(`
                SELECT 
                    COUNT(r.id) as refundCount,
                    SUM(r.refund_amount) as totalRefundAmount
                FROM refunds r
                WHERE r.timestamp >= ? AND r.timestamp <= ?
            `);
            const refundData = refundStmt.get(range.startDate, range.endDate) as any;

            // 4. Revenue Composition (Walk-in vs Registered)
            const compStmt = this.db.prepare(`
                SELECT 
                    SUM(CASE WHEN customer_id IS NULL THEN total_amount ELSE 0 END) as walkInRevenue,
                    SUM(CASE WHEN customer_id IS NOT NULL THEN total_amount ELSE 0 END) as registeredRevenue
                FROM sales
                WHERE timestamp >= ? AND timestamp <= ?
            `);
            const compData = compStmt.get(range.startDate, range.endDate) as any;

            // 5. Daily Trendline (grouped by DATE(timestamp))
            const trendStmt = this.db.prepare(`
                SELECT 
                    DATE(timestamp) as date,
                    SUM(total_amount) as revenue
                FROM sales
                WHERE timestamp >= ? AND timestamp <= ?
                GROUP BY DATE(timestamp)
                ORDER BY DATE(timestamp) ASC
            `);
            const trendData = trendStmt.all(range.startDate, range.endDate);

            return {
                summary: {
                    netRevenue: revenueData?.netRevenue || 0,
                    grossProfit: profitData?.grossProfit || 0,
                    totalTransactions: revenueData?.totalTransactions || 0,
                    activeCustomers: activeCustData?.activeCustomers || 0,
                    totalRefundAmount: refundData?.totalRefundAmount || 0,
                    refundRate: revenueData?.netRevenue ? ((refundData?.totalRefundAmount || 0) / revenueData.netRevenue) * 100 : 0,
                    walkInRevenue: compData?.walkInRevenue || 0,
                    registeredRevenue: compData?.registeredRevenue || 0
                },
                trend: trendData
            };

        } catch (error) {
            console.error("Executive Overview Analytics Failed:", error);
            return null;
        }
    }

    /**
     * Customer Intelligence: VIPs, Retention, Dormancy
     */
    getCustomerIntelligence(range: AnalyticsRange) {
        if (!this.db) return null;
        try {
            // 1. VIP List (Top 20 Customers by LTV in the period)
            const vipStmt = this.db.prepare(`
                SELECT 
                    c.id, c.name, c.phone,
                    COUNT(s.id) as totalVisits,
                    SUM(s.total_amount) as totalSpend,
                    MAX(s.timestamp) as lastVisit
                FROM customers c
                JOIN sales s ON c.id = s.customer_id
                WHERE s.timestamp >= ? AND s.timestamp <= ?
                GROUP BY c.id
                ORDER BY totalSpend DESC
                LIMIT 20
            `);
            const vipData = vipStmt.all(range.startDate, range.endDate);

            // 2. Repeat vs New (Simple metric: How many unique customers bought > 1 time)
            const retentionStmt = this.db.prepare(`
                SELECT 
                    COUNT(customer_id) as customerCount,
                    SUM(CASE WHEN visit_count > 1 THEN 1 ELSE 0 END) as repeatCustomers,
                    SUM(CASE WHEN visit_count = 1 THEN 1 ELSE 0 END) as newCustomers
                FROM (
                    SELECT customer_id, COUNT(id) as visit_count
                    FROM sales
                    WHERE timestamp >= ? AND timestamp <= ? AND customer_id IS NOT NULL
                    GROUP BY customer_id
                )
            `);
            const retentionData = retentionStmt.get(range.startDate, range.endDate) as any;

            // 3. Dormancy (Top spenders who haven't bought in 60 days from the END date)
            const sixtyDaysAgo = new Date(new Date(range.endDate).getTime() - (60 * 24 * 60 * 60 * 1000)).toISOString();

            const dormantStmt = this.db.prepare(`
                SELECT 
                    c.id, c.name, c.phone,
                    MAX(s.timestamp) as last_purchase_date,
                    SUM(s.total_amount) as total_historical_spend
                FROM customers c
                JOIN sales s ON c.id = s.customer_id
                GROUP BY c.id
                HAVING last_purchase_date < ?
                ORDER BY total_historical_spend DESC
                LIMIT 15
            `);
            const dormantData = dormantStmt.all(sixtyDaysAgo);

            return {
                vipList: vipData,
                retention: {
                    total: retentionData?.customerCount || 0,
                    repeat: retentionData?.repeatCustomers || 0,
                    new: retentionData?.newCustomers || 0
                },
                dormantList: dormantData
            };
        } catch (error) {
            console.error("Customer Intelligence Analytics Failed:", error);
            return null;
        }
    }

    /**
     * Product Intelligence: Top Sellers, Slow Movers, Category Performance
     */
    getProductIntelligence(range: AnalyticsRange) {
        if (!this.db) return null;
        try {
            // 1. Top Selling Products (by Revenue & Quantity)
            const topProductsStmt = this.db.prepare(`
                SELECT 
                    p.id, p.name, 
                    SUM(si.quantity) as total_quantity,
                    SUM(si.price_at_sale * si.quantity) as total_revenue,
                    SUM((si.price_at_sale - si.cost_price_at_sale) * si.quantity) as total_profit
                FROM sale_items si
                JOIN sales s ON si.sale_id = s.id
                JOIN products p ON si.product_id = p.id
                WHERE s.timestamp >= ? AND s.timestamp <= ?
                GROUP BY p.id
                ORDER BY total_revenue DESC
                LIMIT 10
            `);
            const topProducts = topProductsStmt.all(range.startDate, range.endDate);

            // 2. Slow-Moving Inventory (Products with stock > 0 but low/no sales)
            const slowMoversStmt = this.db.prepare(`
                SELECT 
                    p.id, p.name, 
                    SUM(pv.stock_quantity) as current_stock,
                    COALESCE(SUM(si.quantity), 0) as units_sold_in_period
                FROM products p
                JOIN product_variants pv ON p.id = pv.product_id
                LEFT JOIN sale_items si ON p.id = si.product_id 
                    AND si.sale_id IN (SELECT id FROM sales WHERE timestamp >= ? AND timestamp <= ?)
                GROUP BY p.id
                HAVING current_stock > 0
                ORDER BY units_sold_in_period ASC, current_stock DESC
                LIMIT 15
            `);
            const slowMovers = slowMoversStmt.all(range.startDate, range.endDate);

            // 3. Category Performance (Revenue distribution)
            const categoryStmt = this.db.prepare(`
                SELECT 
                    c.name as category_name,
                    SUM(si.quantity) as total_quantity,
                    SUM(si.price_at_sale * si.quantity) as total_revenue
                FROM sale_items si
                JOIN sales s ON si.sale_id = s.id
                JOIN products p ON si.product_id = p.id
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE s.timestamp >= ? AND s.timestamp <= ?
                GROUP BY c.id
                ORDER BY total_revenue DESC
            `);
            const categoryPerf = categoryStmt.all(range.startDate, range.endDate);

            return {
                topProducts,
                slowMovers,
                categoryPerformance: categoryPerf
            };
        } catch (error) {
            console.error("Product Intelligence Analytics Failed:", error);
            return null;
        }
    }

    /**
     * Operational Intelligence: Cashier Performance, Hourly Heatmap
     */
    getOperationalIntelligence(range: AnalyticsRange) {
        if (!this.db) return null;
        try {
            // 1. Cashier Performance
            const cashierStmt = this.db.prepare(`
                SELECT 
                    u.username as cashier_name,
                    COUNT(s.id) as transactions_handled,
                    SUM(s.total_amount) as revenue_generated
                FROM sales s
                JOIN users u ON s.user_id = u.id
                WHERE s.timestamp >= ? AND s.timestamp <= ?
                GROUP BY u.username
                ORDER BY revenue_generated DESC
            `);
            const cashierPerformance = cashierStmt.all(range.startDate, range.endDate);

            // 2. Hourly Sales Volume (Peak Trading Hours based on local timezone)
            // SQLite datetime('timestamp', 'localtime') helps group by the user's local hour
            const hourlyStmt = this.db.prepare(`
                SELECT 
                    STRFTIME('%H', datetime(timestamp, 'localtime')) as hour_of_day,
                    COUNT(id) as transaction_count,
                    SUM(total_amount) as hourly_revenue
                FROM sales
                WHERE timestamp >= ? AND timestamp <= ?
                GROUP BY hour_of_day
                ORDER BY hour_of_day ASC
            `);
            const hourlySales = hourlyStmt.all(range.startDate, range.endDate);

            // 3. Discount Impact
            const discountStmt = this.db.prepare(`
                SELECT 
                    SUM(discount_amount) as total_discount_given,
                    SUM(total_amount) as net_revenue
                FROM sales
                WHERE timestamp >= ? AND timestamp <= ?
            `);
            const discountImpact = discountStmt.get(range.startDate, range.endDate) as any;

            return {
                cashierPerformance,
                hourlySales,
                discounts: {
                    totalGiven: discountImpact?.total_discount_given || 0,
                    netRevenue: discountImpact?.net_revenue || 0,
                    impactPercentage: discountImpact?.net_revenue ? ((discountImpact.total_discount_given || 0) / discountImpact.net_revenue) * 100 : 0
                }
            };
        } catch (error) {
            console.error("Operational Intelligence Analytics Failed:", error);
            return null;
        }
    }
}

