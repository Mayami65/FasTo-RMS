import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { Search, RotateCcw, Eye, Calendar } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { ReceiptPreviewDialog } from '@/features/pos/ReceiptPreviewDialog';
import { RefundDialog } from '@/features/pos/RefundDialog';

export default function Sales() {
    const { user } = useAuth();
    const [dateRange, setDateRange] = useState<string>('today');
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 500);

    // Pagination state
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
    });

    // Dialog states
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [isRefundOpen, setIsRefundOpen] = useState(false);
    const [selectedSaleId, setSelectedSaleId] = useState<number | undefined>();
    const [detailedSale, setDetailedSale] = useState<any | null>(null);

    useEffect(() => {
        loadTransactions();
    }, [dateRange, page, debouncedSearch]);

    useEffect(() => {
        setPage(1);
    }, [dateRange, debouncedSearch]);

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
                start = today;
                end = today;
        }

        return {
            startDate: format(start, 'yyyy-MM-dd'),
            endDate: format(end, 'yyyy-MM-dd')
        };
    };

    const loadTransactions = async () => {
        setLoading(true);
        try {
            const { startDate, endDate } = getDateParams();
            const response = await window.api.getSalesReport({
                startDate,
                endDate,
                page,
                limit: 10,
                search: debouncedSearch
            });

            if (response) {
                setTransactions(response.sales || []);
                setPagination(response.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 });
            }
        } catch (error) {
            console.error('Failed to load transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (saleId: number) => {
        try {
            const saleData = await window.api.getSaleDetails(saleId);
            if (saleData) {
                setDetailedSale(saleData);
                setIsReceiptOpen(true);
            }
        } catch (error) {
            console.error('Failed to fetch sale details:', error);
        }
    };

    const handleRefundClick = (saleId: number) => {
        setSelectedSaleId(saleId);
        setIsRefundOpen(true);
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sales History</h1>
                    <p className="text-muted-foreground mt-1">View and manage past transactions.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-[180px]">
                            <Calendar className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Date Range" />
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
                    <Button variant="outline" onClick={loadTransactions} disabled={loading}>
                        Refresh
                    </Button>
                </div>
            </div>

            <Card className="shadow-sm border-gray-200 dark:border-zinc-800">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search Sale ID, Customer, or Cashier..."
                            className="pl-9 h-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {/* More filters can go here */}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-[100px]">Sale ID</TableHead>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Payment</TableHead>
                                    <TableHead>Cashier</TableHead>
                                    <TableHead className="text-right">Total Amount</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">Loading transactions...</TableCell>
                                    </TableRow>
                                ) : transactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">No transactions found for this period.</TableCell>
                                    </TableRow>
                                ) : (
                                    transactions.map((t) => (
                                        <TableRow key={t.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-medium">#{t.id.toString().padStart(5, '0')}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm">{new Date(t.timestamp).toLocaleDateString()}</span>
                                                    <span className="text-xs text-muted-foreground">{new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-normal capitalize">
                                                    {t.payment_method.replace('_', ' ').toLowerCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm font-medium">{t.cashier_name}</TableCell>
                                            <TableCell className="text-right font-bold text-primary">GH₵ {t.total_amount.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => handleViewDetails(t.id)}
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {user?.role === 'OWNER' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleRefundClick(t.id)}
                                                            title="Refund"
                                                        >
                                                            <RotateCcw className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between space-x-2 py-4">
                            <div className="text-sm text-muted-foreground">
                                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total sales)
                            </div>
                            <div className="space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                    disabled={page === pagination.totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <ReceiptPreviewDialog
                open={isReceiptOpen}
                onClose={() => {
                    setIsReceiptOpen(false);
                    setDetailedSale(null);
                }}
                sale={detailedSale}
                isHistory={true}
            />

            <RefundDialog
                open={isRefundOpen}
                onClose={() => setIsRefundOpen(false)}
                initialSaleId={selectedSaleId}
                onRefundSuccess={loadTransactions}
            />
        </div>
    );
}
