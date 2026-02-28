import { useState, useEffect } from 'react';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    DollarSign,
    ShoppingCart,
    Package,
    Users,
    AlertTriangle,
    TrendingUp
} from 'lucide-react';
import { SalesTrendChart } from '@/features/dashboard/SalesTrendChart';
import { TopProductsWidget } from '@/features/dashboard/TopProductsWidget';
import { subDays, format } from 'date-fns';

export default function Dashboard() {
    const [stats, setStats] = useState<any>({
        todaySales: 0,
        todayRevenue: 0,
        revenueTrend: 0,
        transactionsTrend: 0,
        activeHP: 0,
        lowStockCount: 0,
        totalProducts: 0
    });
    const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
    const [recentSales, setRecentSales] = useState<any[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const today = new Date();
            const todayStr = format(today, 'yyyy-MM-dd');
            const sevenDaysAgo = subDays(today, 6);
            const sevenDaysAgoStr = format(sevenDaysAgo, 'yyyy-MM-dd');

            // 1. Fetch Dashboard Stats (Trends, Revenue, etc.)
            const dashboardStats = await window.api.getDashboardStats();

            // 2. Fetch Top Products
            const topProductsData = await window.api.getTopProducts(5);
            setTopProducts(topProductsData);

            // 3. Fetch recent sales for the list
            const salesResponse = await window.api.getSalesReport({ startDate: todayStr, endDate: todayStr, limit: 5 });
            setRecentSales(salesResponse?.sales || []);

            // 4. Fetch Chart Data (Revenue per day - last 7 days)
            // We still use getSalesReport for this to generate the chart data
            const last7DaysSales = await window.api.getSalesReport({ startDate: sevenDaysAgoStr, endDate: todayStr, limit: 1000 });
            const allSales = last7DaysSales?.sales || [];

            const dailyRevenue: Record<string, number> = {};
            // Initialize last 7 days with 0
            for (let i = 0; i < 7; i++) {
                const d = subDays(today, 6 - i);
                dailyRevenue[format(d, 'yyyy-MM-dd')] = 0;
            }

            allSales.forEach((s: any) => {
                const dateKey = s.timestamp.split('T')[0];
                if (dailyRevenue[dateKey] !== undefined) {
                    dailyRevenue[dateKey] += s.total_amount;
                }
            });

            const chartDataFormatted = Object.keys(dailyRevenue).map(date => ({
                date,
                amount: dailyRevenue[date]
            }));
            setChartData(chartDataFormatted);

            // 5. Fetch low stock for the list
            const productsResponse = await window.api.getProducts({ limit: 1000 });
            const products = productsResponse?.data || [];
            const lowStock = products.filter((p: any) => p.stock_quantity <= p.reorder_level);
            setLowStockProducts(lowStock.slice(0, 5));

            // Set Stats
            if (dashboardStats) {
                setStats({
                    todaySales: dashboardStats.todayTransactions,
                    todayRevenue: dashboardStats.todayRevenue,
                    revenueTrend: dashboardStats.revenueTrend,
                    transactionsTrend: dashboardStats.transactionsTrend,
                    activeHP: dashboardStats.activeAgreements,
                    lowStockCount: dashboardStats.lowStockCount,
                    totalProducts: productsResponse?.pagination?.total || 0 // Keep total products from product fetch
                });
            }

        } catch (error) {
            console.error('Failed to load dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 flex items-center justify-center h-full">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-end justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 font-medium">Welcome back, <span className="text-primary font-bold">Admin</span>. Here's your business at a glance.</p>
                </div>
                <div className="hidden md:block">
                    <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100 font-bold px-3 py-1.5 flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        System Synchronized
                    </Badge>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Today's Revenue"
                    value={`GH₵ ${stats.todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={DollarSign}
                    trend={{ value: Math.abs(stats.revenueTrend), isPositive: stats.revenueTrend >= 0 }}
                    className="shadow-sm hover:shadow-md transition-shadow border-slate-200"
                />
                <StatCard
                    title="Today's Sales"
                    value={stats.todaySales}
                    icon={ShoppingCart}
                    trend={{ value: Math.abs(stats.transactionsTrend), isPositive: stats.transactionsTrend >= 0 }}
                    className="shadow-sm hover:shadow-md transition-shadow border-slate-200"
                />
                <StatCard
                    title="Active HP Agreements"
                    value={stats.activeHP}
                    icon={Users}
                    className="shadow-sm hover:shadow-md transition-shadow border-slate-200"
                />
                <StatCard
                    title="Inventory Alerts"
                    value={stats.lowStockCount}
                    icon={AlertTriangle}
                    className={cn(
                        "shadow-sm hover:shadow-md transition-shadow",
                        stats.lowStockCount > 0 ? "border-l-4 border-l-amber-500 border-slate-200" : "border-slate-200"
                    )}
                />
            </div>

            {/* Charts & Lists Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Graph */}
                <div className="lg:col-span-2 min-w-0">
                    <SalesTrendChart data={chartData} />
                </div>

                {/* Top Products */}
                <div className="lg:col-span-1">
                    <TopProductsWidget products={topProducts} />
                </div>
            </div>

            {/* Recent & Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="panel border-none shadow-sm">
                    <CardHeader className="panel-header">
                        <CardTitle className="flex items-center gap-3 text-lg font-black text-slate-800">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {recentSales.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-slate-400">
                                <ShoppingCart className="h-10 w-10 opacity-20 mb-2" />
                                <p className="text-sm font-bold uppercase tracking-widest">No transactions yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentSales.map((sale: any) => (
                                    <div key={sale.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-50 hover:border-slate-100 hover:bg-slate-50 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border border-slate-100 font-bold text-xs text-slate-500 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                                                #{sale.id.toString().slice(-2)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">Sale Transaction</p>
                                                <p className="text-[11px] font-bold text-slate-400 uppercase">
                                                    {format(new Date(sale.timestamp), 'hh:mm a')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-slate-900 text-sm">GH₵ {sale.total_amount.toFixed(2)}</p>
                                            <Badge variant="outline" className="text-[10px] font-black h-5 px-1.5 uppercase border-slate-200 text-slate-500">{sale.payment_method.replace('_', ' ')}</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className={cn(
                    "panel border-none shadow-sm",
                    stats.lowStockCount > 0 ? "bg-amber-50/20" : ""
                )}>
                    <CardHeader className="panel-header">
                        <CardTitle className="flex items-center gap-3 text-lg font-black text-slate-800">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            Inventory Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {lowStockProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-emerald-50 border-dashed">
                                <div className="p-4 bg-emerald-50 rounded-full mb-4">
                                    <Package className="h-10 w-10 text-emerald-500" />
                                </div>
                                <h3 className="font-black text-slate-900">Stock Healthy</h3>
                                <p className="text-sm text-slate-500 font-medium">All items are currently above reorder levels.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {lowStockProducts.map((product: any) => (
                                    <div key={product.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm group hover:border-amber-200 transition-all">
                                        <div className="min-w-0 flex-1 pr-3">
                                            <p className="font-bold text-slate-900 text-sm truncate group-hover:text-amber-700 transition-colors">{product.name}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU: {product.sku || 'N/A'}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] h-6 px-2">{product.stock_quantity} LEFT</Badge>
                                        </div>
                                    </div>
                                ))}
                                <Button variant="link" className="w-full text-slate-400 font-bold text-xs uppercase hover:text-primary" onClick={() => window.location.hash = '#/inventory'}>
                                    View full Inventory
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
