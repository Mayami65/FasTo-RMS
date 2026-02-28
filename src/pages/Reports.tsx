import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { subDays, startOfMonth, endOfMonth } from 'date-fns';
import SummaryCard from '@/components/reports/SummaryCard';
import SalesChart from '@/components/reports/SalesChart';
import { useNavigate } from 'react-router-dom';
import { DollarSign, ShoppingBag, TrendingUp, Package, Lock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useFeatures } from '@/hooks/useFeatures';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DayClosing } from '@/features/reports/DayClosing';

export default function Reports() {
    const [dateRange, setDateRange] = useState<string>('7days');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { hasAdvancedReports } = useFeatures();

    if (!hasAdvancedReports) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center p-8 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="h-24 w-24 bg-slate-100 rounded-3xl flex items-center justify-center shadow-inner">
                    <Lock className="h-12 w-12 text-slate-400" />
                </div>
                <div className="max-w-md space-y-2">
                    <h2 className="text-3xl font-black text-slate-900">Advanced Analytics Locked</h2>
                    <p className="text-slate-500 font-medium">Detailed reporting and deep analytics are available exclusively in the <span className="text-primary font-black">PRO Edition</span>.</p>
                </div>
                <Button
                    onClick={() => navigate('/settings')}
                    className="font-black px-8 py-6 text-lg rounded-2xl shadow-xl shadow-primary/20"
                >
                    Upgrade Plan
                </Button>
            </div>
        );
    }


    // ... (rest of states)
    // State from Phase 1
    const [summary, setSummary] = useState({
        totalRevenue: 0,
        totalProfit: 0,
        totalTransactions: 0,
        totalItemsSold: 0,
        registeredRevenue: 0,
        walkInRevenue: 0
    });
    const [salesChartData, setSalesChartData] = useState<any[]>([]);

    // Customer Intelligence State
    const [vipList, setVipList] = useState<any[]>([]);
    const [retention, setRetention] = useState({ total: 0, repeat: 0, new: 0 });

    // Phase 2: Product & Operational Intelligence State
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [slowMovers, setSlowMovers] = useState<any[]>([]);
    const [categoryPerformance, setCategoryPerformance] = useState<any[]>([]);
    const [cashierPerformance, setCashierPerformance] = useState<any[]>([]);
    const [hourlySales, setHourlySales] = useState<any[]>([]);
    const [discounts, setDiscounts] = useState({ totalGiven: 0, netRevenue: 0, impactPercentage: 0 });

    useEffect(() => {
        loadData();
    }, [dateRange]);

    const getDateParams = () => {
        const today = new Date();
        let start = new Date();
        let end = new Date();

        switch (dateRange) {
            case 'today':
                start = today;
                end = today;
                break;
            case 'yesterday':
                start = subDays(today, 1);
                end = subDays(today, 1);
                break;
            case '7days':
                start = subDays(today, 6);
                end = today;
                break;
            case '30days':
                start = subDays(today, 29);
                end = today;
                break;
            case 'thisMonth':
                start = startOfMonth(today);
                end = endOfMonth(today);
                break;
            case 'lastMonth':
                start = startOfMonth(subDays(startOfMonth(today), 1));
                end = endOfMonth(subDays(startOfMonth(today), 1));
                break;
            default:
                start = subDays(today, 6);
                end = today;
        }

        // Convert local start/end bounds to UTC strings to match the database's new Date().toISOString() format
        return {
            startDate: new Date(start.setHours(0, 0, 0, 0)).toISOString(),
            endDate: new Date(end.setHours(23, 59, 59, 999)).toISOString()
        };
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const range = getDateParams();

            // 1. Executive Overview
            const overview = await (window as any).api.getExecutiveOverview(range);
            if (overview) {
                setSummary(overview.summary);
                setSalesChartData(overview.trend);
            }

            // 2. Customer Intelligence
            const custIntel = await (window as any).api.getCustomerIntelligence(range);
            if (custIntel) {
                setVipList(custIntel.vipList || []);
                setRetention(custIntel.retention || { total: 0, repeat: 0, new: 0 });
            }

            // 3. Product Intelligence
            const prodIntel = await (window as any).api.getProductIntelligence(range);
            if (prodIntel) {
                setTopProducts(prodIntel.topProducts || []);
                setSlowMovers(prodIntel.slowMovers || []);
                setCategoryPerformance(prodIntel.categoryPerformance || []);
            }

            // 4. Operational Intelligence
            const opsIntel = await (window as any).api.getOperationalIntelligence(range);
            if (opsIntel) {
                setCashierPerformance(opsIntel.cashierPerformance || []);
                setHourlySales(opsIntel.hourlySales || []);
                setDiscounts(opsIntel.discounts || { totalGiven: 0, netRevenue: 0, impactPercentage: 0 });
            }

        } catch (error) {
            console.error('Failed to load reports:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Business Analytics</h1>
                    <p className="text-muted-foreground mt-1">Premium intelligence for operations and growth.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select date range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="yesterday">Yesterday</SelectItem>
                            <SelectItem value="7days">Last 7 Days</SelectItem>
                            <SelectItem value="30days">Last 30 Days</SelectItem>
                            <SelectItem value="thisMonth">This Month</SelectItem>
                            <SelectItem value="lastMonth">Last Month</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={loadData} disabled={loading}>
                        Refresh
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="executive" className="space-y-6">
                <TabsList className="bg-white dark:bg-zinc-900 border p-1 h-11">
                    <TabsTrigger value="executive" className="px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                        Executive Overview
                    </TabsTrigger>
                    <TabsTrigger value="operations" className="px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                        Operations & Sales
                    </TabsTrigger>
                    <TabsTrigger value="products" className="px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                        Product Intelligence
                    </TabsTrigger>
                    <TabsTrigger value="customer" className="px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                        Customer Intelligence
                    </TabsTrigger>
                    <TabsTrigger value="day-closing" className="px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                        Day Closing
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: EXECUTIVE OVERVIEW */}
                <TabsContent value="executive" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <SummaryCard
                            title="Net Revenue"
                            value={`GH₵ ${summary.totalRevenue ? summary.totalRevenue.toFixed(2) : '0.00'}`}
                            icon={DollarSign}
                        />
                        <SummaryCard
                            title="Gross Profit"
                            value={`GH₵ ${summary.totalProfit ? summary.totalProfit.toFixed(2) : '0.00'}`}
                            icon={TrendingUp}
                            trend={summary.totalRevenue > 0 ? `${((summary.totalProfit / summary.totalRevenue) * 100).toFixed(0)}% margin` : undefined}
                            trendUp={true}
                        />
                        <SummaryCard
                            title="Total Transactions"
                            value={summary.totalTransactions ? summary.totalTransactions.toString() : '0'}
                            icon={ShoppingBag}
                        />
                        <SummaryCard
                            title="Active Customers"
                            value={summary.totalItemsSold ? summary.totalItemsSold.toString() : '0'}
                            icon={Package} // Reusing the old property mapping temporarily
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4 shadow-sm border-gray-200 dark:border-zinc-800">
                            <CardHeader>
                                <CardTitle>Revenue Trend</CardTitle>
                                <CardDescription>Daily performance overview.</CardDescription>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <SalesChart data={salesChartData} title="" type="bar" />
                            </CardContent>
                        </Card>

                        <Card className="col-span-3 shadow-sm border-gray-200 dark:border-zinc-800">
                            <CardHeader>
                                <CardTitle>Revenue Composition</CardTitle>
                                <CardDescription>Walk-in vs. Registered breakdown.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex items-center justify-center p-6 h-[300px]">
                                <div className="text-center w-full">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="text-left">
                                            <div className="text-sm text-muted-foreground flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary" /> Registered</div>
                                            <p className="text-2xl font-bold text-primary">GH₵ {summary.registeredRevenue?.toFixed(2) || '0.00'}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-muted-foreground flex items-center justify-end gap-2"><div className="w-3 h-3 rounded-full bg-slate-200" /> Walk-in</div>
                                            <p className="text-2xl font-bold text-slate-500">GH₵ {summary.walkInRevenue?.toFixed(2) || '0.00'}</p>
                                        </div>
                                    </div>

                                    {/* Visual Bar representation of composition */}
                                    <div className="h-8 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                                        {summary.totalRevenue > 0 ? (
                                            <>
                                                <div
                                                    className="h-full bg-primary transition-all duration-1000 flex items-center justify-center text-white text-xs font-bold"
                                                    style={{ width: `${(summary.registeredRevenue / summary.totalRevenue) * 100}%` }}
                                                >
                                                    {((summary.registeredRevenue / summary.totalRevenue) * 100).toFixed(0)}%
                                                </div>
                                                <div
                                                    className="h-full bg-slate-300 transition-all duration-1000 flex items-center justify-center text-slate-600 text-xs font-bold"
                                                    style={{ width: `${(summary.walkInRevenue / summary.totalRevenue) * 100}%` }}
                                                >
                                                    {((summary.walkInRevenue / summary.totalRevenue) * 100).toFixed(0)}%
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No Data</div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB 2: CUSTOMER INTELLIGENCE */}
                <TabsContent value="customer" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {/* Repeat vs New */}
                        <Card className="col-span-1 shadow-sm border-gray-200 dark:border-zinc-800">
                            <CardHeader>
                                <CardTitle>Retention Health</CardTitle>
                                <CardDescription>Repeat vs First-time buyers.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col justify-center gap-4">
                                <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-lg">
                                    <span className="text-sm font-medium">Repeat Customers</span>
                                    <span className="font-bold">{retention.repeat || 0}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-lg">
                                    <span className="text-sm font-medium">New Customers</span>
                                    <span className="font-bold">{retention.new || 0}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* VIP List */}
                        <Card className="col-span-2 shadow-sm border-gray-200 dark:border-zinc-800">
                            <CardHeader>
                                <CardTitle>VIP Customers</CardTitle>
                                <CardDescription>Sorted by Lifetime Value (Period Spend).</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Customer</TableHead>
                                            <TableHead className="text-center">Visits</TableHead>
                                            <TableHead className="text-right">Total Spend</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {vipList.map((vip: any, i: number) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-medium">
                                                    {vip.name}
                                                    <span className="block text-xs text-muted-foreground">{vip.phone}</span>
                                                </TableCell>
                                                <TableCell className="text-center">{vip.totalVisits}</TableCell>
                                                <TableCell className="text-right font-bold text-primary">GH₵ {vip.totalSpend.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                        {vipList.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                                                    No VIP data found for this period.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB 3: PRODUCT INTELLIGENCE */}
                <TabsContent value="products" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card className="shadow-sm border-gray-200 dark:border-zinc-800">
                            <CardHeader>
                                <CardTitle>Top Selling Products</CardTitle>
                                <CardDescription>Ranked by revenue generation.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead className="text-center">Units</TableHead>
                                            <TableHead className="text-right">Revenue</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {topProducts.map((p, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-medium">{p.name}</TableCell>
                                                <TableCell className="text-center">{p.total_quantity}</TableCell>
                                                <TableCell className="text-right font-bold">GH₵ {p.total_revenue.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                        {topProducts.length === 0 && (
                                            <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No data.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-gray-200 dark:border-zinc-800">
                            <CardHeader>
                                <CardTitle>Slow-Moving Inventory</CardTitle>
                                <CardDescription>Items in stock with low sales velocity.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead className="text-center">In Stock</TableHead>
                                            <TableHead className="text-right">Units Sold</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {slowMovers.map((p, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-medium text-amber-700">{p.name}</TableCell>
                                                <TableCell className="text-center">{p.current_stock}</TableCell>
                                                <TableCell className="text-right text-destructive font-bold">{p.units_sold_in_period}</TableCell>
                                            </TableRow>
                                        ))}
                                        {slowMovers.length === 0 && (
                                            <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No slow movers found!</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>

                    {/* CATEGORY BAR CHART */}
                    <Card className="mt-8 shadow-sm border-gray-200 dark:border-zinc-800">
                        <CardHeader>
                            <CardTitle>Category Performance</CardTitle>
                            <CardDescription>Revenue spread across product categories.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px] w-full min-h-[300px]">
                            {categoryPerformance.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={categoryPerformance.map(c => ({ name: c.category_name || 'Uncategorized', revenue: c.total_revenue }))}>
                                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `₵${value}`}
                                        />
                                        <Tooltip
                                            formatter={(value: any) => [`GH₵ ${Number(value || 0).toFixed(2)}`, 'Revenue']}
                                            cursor={{ fill: 'transparent' }}
                                        />
                                        <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                                            {categoryPerformance.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#10b981' : '#34d399'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground">
                                    No category data.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 4: OPERATIONAL INTELLIGENCE */}
                <TabsContent value="operations" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid gap-4 md:grid-cols-3">
                        <SummaryCard
                            title="Total Discounts Given"
                            value={`GH₵ ${discounts.totalGiven ? discounts.totalGiven.toFixed(2) : '0.00'}`}
                            icon={Package} // Represents promos/bundles
                        />
                        <SummaryCard
                            title="Discount Impact"
                            value={`${discounts.impactPercentage ? discounts.impactPercentage.toFixed(1) : '0'}% of Revenue`}
                            icon={TrendingUp}
                            trend="Lower is better"
                            trendUp={false} // Indicates red is better mentally (though hardcoded green here based on the component)
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card className="shadow-sm border-gray-200 dark:border-zinc-800">
                            <CardHeader>
                                <CardTitle>Cashier Leaderboard</CardTitle>
                                <CardDescription>Sales tracked by POS operator.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Cashier</TableHead>
                                            <TableHead className="text-center">Transactions</TableHead>
                                            <TableHead className="text-right">Generated</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cashierPerformance.map((c, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-medium">{c.cashier_name}</TableCell>
                                                <TableCell className="text-center">{c.transactions_handled}</TableCell>
                                                <TableCell className="text-right font-bold text-primary">GH₵ {c.revenue_generated.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                        {cashierPerformance.length === 0 && (
                                            <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No data.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Hourly Heatmap representation */}
                        <Card className="shadow-sm border-gray-200 dark:border-zinc-800">
                            <CardHeader>
                                <CardTitle>Peak Trading Hours</CardTitle>
                                <CardDescription>Sales volume by time of day.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {hourlySales.length > 0 ? hourlySales.map((h, i) => {
                                        // Calculate a simple relative width based on the highest hour to create a bar
                                        const maxRev = Math.max(...hourlySales.map(x => x.hourly_revenue));
                                        const widthPct = maxRev > 0 ? (h.hourly_revenue / maxRev) * 100 : 0;
                                        // Convert 24h to 12h visually
                                        const hour = parseInt(h.hour_of_day);
                                        const ampm = hour >= 12 ? 'PM' : 'AM';
                                        const displayHour = hour % 12 || 12;

                                        return (
                                            <div key={i} className="flex items-center gap-4">
                                                <div className="w-16 text-sm font-medium text-slate-500 text-right">{displayHour} {ampm}</div>
                                                <div className="flex-1 h-6 bg-slate-100 rounded-md overflow-hidden flex items-center">
                                                    <div
                                                        className="h-full bg-primary/80 transition-all duration-1000"
                                                        style={{ width: `${widthPct}%` }}
                                                    />
                                                </div>
                                                <div className="w-24 text-right text-sm font-bold">GH₵ {h.hourly_revenue.toFixed(0)}</div>
                                            </div>
                                        );
                                    }) : (
                                        <div className="text-center py-8 text-muted-foreground">No hourly data.</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="day-closing" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <DayClosing />
                </TabsContent>
            </Tabs>
        </div >
    );
}
