import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, DollarSign, Phone, CreditCard, Calendar } from 'lucide-react';
import { PaymentDialog } from '@/features/customers/PaymentDialog';
import { useAuth } from '@/context/AuthContext';
import { cn } from "@/lib/utils";

export default function CustomerDetails() {
    const { user } = useAuth();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [selectedAgreement, setSelectedAgreement] = useState<any>(null);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'agreements' | 'history'>('history');
    const [nextPaymentDate, setNextPaymentDate] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (id) loadCustomerDetails();
    }, [id]);

    const loadCustomerDetails = async () => {
        try {
            const result = await window.api.getCustomerDetails(parseInt(id!));
            setData(result);
        } catch (error) {
            console.error('Failed to load customer details', error);
        }
    };

    const handlePayment = (agreement: any) => {
        setSelectedAgreement(agreement);
        setIsPaymentDialogOpen(true);
    };

    const handleConfirmPayment = async (amount: number, notes: string) => {
        try {
            const result = await window.api.addInstallment({
                agreementId: selectedAgreement.id,
                amount,
                notes,
                nextPaymentDate,
                userId: user?.id,
            });

            if (result.success) {
                setIsPaymentDialogOpen(false);
                loadCustomerDetails(); // Refresh
            } else {
                alert('Payment failed: ' + result.error);
            }
        } catch (error) {
            console.error('Payment error', error);
            alert('Payment failed');
        }
    };

    if (!data) {
        return <div className="p-8 text-center font-bold text-slate-500 animate-pulse">Loading engine data...</div>;
    }

    const { customer, agreements, salesHistory = [] } = data;
    const activeAgreements = agreements.filter((a: any) => a.status === 'ACTIVE');
    const totalDebt = activeAgreements.reduce((sum: number, a: any) => sum + a.balance_due, 0);
    const totalSpend = salesHistory.reduce((sum: number, s: any) => sum + s.total_amount, 0);

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/customers')} className="hover:bg-primary/10 rounded-xl">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">{customer.name}</h1>
                    <div className="flex items-center gap-4 mt-2 text-muted-foreground font-bold">
                        <span className="flex items-center gap-1.5">
                            <Phone className="h-4 w-4 text-primary" />
                            {customer.phone}
                        </span>
                        {customer.id_card_number && (
                            <span className="flex items-center gap-1.5">
                                <CreditCard className="h-4 w-4 text-primary" />
                                {customer.id_card_number}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm ring-1 ring-slate-200 border-l-4 border-l-red-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Outstanding Debt</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-black text-red-600">GH₵ {totalDebt.toFixed(2)}</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm ring-1 ring-slate-200 border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Active HP</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-black text-blue-600">{activeAgreements.length}</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm ring-1 ring-slate-200 border-l-4 border-l-green-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Total Visits</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-black text-green-600">{salesHistory.length}</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm ring-1 ring-slate-200 border-l-4 border-l-purple-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Total Lifetime Spend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-black text-purple-600">GH₵ {totalSpend.toFixed(2)}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-8 border-b border-slate-200 px-2 mt-4">
                <button
                    onClick={() => setActiveTab('history')}
                    className={cn(
                        "pb-4 text-xs font-black uppercase tracking-widest transition-all relative",
                        activeTab === 'history' ? "text-primary" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    Purchase History
                    {activeTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
                </button>
                <button
                    onClick={() => setActiveTab('agreements')}
                    className={cn(
                        "pb-4 text-xs font-black uppercase tracking-widest transition-all relative",
                        activeTab === 'agreements' ? "text-primary" : "text-slate-400 hover:text-slate-600"
                    )}
                >
                    Hire Purchase Agreements
                    {activeTab === 'agreements' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'history' && (
                <div className="space-y-4 animate-in slide-in-from-left duration-500">
                    {salesHistory.length === 0 ? (
                        <Card className="border-dashed border-2 bg-slate-50/50">
                            <CardContent className="py-12 text-center text-slate-400 font-bold">
                                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>No unified purchase history found for this customer.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden overflow-x-auto ring-1 ring-slate-200">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50/80 border-b text-slate-400 font-black uppercase tracking-wider text-[10px]">
                                    <tr>
                                        <th className="px-6 py-4">Receipt #</th>
                                        <th className="px-6 py-4">Timestamp</th>
                                        <th className="px-6 py-4">Payment Method</th>
                                        <th className="px-6 py-4">Cashier</th>
                                        <th className="px-6 py-4 text-right">Total (GH₵)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {salesHistory.map((sale: any) => (
                                        <tr key={sale.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4 font-black text-primary">#{sale.id}</td>
                                            <td className="px-6 py-4 text-slate-500 font-medium">{new Date(sale.timestamp).toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant="secondary" className="font-black bg-slate-100 text-slate-600 hover:bg-slate-100 group-hover:bg-white transition-colors">
                                                    {sale.payment_method.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 font-bold uppercase text-[10px]">{sale.cashier_name || 'System'}</td>
                                            <td className="px-6 py-4 text-right font-black text-slate-900">GH₵ {sale.total_amount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'agreements' && (
                <div className="space-y-4 animate-in slide-in-from-right duration-500">
                    {agreements.length === 0 ? (
                        <Card className="border-dashed border-2 bg-slate-50/50">
                            <CardContent className="py-12 text-center text-slate-400 font-bold">
                                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>No hire purchase agreements found.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        agreements.map((agreement: any) => {
                            const paidAmount = agreement.total_amount - agreement.balance_due;
                            const progressPercent = (paidAmount / agreement.total_amount) * 100;

                            return (
                                <Card key={agreement.id} className="border-none shadow-sm ring-1 ring-slate-200 hover:shadow-md transition-all overflow-hidden">
                                    <CardHeader className="border-b bg-slate-50/30">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <CardTitle className="text-lg font-black flex items-center gap-3">
                                                    Agreement #{agreement.id}
                                                    <Badge className={cn(
                                                        "font-black text-[10px] uppercase",
                                                        agreement.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                                            agreement.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                                    )}>
                                                        {agreement.status}
                                                    </Badge>
                                                </CardTitle>
                                                <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(agreement.sale_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6 pt-6">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                <span>Payment Progress</span>
                                                <span className="text-primary">{progressPercent.toFixed(0)}%</span>
                                            </div>
                                            <Progress value={progressPercent} className="h-2 rounded-full bg-slate-100" />
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-emerald-600">Paid: GH₵ {paidAmount.toFixed(2)}</span>
                                                <span className="text-red-500">Balance: GH₵ {agreement.balance_due.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Total Agreement</p>
                                                <p className="text-xl font-black text-slate-900">GH₵ {agreement.total_amount.toFixed(2)}</p>
                                            </div>
                                            <div className="p-3 bg-red-50/50 rounded-xl border border-red-100">
                                                <p className="text-[10px] text-red-400 font-black uppercase mb-1">Balance Due</p>
                                                <p className="text-xl font-black text-red-600">GH₵ {agreement.balance_due.toFixed(2)}</p>
                                            </div>
                                        </div>

                                        {agreement.status === 'ACTIVE' && (
                                            <Button
                                                onClick={() => handlePayment(agreement)}
                                                className="w-full bg-slate-900 hover:bg-black text-white font-black h-12 rounded-xl shadow-lg transition-transform active:scale-95"
                                            >
                                                <DollarSign className="mr-2 h-5 w-5" /> Record Payment
                                            </Button>
                                        )}

                                        <div className="pt-4 border-t">
                                            <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest flex items-center gap-2">
                                                <Calendar className="h-3 w-3 text-primary" />
                                                Payment History
                                            </h4>
                                            {agreement.installments.length === 0 ? (
                                                <p className="text-xs text-slate-400 font-bold italic ml-5">No payments recorded for this agreement.</p>
                                            ) : (
                                                <div className="space-y-4 ml-5 border-l-2 border-slate-100">
                                                    {agreement.installments.map((inst: any) => (
                                                        <div key={inst.id} className="relative pl-6 pb-2">
                                                            <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                            <div className="flex justify-between items-center">
                                                                <div>
                                                                    <p className="text-sm font-black text-emerald-600">GH₵ {inst.amount_paid.toFixed(2)}</p>
                                                                    {inst.notes && <p className="text-[10px] text-slate-500 font-medium italic mt-0.5">{inst.notes}</p>}
                                                                </div>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase">
                                                                    {new Date(inst.payment_date).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            )}

            {selectedAgreement && (
                <PaymentDialog
                    open={isPaymentDialogOpen}
                    onClose={() => setIsPaymentDialogOpen(false)}
                    agreement={selectedAgreement}
                    onConfirm={handleConfirmPayment}
                    onDateChange={setNextPaymentDate}
                />
            )}
        </div>
    );
}
