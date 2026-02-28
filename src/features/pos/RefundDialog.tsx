import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';

interface RefundDialogProps {
    open: boolean;
    onClose: () => void;
    userId?: number;
    onRefundSuccess: () => void;
    initialSaleId?: number;
}

export function RefundDialog({ open, onClose, userId, onRefundSuccess, initialSaleId }: RefundDialogProps) {
    const [saleIdInput, setSaleIdInput] = useState('');
    const [phoneInput, setPhoneInput] = useState('');
    const [foundSales, setFoundSales] = useState<any[]>([]);
    const [saleData, setSaleData] = useState<any>(null);
    const [reason, setReason] = useState('');
    const [qtyByItemId, setQtyByItemId] = useState<Record<number, number>>({});
    const [loadingSale, setLoadingSale] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (open && initialSaleId) {
            setSaleIdInput(initialSaleId.toString());
            // Trigger load automatically
            loadSaleById(initialSaleId);
        } else if (open) {
            resetState();
        }
    }, [open, initialSaleId]);

    const loadSaleById = async (id: number) => {
        setLoadingSale(true);
        try {
            const data = await window.api.getSaleForRefund(id);
            if (!data) {
                alert('Sale not found');
                setSaleData(null);
                return;
            }
            setSaleData(data);
            setQtyByItemId({});
            setFoundSales([]); // Clear found sales
        } catch (error) {
            console.error('Failed to load sale for refund:', error);
            alert('Failed to load sale');
        } finally {
            setLoadingSale(false);
        }
    };

    const handleSearchByPhone = async () => {
        if (!phoneInput) return;
        setLoadingSale(true);
        try {
            const results = await window.api.searchSalesByPhone(phoneInput);
            setFoundSales(results || []);
            if (results?.length === 0) {
                alert('No sales found for this phone number');
            }
        } catch (error) {
            console.error('Phone search failed:', error);
        } finally {
            setLoadingSale(false);
        }
    };

    const selectedItems = useMemo(() => {
        if (!saleData?.items) return [];
        return saleData.items
            .map((item: any) => ({
                saleItemId: item.id,
                quantity: qtyByItemId[item.id] || 0,
                price_at_sale: item.price_at_sale,
            }))
            .filter((item: any) => item.quantity > 0);
    }, [saleData, qtyByItemId]);

    const refundTotal = useMemo(() => {
        return selectedItems.reduce((sum: number, item: any) => sum + (item.quantity * item.price_at_sale), 0);
    }, [selectedItems]);

    const resetState = () => {
        setSaleIdInput('');
        setPhoneInput('');
        setFoundSales([]);
        setSaleData(null);
        setReason('');
        setQtyByItemId({});
        setLoadingSale(false);
        setProcessing(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleLoadSale = () => {
        const saleId = Number(saleIdInput);
        if (!saleId) {
            alert('Enter a valid sale ID');
            return;
        }
        loadSaleById(saleId);
    };

    const handleQtyChange = (saleItemId: number, maxQty: number, value: string) => {
        const qty = Math.max(0, Math.min(maxQty, Number(value) || 0));
        setQtyByItemId((prev) => ({ ...prev, [saleItemId]: qty }));
    };

    const handleProcessRefund = async () => {
        if (!saleData?.sale?.id) return;
        if (!reason.trim()) {
            alert('Refund reason is required');
            return;
        }
        if (selectedItems.length === 0) {
            alert('Select at least one item quantity to refund');
            return;
        }

        setProcessing(true);
        try {
            const result = await window.api.processRefund({
                saleId: saleData.sale.id,
                reason: reason.trim(),
                userId,
                items: selectedItems.map((item: any) => ({ saleItemId: item.saleItemId, quantity: item.quantity })),
            });

            if (result.success) {
                alert(`Refund completed. Amount refunded: GH₵ ${(result.refundAmount || 0).toFixed(2)}`);
                onRefundSuccess();
                handleClose();
            } else {
                alert(`Refund failed: ${result.error}`);
            }
        } catch (error) {
            console.error('Refund processing failed:', error);
            alert('Refund failed');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    handleClose();
                }
            }}
        >
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>Process Refund</DialogTitle>
                    <DialogDescription>
                        Look up a sale by ID or customer phone number to initiate a return.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 max-h-[80vh] overflow-y-auto px-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                            <div className="space-y-2">
                                <Label className="text-xs uppercase font-black text-slate-400">Sale ID</Label>
                                <Input
                                    type="number"
                                    value={saleIdInput}
                                    onChange={(e) => setSaleIdInput(e.target.value)}
                                    placeholder="e.g. 1024"
                                    className="font-bold"
                                />
                            </div>
                            <Button onClick={handleLoadSale} disabled={loadingSale} variant="secondary">
                                Lookup
                            </Button>
                        </div>

                        <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                            <div className="space-y-2">
                                <Label className="text-xs uppercase font-black text-slate-400">Search by Customer Phone</Label>
                                <Input
                                    type="text"
                                    value={phoneInput}
                                    onChange={(e) => setPhoneInput(e.target.value)}
                                    placeholder="024xxxxxxx"
                                    className="font-bold"
                                />
                            </div>
                            <Button onClick={handleSearchByPhone} disabled={loadingSale} variant="secondary">
                                Search
                            </Button>
                        </div>
                    </div>

                    {foundSales.length > 0 && (
                        <div className="space-y-2 animate-in fade-in duration-300">
                            <Label className="text-[10px] font-black uppercase text-primary tracking-widest">Select Sale to Refund:</Label>
                            <div className="grid grid-cols-1 gap-2">
                                {foundSales.map((sale) => (
                                    <button
                                        key={sale.id}
                                        onClick={() => loadSaleById(sale.id)}
                                        className="flex items-center justify-between p-3 bg-slate-50 hover:bg-primary/5 border rounded-xl transition-all group"
                                    >
                                        <div className="text-left">
                                            <p className="font-black text-primary group-hover:underline">Sale #{sale.id}</p>
                                            <p className="text-[10px] text-slate-500 font-medium">
                                                {new Date(sale.timestamp).toLocaleString()} - {sale.payment_method}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-slate-900">GH₵ {sale.total_amount.toFixed(2)}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{sale.cashier_name || 'System'}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {saleData?.sale && (
                        <div className="space-y-4 border rounded-md p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="font-medium">Sale #{saleData.sale.id}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(saleData.sale.timestamp).toLocaleString()} - {saleData.sale.payment_method}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Previously Refunded</p>
                                    <p className="font-semibold">GH₵ {(saleData.refunded_total || 0).toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                                {saleData.items.map((item: any) => (
                                    <div key={item.id} className="grid grid-cols-[1fr_auto_auto] gap-3 items-center border rounded p-3">
                                        <div>
                                            <p className="font-medium">
                                                {item.product_name}
                                                {item.variation_name && (
                                                    <span className="ml-2 text-[10px] text-primary bg-primary/5 px-1.5 py-0.5 rounded border border-primary/20 uppercase font-bold">
                                                        {item.variation_name}
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Qty Sold: {item.quantity} | Refunded: {item.refunded_quantity} | Available: {item.refundable_quantity}
                                            </p>
                                        </div>
                                        <p className="text-sm font-medium">GH₵ {item.price_at_sale.toFixed(2)}</p>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={item.refundable_quantity}
                                            value={qtyByItemId[item.id] || ''}
                                            onChange={(e) => handleQtyChange(item.id, item.refundable_quantity, e.target.value)}
                                            className="w-24"
                                            disabled={item.refundable_quantity <= 0}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <Label>Refund Reason (required)</Label>
                                <Textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="State why the refund is being processed"
                                />
                            </div>

                            <div className="flex justify-between items-center border-t pt-3">
                                <span className="font-medium">Refund Total</span>
                                <span className="text-xl font-bold text-red-600">GH₵ {refundTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={processing}>Cancel</Button>
                    <Button onClick={handleProcessRefund} disabled={processing || !saleData?.sale}>
                        {processing ? 'Processing...' : 'Confirm Refund'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
