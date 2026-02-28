import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, CreditCard, DollarSignIcon, User, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

import { useFeatures } from '@/hooks/useFeatures';
import { Lock } from 'lucide-react';

export default function HirePurchase() {
    const navigate = useNavigate();
    const { hasHirePurchase } = useFeatures();
    const [summary, setSummary] = useState<any>(null);
    const [overdueAgreements, setOverdueAgreements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('Fetching HP Data...');
            const [summaryData, overdueData] = await Promise.all([
                window.api.getHPSummary().catch(e => { console.error("Summary fetch error", e); return null; }),
                window.api.getOverdueAgreements().catch(e => { console.error("Overdue fetch error", e); return []; })
            ]);

            console.log('HP Data Loaded:', { summaryData, overdueData });
            setSummary(summaryData || {});
            setOverdueAgreements(overdueData || []);
        } catch (error: any) {
            console.error('Failed to load HP data', error);
            setError(error.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return 'N/A';
        try {
            // Handle "YYYY-MM-DD HH:MM:SS" SQLite format
            const safeDate = dateStr.replace(' ', 'T');
            const date = new Date(safeDate);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString();
        } catch (e) {
            return dateStr;
        }
    };

    if (loading) {
        return <div className="p-8">Loading Hire Purchase Dashboard...</div>;
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-md border border-red-200 dark:border-red-800">
                    <h3 className="font-bold">Error Loading Dashboard</h3>
                    <p>{error}</p>
                    <Button onClick={loadData} variant="outline" className="mt-2">Retry</Button>
                </div>
            </div>
        );
    }

    // Default values to prevent crashes
    const activeCount = summary?.total_active_agreements || 0;
    const totalDebt = summary?.total_debt || 0;
    const overdueCount = summary?.overdue_count || 0;
    const recentPayments = summary?.recent_payments || [];

    if (!hasHirePurchase) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center p-8 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="h-24 w-24 bg-slate-100 rounded-3xl flex items-center justify-center shadow-inner">
                    <Lock className="h-12 w-12 text-slate-400" />
                </div>
                <div className="max-w-md space-y-2">
                    <h2 className="text-3xl font-black text-slate-900">Feature Locked</h2>
                    <p className="text-slate-500 font-medium">The Hire Purchase module is only available in the <span className="text-primary font-black">PRO Edition</span>. Upgrade your license to unlock this functionality.</p>
                </div>
                <Button
                    onClick={() => navigate('/settings')}
                    className="font-black px-8 py-6 text-lg rounded-2xl shadow-xl shadow-primary/20"
                >
                    Manage License
                </Button>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Hire Purchase</h1>
                <p className="text-muted-foreground mt-1">Manage installment plans and track overdue payments.</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="relative overflow-hidden border-none bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                    <div className="absolute right-[-10%] top-[-20%] opacity-20">
                        <CreditCard size={120} />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium opacity-90 uppercase tracking-wider">Active Agreements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold tracking-tight">{activeCount}</div>
                        <p className="text-xs mt-1 opacity-80 flex items-center gap-1">
                            <CreditCard className="h-3 w-3" /> Standard & Installment plans
                        </p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-none bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                    <div className="absolute right-[-10%] top-[-20%] opacity-20">
                        <DollarSignIcon size={120} />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium opacity-90 uppercase tracking-wider">Total Outstanding</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold tracking-tight">GH₵ {totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <p className="text-xs mt-1 opacity-80 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Receivables from customers
                        </p>
                    </CardContent>
                </Card>

                <Card className={cn(
                    "relative overflow-hidden border-none shadow-lg text-white transition-all duration-300",
                    overdueCount > 0
                        ? "bg-gradient-to-br from-rose-500 to-red-600 animate-pulse-subtle"
                        : "bg-gradient-to-br from-slate-600 to-slate-700"
                )}>
                    <div className="absolute right-[-10%] top-[-20%] opacity-20">
                        <AlertCircle size={120} />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium opacity-90 uppercase tracking-wider">Overdue Accounts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold tracking-tight">{overdueCount}</div>
                        <p className="text-xs mt-1 opacity-80 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Requires immediate attention
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Overdue Alerts Section */}
            {overdueAgreements.length > 0 && (
                <div className="space-y-4 pt-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400">
                        <div className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                        Critical Alerts: Overdue Payments
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {overdueAgreements.map((agreement) => (
                            <Card key={agreement.id} className="group hover:shadow-xl transition-all duration-300 border-rose-100 dark:border-rose-900/30 overflow-hidden bg-rose-50/30 dark:bg-rose-950/10">
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold shrink-0">
                                            {agreement.customer_name.charAt(0)}
                                        </div>
                                        <Badge variant="destructive" className="bg-rose-600">OVERDUE</Badge>
                                    </div>

                                    <h3 className="font-bold text-lg group-hover:text-rose-600 transition-colors">{agreement.customer_name}</h3>
                                    <div className="flex items-center text-sm text-muted-foreground gap-1.5 mt-0.5">
                                        <User className="h-3.5 w-3.5" /> {agreement.customer_phone}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-6 p-3 rounded-lg bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/5">
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Balance Due</p>
                                            <p className="font-bold text-rose-600 text-base">GH₵ {agreement.balance_due?.toFixed(2) || '0.00'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Last Date</p>
                                            <p className="font-bold text-foreground text-base tracking-tight">{formatDate(agreement.next_payment_date)}</p>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full mt-5 bg-rose-600 hover:bg-rose-700 text-white border-none shadow-md shadow-rose-200 dark:shadow-rose-900/20"
                                        onClick={() => navigate(`/customers/${agreement.customer_id}`)}
                                    >
                                        Record Payment
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
                {/* All Agreements Table - Spans 8 cols */}
                <div className="lg:col-span-8 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                            Agreements Registry
                        </h2>
                    </div>
                    <AgreementsTable />
                </div>

                {/* Recent Payments - Spans 4 cols */}
                <div className="lg:col-span-4 space-y-4">
                    <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        Activity Feed
                    </h2>
                    <Card className="border-none shadow-lg bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                        <CardHeader className="pb-0">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recent Payments</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            {(!recentPayments || recentPayments.length === 0) ? (
                                <div className="py-12 text-center flex flex-col items-center gap-2 text-muted-foreground">
                                    <CreditCard className="h-8 w-8 opacity-20" />
                                    <p className="text-sm">No recent activity found.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {recentPayments.map((payment: any, idx: number) => (
                                        <div key={idx} className="group flex items-start gap-4 p-3 rounded-xl hover:bg-white dark:hover:bg-black/30 transition-all border border-transparent hover:border-black/5 dark:hover:border-white/5 relative">
                                            {/* Vertical Line Connector */}
                                            {idx !== recentPayments.length - 1 && (
                                                <div className="absolute left-[29px] top-[48px] bottom-[-20px] w-0.5 bg-slate-200 dark:bg-slate-800" />
                                            )}

                                            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0 shadow-inner">
                                                {payment.customer_name.charAt(0)}
                                            </div>

                                            <div className="flex-1 space-y-1">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-bold text-sm tracking-tight">{payment.customer_name}</p>
                                                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
                                                        +GH₵ {payment.amount?.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-[11px]">
                                                    <p className="text-muted-foreground">{formatDate(payment.date)}</p>
                                                    <p className="text-muted-foreground/80 font-medium">Bal: GH₵ {payment.balance_due?.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-foreground h-8 mt-2">
                                        View Full Audit Trail
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

        </div>
    );
}

function AgreementsTable() {
    const navigate = useNavigate();
    const [agreements, setAgreements] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [loading, setLoading] = useState(false);

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const limit = 10;

    useEffect(() => {
        // Reset page when filters change
        setPage(1);
    }, [search, statusFilter]);

    useEffect(() => {
        fetchAgreements();
    }, [page, search, statusFilter]);

    const fetchAgreements = async () => {
        setLoading(true);
        try {
            const response = await window.api.getHirePurchaseAgreements({
                status: statusFilter,
                search,
                page,
                limit
            });

            // Handle new paginated structure
            if (response && 'data' in response) {
                setAgreements(response.data);
                setTotalPages(response.pagination.totalPages);
                setTotalRecords(response.pagination.total);
            } else {
                // Fallback
                setAgreements((response as any) || []);
            }
        } catch (error) {
            console.error("Failed to fetch agreements", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string, dueDate: string) => {
        const isOverdue = new Date(dueDate) < new Date() && status === 'ACTIVE';

        if (status === 'COMPLETED') return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400 border-none shadow-sm">Completed</Badge>;
        if (status === 'DEFAULTED') return <Badge variant="destructive" className="animate-pulse-subtle">Defaulted</Badge>;
        if (isOverdue) return <Badge variant="destructive" className="bg-rose-500 hover:bg-rose-600 animate-pulse-subtle">Overdue</Badge>;
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400 border-none">Active</Badge>;
    };

    return (
        <Card className="border-none shadow-xl overflow-hidden glass-card">
            <CardHeader className="pb-4 bg-white/40 dark:bg-black/20 border-b border-black/5 dark:border-white/5">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-80 group">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Filter by customer name or phone..."
                            className="flex h-10 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/30 px-3 py-1 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-xl gap-1">
                        {['ALL', 'ACTIVE', 'COMPLETED', 'OVERDUE'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setStatusFilter(filter)}
                                className={cn(
                                    "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                                    statusFilter === filter
                                        ? "bg-white dark:bg-slate-800 shadow-sm text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {filter.charAt(0) + filter.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="relative w-full overflow-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-black/5 dark:border-white/5">
                                <th className="h-12 px-6 align-middle font-bold text-[11px] uppercase tracking-wider text-muted-foreground">Customer Info</th>
                                <th className="h-12 px-6 align-middle font-bold text-[11px] uppercase tracking-wider text-muted-foreground text-center">Agreement Value</th>
                                <th className="h-12 px-6 align-middle font-bold text-[11px] uppercase tracking-wider text-muted-foreground text-center">Pending Balance</th>
                                <th className="h-12 px-6 align-middle font-bold text-[11px] uppercase tracking-wider text-muted-foreground">Schedule</th>
                                <th className="h-12 px-6 align-middle font-bold text-[11px] uppercase tracking-wider text-muted-foreground">Status</th>
                                <th className="h-12 px-6 align-middle font-bold text-[11px] uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-muted-foreground italic">Syncing with database...</td>
                                </tr>
                            ) : agreements.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-muted-foreground">No matching agreements found.</td>
                                </tr>
                            ) : (
                                agreements.map((agreement) => (
                                    <tr key={agreement.id} className="group hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-foreground tracking-tight">{agreement.customer_name}</div>
                                            <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                                                <User className="h-3 w-3 opacity-50" /> {agreement.customer_phone}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium">GH₵ {agreement.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">GH₵ {agreement.balance_due.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">Next Due</div>
                                            <div className="font-bold tabular-nums">{new Date(agreement.next_payment_date).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(agreement.status, agreement.next_payment_date)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="rounded-lg h-8 px-4 font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                onClick={() => navigate(`/customers/${agreement.customer_id}`)}
                                            >
                                                Manage
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-black/5 dark:border-white/5">
                    <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                        Displaying {agreements.length > 0 ? (page - 1) * limit + 1 : 0}-{Math.min(page * limit, totalRecords)} of {totalRecords} Records
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="bg-white dark:bg-slate-900 border-black/5 dark:border-white/5 rounded-lg h-8 px-4 text-xs font-bold shadow-sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                        >
                            Back
                        </Button>
                        <div className="text-xs font-bold px-3 py-1 bg-white dark:bg-slate-800 rounded-lg shadow-inner border border-black/5 dark:border-white/5">
                            {page} / {totalPages || 1}
                        </div>
                        <Button
                            variant="outline"
                            className="bg-white dark:bg-slate-900 border-black/5 dark:border-white/5 rounded-lg h-8 px-4 text-xs font-bold shadow-sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages || loading}
                        >
                            Forward
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

