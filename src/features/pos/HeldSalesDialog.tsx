import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Trash2, ShoppingCart, Calendar, User, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface HeldSalesDialogProps {
    open: boolean;
    onClose: () => void;
    onResume: (sale: any) => void;
    onUpdate?: () => void;
}

export function HeldSalesDialog({ open, onClose, onResume, onUpdate }: HeldSalesDialogProps) {
    const [heldSales, setHeldSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (open) {
            loadHeldSales();
        }
    }, [open]);

    const loadHeldSales = async () => {
        setLoading(true);
        try {
            const data = await window.api.getHeldSales();
            setHeldSales(data);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Failed to load held sales", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this held sale?")) return;
        try {
            await window.api.deleteHeldSale(id);
            loadHeldSales();
        } catch (error) {
            console.error("Failed to delete held sale", error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 overflow-hidden bg-white">
                <DialogHeader className="p-6 border-b shrink-0 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                            <ShoppingCart className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black text-slate-900">Suspended Sales</DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium">
                                Resume or manage transactions waiting in the queue
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col">
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                <p className="text-slate-500 font-medium tracking-tight">Loading suspended items...</p>
                            </div>
                        </div>
                    ) : heldSales.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                            <div className="bg-slate-50 p-6 rounded-full mb-4">
                                <ShoppingCart className="h-10 w-10 opacity-20" />
                            </div>
                            <p className="font-bold text-slate-900 text-lg">No suspended sales</p>
                            <p className="text-sm">Held sales will appear here for later resumption</p>
                        </div>
                    ) : (
                        <ScrollArea className="flex-1 p-6">
                            <div className="grid gap-4">
                                {heldSales.map((sale) => (
                                    <div
                                        key={sale.id}
                                        className="group p-5 rounded-2xl border border-slate-100 bg-white hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-100 font-black px-2">
                                                        #{sale.id}
                                                    </Badge>
                                                    <span className="text-sm font-black text-slate-800">
                                                        {sale.customer_name || "Walk-in Customer"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-bold">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {format(new Date(sale.timestamp), "MMM dd, yyyy • HH:mm")}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        {sale.cashier_name}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-primary">GH₵ {sale.total_amount.toFixed(2)}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sale.items.length} Items</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 rounded-xl p-3 mb-4 space-y-1.5">
                                            {sale.items.map((item: any, idx: number) => (
                                                <div key={idx} className="flex justify-between text-xs">
                                                    <span className="text-slate-600 font-medium">
                                                        {item.quantity}x {item.product_name} {item.variation_name ? `(${item.variation_name})` : ''}
                                                    </span>
                                                    <span className="text-slate-400 font-bold">GH₵ {(item.price_at_hold * item.quantity).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {sale.notes && (
                                            <p className="text-xs text-slate-500 italic mb-4 bg-yellow-50/50 p-2 rounded-lg border border-yellow-100/50">
                                                Note: {sale.notes}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-2">
                                            <Button
                                                className="flex-1 bg-slate-900 hover:bg-primary text-white font-black h-11 rounded-xl shadow-lg shadow-slate-200 transition-all group/btn"
                                                onClick={() => onResume(sale)}
                                            >
                                                Resume Sale
                                                <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-11 w-11 border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 rounded-xl transition-all"
                                                onClick={() => handleDelete(sale.id)}
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
