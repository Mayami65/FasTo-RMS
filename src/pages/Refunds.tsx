import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, RotateCcw, Calendar, FileText, Lock } from 'lucide-react';
import { useFeatures } from '@/hooks/useFeatures';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { RefundDialog } from '@/features/pos/RefundDialog';
import { useAuth } from '@/context/AuthContext';

export default function Refunds() {
    const { user } = useAuth();
    const { hasRefunds } = useFeatures();
    const navigate = useNavigate();
    const [refunds, setRefunds] = useState<any[]>([]);
    const [isRefundOpen, setIsRefundOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const limit = 10;

    useEffect(() => {
        loadRefunds();
    }, [page, search]);

    const loadRefunds = async () => {
        setLoading(true);
        try {
            const response = await window.api.getRefunds({ page, limit, search });
            if (response && 'data' in response) {
                setRefunds(response.data);
                setTotalPages(response.pagination.totalPages);
                setTotalRecords(response.pagination.total);
            }
        } catch (error) {
            console.error('Failed to load refunds:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1); // Reset to first page on search
    };

    if (!hasRefunds) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center p-8 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="h-24 w-24 bg-red-50 rounded-3xl flex items-center justify-center shadow-inner">
                    <Lock className="h-12 w-12 text-red-500" />
                </div>
                <div className="max-w-md space-y-2">
                    <h2 className="text-3xl font-black text-slate-900">Module Restrictred</h2>
                    <p className="text-slate-500 font-medium">Refund management is a premium feature available in <span className="text-primary font-black">STANDARD & PRO</span> editions.</p>
                </div>
                <Button
                    onClick={() => navigate('/settings')}
                    className="font-black px-8 py-6 text-lg rounded-2xl shadow-xl shadow-primary/20"
                >
                    View Plans
                </Button>
            </div>
        );
    }
    return (
        <div className="p-8 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Refunds Management</h1>
                    <p className="text-muted-foreground mt-1">Track and manage all processed customer refunds.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search reason or sale ID..."
                            className="pl-9"
                            value={search}
                            onChange={handleSearchChange}
                        />
                    </div>
                    <Button variant="outline" onClick={loadRefunds} disabled={loading}>
                        Refresh
                    </Button>
                    <Button onClick={() => setIsRefundOpen(true)} className="bg-red-600 hover:bg-red-700 text-white">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Process New Refund
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-xl glass-card overflow-hidden">
                <CardHeader className="bg-white/40 dark:bg-black/20 border-b border-black/5 dark:border-white/5">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <RotateCcw className="h-5 w-5 text-red-500" />
                        Refund History
                    </CardTitle>
                    <CardDescription>A complete list of all refunds processed in the system.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-black/5 dark:border-white/5">
                                    <TableHead className="font-bold uppercase text-[11px] tracking-wider text-muted-foreground">ID / Date</TableHead>
                                    <TableHead className="font-bold uppercase text-[11px] tracking-wider text-muted-foreground text-center">Sale info</TableHead>
                                    <TableHead className="font-bold uppercase text-[11px] tracking-wider text-muted-foreground">Reason</TableHead>
                                    <TableHead className="font-bold uppercase text-[11px] tracking-wider text-muted-foreground">Processed By</TableHead>
                                    <TableHead className="font-bold uppercase text-[11px] tracking-wider text-muted-foreground text-right">Refund Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-12 text-center text-muted-foreground italic">
                                            Loading refund records...
                                        </TableCell>
                                    </TableRow>
                                ) : refunds.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                                            No refund records found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    refunds.map((refund) => (
                                        <TableRow key={refund.id} className="group hover:bg-red-50/30 dark:hover:bg-red-950/10 transition-colors">
                                            <TableCell>
                                                <div className="font-bold text-foreground tracking-tight">#{refund.id}</div>
                                                <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                                                    <Calendar className="h-3 w-3 opacity-50" /> {format(new Date(refund.timestamp), 'MMM dd, yyyy HH:mm')}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <Badge variant="outline" className="text-[10px] font-mono mb-1">SALE #{refund.sale_id}</Badge>
                                                    <span className="text-[10px] text-muted-foreground uppercase">{refund.original_payment_method?.replace('_', ' ')}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-start gap-2 max-w-xs">
                                                    <FileText className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                                                    <span className="text-sm line-clamp-2">{refund.reason}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-7 w-7 rounded-sm bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                                                        {refund.cashier_name?.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-medium">{refund.cashier_name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-lg font-bold text-red-600 dark:text-red-400">
                                                    GH₵ {refund.total_amount.toFixed(2)}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-black/5 dark:border-white/5">
                        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                            {refunds.length > 0 ? (page - 1) * limit + 1 : 0}-{Math.min(page * limit, totalRecords)} of {totalRecords} Refunds
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                                className="bg-white dark:bg-slate-900 h-8 font-bold text-xs"
                            >
                                Previous
                            </Button>
                            <div className="text-xs font-bold px-3 py-1 bg-white dark:bg-slate-800 rounded-md border border-black/5 dark:border-white/5">
                                {page} / {totalPages || 1}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages || loading}
                                className="bg-white dark:bg-slate-900 h-8 font-bold text-xs"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <RefundDialog
                open={isRefundOpen}
                onClose={() => setIsRefundOpen(false)}
                userId={user?.id}
                onRefundSuccess={loadRefunds}
            />
        </div >
    );
}
