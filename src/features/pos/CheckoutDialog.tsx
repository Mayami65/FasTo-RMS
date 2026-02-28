import { useState, useEffect, useRef } from 'react';
import { useCart } from '@/context/CartContext';
import { Discount } from '@/types/sale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useFeatures } from '@/hooks/useFeatures';
import { useSettings } from '@/context/SettingsContext';
import { Users, Plus, Search, AlertCircle, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CheckoutDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (data: {
        paymentMethod: string;
        amountTendered: number;
        customerId?: number;
        customerName?: string;
        hpDuration?: string;
        momoTransactionId?: string;
        momoProvider?: string;
        discount_amount?: number;
        coupon_id?: number;
    }) => Promise<void>;
}

export function CheckoutDialog({ open, onClose, onConfirm }: CheckoutDialogProps) {
    const { totalAmount } = useCart();
    const { hasHirePurchase } = useFeatures();
    const { settings } = useSettings();
    const customerSelectRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [error, setError] = useState<string | null>(null);
    const [amountTendered, setAmountTendered] = useState<string>('');
    const [customerId, setCustomerId] = useState<string>('');
    const [customers, setCustomers] = useState<any[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Quick Add Customer State
    const [isQuickAdd, setIsQuickAdd] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });
    const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
    const [duplicateCustomer, setDuplicateCustomer] = useState<any>(null);

    const [hpDuration, setHpDuration] = useState('TWO_WEEKS');
    const [momoTransactionId, setMomoTransactionId] = useState('');
    const [momoProvider, setMomoProvider] = useState('');

    // Search Picker State
    const [customerSearch, setCustomerSearch] = useState('');
    const [recentCustomers, setRecentCustomers] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [selectedDiscountId, setSelectedDiscountId] = useState<string>('none');

    useEffect(() => {
        if (open) {
            setAmountTendered('');
            setPaymentMethod('CASH');
            setCustomerId('none');
            setHpDuration('TWO_WEEKS');
            setMomoTransactionId('');
            setMomoProvider('');
            setSelectedDiscountId('none');
            setError(null);
            setIsProcessing(false);
            setIsQuickAdd(false);
            setNewCustomer({ name: '', phone: '' });
            setDuplicateCustomer(null);
            setCustomerSearch('');
            setShowResults(false);
            loadRecentCustomers();
            loadDiscounts();
        }
    }, [open]);

    // Handle Payment Method specific defaults
    useEffect(() => {
        if (paymentMethod === 'HIRE_PURCHASE' && customerId === 'none') {
            setCustomerId('');
        } else if (paymentMethod !== 'HIRE_PURCHASE' && !customerId) {
            setCustomerId('none');
        }
    }, [paymentMethod]);

    // Load Recent Customers
    const loadRecentCustomers = async () => {
        try {
            const results = await window.api.getRecentCustomers({ limit: 5 });
            setRecentCustomers(results || []);
        } catch (e) {
            console.error("Failed to load recent customers", e);
        }
    };

    // Debounced Search
    useEffect(() => {
        if (!customerSearch) {
            setCustomers([]);
            setIsSearching(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const response = await window.api.getCustomers({ search: customerSearch, limit: 10 });
                if (response && 'data' in response) {
                    setCustomers(response.data);
                } else {
                    setCustomers(Array.isArray(response) ? response : []);
                }
            } catch (e) {
                console.error("Search failed", e);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [customerSearch]);

    // Outside click to close results
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (resultsRef.current && !resultsRef.current.contains(e.target as Node) && !customerSelectRef.current?.contains(e.target as Node)) {
                setShowResults(false);
                setCustomerId(prev => {
                    if (!prev && !isQuickAdd && paymentMethod !== 'HIRE_PURCHASE') return 'none';
                    return prev;
                });
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isQuickAdd, paymentMethod]);

    // F2 Shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F2' && open) {
                e.preventDefault();
                customerSelectRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open]);

    const trackingEnabled = settings.customer_tracking_enabled === 'true';

    const loadDiscounts = async () => {
        try {
            const data = await window.api.getDiscounts();
            setDiscounts(data);
        } catch (e) {
            console.error("Failed to load discounts", e);
        }
    };

    const selectedDiscount = discounts.find(d => d.id?.toString() === selectedDiscountId);
    let appliedDiscountAmount = 0;
    if (selectedDiscount) {
        if (selectedDiscount.type === 'PERCENTAGE') {
            appliedDiscountAmount = (totalAmount * selectedDiscount.value) / 100;
        } else {
            appliedDiscountAmount = selectedDiscount.value;
        }
    }

    const finalTotal = Math.max(0, totalAmount - appliedDiscountAmount);
    const change = (parseFloat(amountTendered) || 0) - finalTotal;

    // Validation Logic
    const isHP = paymentMethod === 'HIRE_PURCHASE';
    const isMomo = paymentMethod === 'MOBILE_MONEY';
    const numericAmount = parseFloat(amountTendered) || 0;

    const isValid =
        (isHP ? (!!customerId && customerId !== 'none' && numericAmount >= 0) : (numericAmount >= finalTotal || isHP)) &&
        (isMomo ? (!!momoTransactionId && !!momoProvider) : true) &&
        !isQuickAdd;

    const handleQuickAdd = async () => {
        if (!newCustomer.phone) return;
        setIsCheckingDuplicate(true);
        try {
            const exists = await window.api.checkCustomerExists(newCustomer.phone);
            if (exists) {
                setDuplicateCustomer(exists);
            } else {
                const result = await window.api.addCustomer(newCustomer);
                if (result.success) {
                    const addedCustomer = { id: result.id, ...newCustomer };
                    setRecentCustomers(prev => [addedCustomer, ...prev.filter(c => c.id !== result.id)].slice(0, 5));
                    setCustomerId(result.id.toString());
                    setIsQuickAdd(false);
                } else {
                    setError(result.error || null);
                }
            }
        } catch (e) {
            console.error("Quick add failed", e);
            setError("Failed to add customer");
        } finally {
            setIsCheckingDuplicate(false);
        }
    };

    const handleConfirm = async () => {
        if (!isValid) return;
        setIsProcessing(true);
        setError(null);

        const selectedCustomer = customers.find(c => c.id.toString() === customerId) || recentCustomers.find(c => c.id.toString() === customerId);

        try {
            await onConfirm({
                paymentMethod,
                amountTendered: numericAmount,
                customerId: (customerId && customerId !== 'none') ? parseInt(customerId) : undefined,
                customerName: customerId === 'none' ? 'Walk-in Customer' : selectedCustomer?.name,
                hpDuration: isHP ? hpDuration : undefined,
                momoTransactionId: isMomo ? momoTransactionId : undefined,
                momoProvider: isMomo ? momoProvider : undefined,
                discount_amount: appliedDiscountAmount > 0 ? appliedDiscountAmount : undefined,
                coupon_id: selectedDiscount ? selectedDiscount.id : undefined
            });
        } catch (err: any) {
            console.error("Checkout failed:", err);
            setError(err.message || 'Transaction failed');
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Checkout</DialogTitle>
                    <DialogDescription>
                        Select payment method and finalize the transaction.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 max-h-[80vh] overflow-y-auto px-1">
                    {error && (
                        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-between items-center text-xl font-bold">
                        <span>Grand Total:</span>
                        <div className="text-right">
                            {appliedDiscountAmount > 0 && (
                                <p className="text-sm text-green-600 line-through font-normal opacity-50">GH₵ {totalAmount.toFixed(2)}</p>
                            )}
                            <span>GH₵ {finalTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CASH">Cash</SelectItem>
                                <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                                {hasHirePurchase && <SelectItem value="HIRE_PURCHASE">Hire Purchase Edition</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>

                    {(trackingEnabled || isHP) && (
                        <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-primary" />
                                    Customer {isHP ? '(Required)' : '(Optional)'}
                                </Label>
                                {!isQuickAdd && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-[10px] font-bold uppercase tracking-wider"
                                        onClick={() => setIsQuickAdd(true)}
                                    >
                                        <Plus className="h-3 w-3 mr-1" /> Quick Add
                                    </Button>
                                )}
                            </div>

                            {isQuickAdd ? (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-[10px]">Phone Number</Label>
                                            <Input
                                                className="h-8 text-xs"
                                                placeholder="024xxxxxxx"
                                                value={newCustomer.phone}
                                                onChange={(e) => {
                                                    setNewCustomer(prev => ({ ...prev, phone: e.target.value }));
                                                    setDuplicateCustomer(null);
                                                }}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px]">Name (Optional)</Label>
                                            <Input
                                                className="h-8 text-xs"
                                                placeholder="John Doe"
                                                value={newCustomer.name}
                                                onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    {duplicateCustomer && (
                                        <div className="p-2 bg-amber-50 border border-amber-100 rounded text-[10px] text-amber-800 flex items-center gap-2">
                                            <AlertCircle className="h-3 w-3" />
                                            <span>Already exists: <strong>{duplicateCustomer.name}</strong></span>
                                            <Button
                                                variant="link"
                                                className="h-auto p-0 text-[10px] font-bold ml-auto"
                                                onClick={() => {
                                                    setCustomerId(duplicateCustomer.id.toString());
                                                    setIsQuickAdd(false);
                                                }}
                                            >
                                                Select Him
                                            </Button>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 flex-1 text-xs"
                                            onClick={() => {
                                                setIsQuickAdd(false);
                                                setDuplicateCustomer(null);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="h-8 flex-1 text-xs"
                                            onClick={handleQuickAdd}
                                            disabled={!newCustomer.phone || isCheckingDuplicate}
                                        >
                                            {isCheckingDuplicate ? '...' : 'Save & Select'}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="relative group">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                ref={customerSelectRef}
                                                className="pl-9 h-11 bg-white border-slate-200 focus:ring-primary/20 transition-all font-medium"
                                                placeholder="Search name or phone..."
                                                value={(!showResults && customerId === 'none') ? 'Walk-in Customer' : (!customerId ? customerSearch : (customers.find(c => c.id.toString() === customerId)?.name || recentCustomers.find(c => c.id.toString() === customerId)?.name || 'Walk-in Customer'))}
                                                onChange={(e) => {
                                                    setCustomerSearch(e.target.value);
                                                    setCustomerId('');
                                                    setShowResults(true);
                                                    setHighlightedIndex(0);
                                                }}
                                                onFocus={() => {
                                                    setShowResults(true);
                                                    if (customerId === 'none') {
                                                        setCustomerId('');
                                                        setCustomerSearch('');
                                                    } else if (customerId) {
                                                        setCustomerSearch('');
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'ArrowDown') {
                                                        e.preventDefault();
                                                        setHighlightedIndex(prev => Math.min(prev + 1, customers.length));
                                                    } else if (e.key === 'ArrowUp') {
                                                        e.preventDefault();
                                                        setHighlightedIndex(prev => Math.max(prev - 1, 0));
                                                    } else if (e.key === 'Enter' && showResults) {
                                                        e.preventDefault();
                                                        if (highlightedIndex === 0) {
                                                            setCustomerId('none');
                                                        } else if (customers[highlightedIndex - 1]) {
                                                            setCustomerId(customers[highlightedIndex - 1].id.toString());
                                                        }
                                                        setShowResults(false);
                                                    } else if (e.key === 'Escape') {
                                                        setShowResults(false);
                                                    }
                                                }}
                                            />
                                            {customerId && customerId !== 'none' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setCustomerId(paymentMethod === 'HIRE_PURCHASE' ? '' : 'none');
                                                        setCustomerSearch('');
                                                    }}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>

                                        {showResults && (
                                            <div
                                                ref={resultsRef}
                                                className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                                            >
                                                <div className="max-h-[250px] overflow-y-auto py-1">
                                                    {paymentMethod !== 'HIRE_PURCHASE' && (
                                                        <div
                                                            className={cn(
                                                                "px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors",
                                                                highlightedIndex === 0 ? "bg-primary/10 text-primary font-bold" : "hover:bg-slate-50"
                                                            )}
                                                            onClick={() => {
                                                                setCustomerId('none');
                                                                setShowResults(false);
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
                                                                    <Users className="h-3 w-3 text-slate-400" />
                                                                </div>
                                                                <span className="text-sm">Walk-in Customer</span>
                                                            </div>
                                                            <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase h-4">DEFAULT</Badge>
                                                        </div>
                                                    )}

                                                    {isSearching ? (
                                                        <div className="px-4 py-8 text-center text-xs text-slate-400 italic">Searching...</div>
                                                    ) : customers.length > 0 ? (
                                                        customers.map((c, idx) => (
                                                            <div
                                                                key={c.id}
                                                                className={cn(
                                                                    "px-4 py-2.5 flex flex-col cursor-pointer transition-colors",
                                                                    highlightedIndex === idx + 1 ? "bg-primary/10 text-primary" : "hover:bg-slate-50"
                                                                )}
                                                                onClick={() => {
                                                                    setCustomerId(c.id.toString());
                                                                    setShowResults(false);
                                                                }}
                                                            >
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-sm font-bold">{c.name || 'No Name'}</span>
                                                                    <span className="text-[10px] font-mono opacity-60">{c.phone}</span>
                                                                </div>
                                                                <span className="text-[10px] opacity-40 uppercase font-black tracking-tighter">Gold Customer</span>
                                                            </div>
                                                        ))
                                                    ) : customerSearch ? (
                                                        <div className="px-4 py-8 text-center">
                                                            <p className="text-xs text-slate-400 font-medium">No results found for "{customerSearch}"</p>
                                                            <Button
                                                                variant="link"
                                                                className="h-auto p-0 mt-2 text-primary font-black text-xs uppercase underline decoration-2 underline-offset-4"
                                                                onClick={() => {
                                                                    setNewCustomer(prev => ({ ...prev, name: customerSearch }));
                                                                    setIsQuickAdd(true);
                                                                }}
                                                            >
                                                                Create "{customerSearch}"?
                                                            </Button>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {recentCustomers.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest w-full mb-0.5">Focus: Recent</span>
                                            {recentCustomers.map((c) => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => setCustomerId(c.id.toString())}
                                                    className={cn(
                                                        "text-[10px] font-bold px-2 py-1 rounded-lg border transition-all truncate max-w-[120px]",
                                                        customerId === c.id.toString()
                                                            ? "bg-primary border-primary text-white shadow-md shadow-primary/20 scale-105"
                                                            : "bg-white border-slate-200 text-slate-600 hover:border-primary hover:text-primary"
                                                    )}
                                                >
                                                    {c.name || c.phone}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {!isQuickAdd && (
                                        <div className="flex items-center justify-between p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                                            <p className="text-[9px] text-blue-600 font-bold italic flex items-center gap-1">
                                                <kbd className="bg-blue-100 px-1 rounded text-blue-700 not-italic">F2</kbd> Focus Search
                                            </p>
                                            <p className="text-[9px] text-blue-600 font-bold italic flex items-center gap-1">
                                                <kbd className="bg-blue-100 px-1 rounded text-blue-700 not-italic">Enter</kbd> Select
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Apply Discount</Label>
                        <Select value={selectedDiscountId} onValueChange={setSelectedDiscountId}>
                            <SelectTrigger className="border-green-200 bg-green-50/30 dark:bg-green-900/10">
                                <SelectValue placeholder="No discount applied" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No Discount</SelectItem>
                                {discounts.map(d => (
                                    <SelectItem key={d.id} value={d.id!.toString()}>
                                        {d.name} ({d.type === 'PERCENTAGE' ? `${d.value}%` : `GH₵ ${d.value}`})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {appliedDiscountAmount > 0 && (
                            <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">
                                Saving GH₵ {appliedDiscountAmount.toFixed(2)}!
                            </p>
                        )}
                    </div>

                    {isHP && (
                        <div className="space-y-2 p-3 bg-red-50/50 rounded-lg border border-red-100">
                            <Label className="text-red-800">Hire Purchase Duration</Label>
                            <Select value={hpDuration} onValueChange={setHpDuration}>
                                <SelectTrigger className="border-red-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TWO_WEEKS">2 Weeks</SelectItem>
                                    <SelectItem value="ONE_MONTH">1 Month</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {paymentMethod === 'MOBILE_MONEY' && (
                        <>
                            <div className="space-y-2">
                                <Label>Transaction ID</Label>
                                <Input
                                    value={momoTransactionId}
                                    onChange={(e) => setMomoTransactionId(e.target.value)}
                                    placeholder="Enter Transaction ID"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Provider</Label>
                                <Select value={momoProvider} onValueChange={setMomoProvider}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Provider" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MTN">MTN</SelectItem>
                                        <SelectItem value="VODAFONE">Vodafone / Telecel</SelectItem>
                                        <SelectItem value="AIRTELTIGO">AirtelTigo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <Label>{isHP ? 'Initial Deposit' : 'Amount Tendered'}</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={amountTendered}
                            onChange={(e) => setAmountTendered(e.target.value)}
                            className="text-lg font-bold bg-slate-50 focus:bg-white"
                            autoFocus
                        />
                    </div>

                    {!isHP && (
                        <div className={cn("p-4 rounded-md text-center", change >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                            <p className="text-sm font-medium">Change Due</p>
                            <p className="text-2xl font-bold">GH₵ {change >= 0 ? change.toFixed(2) : '---'}</p>
                        </div>
                    )}

                    <div className="p-4 rounded-md text-center bg-blue-50 text-blue-800">
                        <p className="text-sm font-medium">Balance Due</p>
                        <p className="text-2xl font-bold">GH₵ {(finalTotal - numericAmount).toFixed(2)}</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!isValid || isProcessing}
                        className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                    >
                        {isProcessing ? 'Processing...' : 'Complete Sale'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
