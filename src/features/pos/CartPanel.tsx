import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function CartPanel({ onCheckout }: { onCheckout: () => void }) {
    const { cart, updateQuantity, removeFromCart, totalAmount, clearCart } = useCart();

    if (cart.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 border-2 border-dashed border-slate-100 rounded-xl m-4 bg-slate-50/50">
                <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                    <ShoppingCart className="h-10 w-10 opacity-40 text-primary" />
                </div>
                <p className="font-bold text-slate-900 text-lg">Cart is empty</p>
                <p className="text-sm text-center">Scan a product or select from the catalog to start a sale</p>
                <div className="mt-6 flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md border border-slate-200">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Keyboard</span>
                    <span className="text-xs font-bold text-slate-600">Press / to search</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white relative">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                        <ShoppingCart className="h-5 w-5" />
                    </div>
                    <h2 className="font-extrabold text-slate-900 text-lg">Current Sale</h2>
                </div>
                <Badge className="bg-slate-100 hover:bg-slate-100 text-slate-600 font-bold border-none px-3 py-1">
                    {cart.length} ITEMS
                </Badge>
            </div>

            <ScrollArea className="flex-1 px-4 py-2 custom-scrollbar">
                <div className="space-y-3 py-2">
                    {cart.map((item) => (
                        <div
                            key={`${item.id}-${item.variantId || 'base'}`}
                            className="p-3 rounded-xl border border-slate-100 bg-white transition-all hover:border-primary/20 hover:shadow-sm"
                        >
                            <div className="flex justify-between items-start gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 text-sm truncate leading-tight">
                                                {item.name}
                                            </p>
                                        </div>
                                        {item.variationName && (
                                            <Badge className="text-[9px] h-4 px-1.5 uppercase font-black border-none bg-slate-900 text-white">
                                                {item.variationName}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400">
                                        GH₵ {item.selling_price.toFixed(2)} unit
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-slate-300 hover:text-red-500 hover:bg-red-50 -mt-1 -mr-1 rounded-full transition-colors"
                                    onClick={() => removeFromCart(item.id!, item.variantId)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex items-center justify-between gap-4 pt-3 mt-2 border-t border-slate-50">
                                <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-0.5 border border-slate-100">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 bg-white hover:bg-slate-100 shadow-sm border border-slate-100 rounded-md"
                                        onClick={() => updateQuantity(item.id!, item.variantId, item.quantity - 1)}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center text-sm font-black text-slate-700">{item.quantity}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 bg-white hover:bg-slate-100 shadow-sm border border-slate-100 rounded-md"
                                        onClick={() => updateQuantity(item.id!, item.variantId, item.quantity + 1)}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>

                                <div className="text-right">
                                    <p className="font-black text-sm text-slate-900">
                                        GH₵ {(item.selling_price * item.quantity).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4 shrink-0 rounded-b-xl">
                <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Subtotal</span>
                        <span className="font-bold text-slate-700">GH₵ {totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center px-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Discount</span>
                        <span className="font-bold text-slate-400">GH₵ 0.00</span>
                    </div>
                    <div className="h-[1px] bg-slate-200 my-4" />
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-black text-slate-900 uppercase">Total Due</span>
                        <span className="text-3xl font-black text-primary tracking-tight">GH₵ {totalAmount.toFixed(2)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-2">
                    <Button
                        variant="outline"
                        onClick={clearCart}
                        className="col-span-1 h-12 border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all rounded-xl"
                        title="Clear Cart"
                    >
                        <Trash2 className="h-5 w-5" />
                    </Button>
                    <Button
                        size="lg"
                        onClick={onCheckout}
                        className="col-span-3 h-12 bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-200 hover:shadow-2xl transition-all rounded-xl font-black text-lg uppercase tracking-wide"
                    >
                        Process Checkout
                    </Button>
                </div>
            </div>
        </div>
    );
}
