import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Download, TrendingUp, DollarSign, ShoppingCart, Calendar } from 'lucide-react';

export function SalesReport() {
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadReport();
    }, []);

    const loadReport = async () => {
        setLoading(true);
        try {
            const data = await window.api.getSalesReport({ startDate, endDate });
            setReportData(data);
        } catch (error) {
            console.error('Failed to load sales report', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!reportData) return;

        // Create CSV content
        let csv = 'Sale ID,Date,Payment Method,Total Amount,Items\n';
        reportData.sales.forEach((sale: any) => {
            const items = sale.items.map((i: any) => `${i.product_name} (${i.quantity})`).join('; ');
            csv += `${sale.id},${new Date(sale.timestamp).toLocaleString()},${sale.payment_method},${sale.total_amount.toFixed(2)},"${items}"\n`;
        });

        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales_report_${startDate}_to_${endDate}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (loading) {
        return <div className="p-8">Loading report...</div>;
    }

    return (
        <div className="space-y-6">
            <Card className="shadow-md">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Sales Report Filters
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                        <div className="flex items-end">
                            <Button onClick={loadReport} className="w-full" size="lg">
                                <TrendingUp className="mr-2 h-4 w-4" />
                                Generate Report
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {reportData && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <ShoppingCart className="h-4 w-4" />
                                    Total Sales
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-bold text-blue-600">{reportData.summary.totalTransactions}</p>
                                <p className="text-sm text-muted-foreground mt-1">transactions</p>
                            </CardContent>
                        </Card>
                        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    Total Revenue
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-bold text-green-600">GH₵ {reportData.summary.totalRevenue.toFixed(2)}</p>
                                <p className="text-sm text-muted-foreground mt-1">total earnings</p>
                            </CardContent>
                        </Card>
                        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Download className="h-4 w-4" />
                                    Export Data
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button onClick={handleExport} variant="outline" className="w-full" size="lg">
                                    <Download className="mr-2 h-4 w-4" /> Export CSV
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="shadow-md">
                        <CardHeader className="bg-muted/50">
                            <CardTitle>Payment Method Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                                    <p className="text-sm font-medium text-blue-700 mb-2">Cash</p>
                                    <p className="text-3xl font-bold text-blue-900">GH₵ {reportData.summary.paymentBreakdown.CASH.toFixed(2)}</p>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                                    <p className="text-sm font-medium text-purple-700 mb-2">Mobile Money</p>
                                    <p className="text-3xl font-bold text-purple-900">GH₵ {reportData.summary.paymentBreakdown.MOBILE_MONEY.toFixed(2)}</p>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
                                    <p className="text-sm font-medium text-orange-700 mb-2">Hire Purchase</p>
                                    <p className="text-3xl font-bold text-orange-900">GH₵ {reportData.summary.paymentBreakdown.HIRE_PURCHASE.toFixed(2)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md">
                        <CardHeader className="bg-muted/50">
                            <CardTitle>Sales Details</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {reportData.sales.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No sales found for this period</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {reportData.sales.map((sale: any) => (
                                        <div key={sale.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="font-semibold text-lg">Sale #{sale.id}</p>
                                                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(sale.timestamp).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-bold text-green-600">GH₵ {sale.total_amount.toFixed(2)}</p>
                                                    <Badge variant="outline" className="mt-1">{sale.payment_method}</Badge>
                                                </div>
                                            </div>
                                            <div className="mt-3 pt-3 border-t">
                                                <p className="font-medium text-sm mb-2">Items Purchased:</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {sale.items.map((item: any) => (
                                                        <div key={item.id} className="flex justify-between text-sm bg-muted/50 p-2 rounded">
                                                            <span className="text-muted-foreground">
                                                                {item.product_name} <span className="font-medium">x{item.quantity}</span>
                                                            </span>
                                                            <span className="font-medium">GH₵ {(item.price_at_sale * item.quantity).toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
