import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, Users, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { Product } from '@/types/product';
import { Customer } from '@/types/customer';
import { cn } from '@/lib/utils';
import { useSearchShortcut } from '@/hooks/useSearchShortcut';

export function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<{
        products: Product[];
        customers: Customer[];
    }>({ products: [], customers: [] });

    const debouncedQuery = useDebounce(query, 300);
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useSearchShortcut(inputRef);

    // Handle clicks outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Perform search
    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setResults({ products: [], customers: [] });
            return;
        }

        const performSearch = async () => {
            setLoading(true);
            try {
                const [productsRes, customersRes] = await Promise.all([
                    window.api.getProducts({ search: debouncedQuery, limit: 5 }),
                    window.api.getCustomers({ search: debouncedQuery, limit: 5 })
                ]);

                setResults({
                    products: productsRes.data || [],
                    customers: customersRes.data || []
                });
            } catch (error) {
                console.error("Global search failed:", error);
            } finally {
                setLoading(false);
            }
        };

        performSearch();
    }, [debouncedQuery]);

    const handleSelect = (type: 'product' | 'customer', id?: number) => {
        if (!id) return;
        setIsOpen(false);
        setQuery('');
        if (type === 'product') {
            navigate('/inventory'); // Or a specific product detail page if it existed
        } else {
            navigate(`/customers/${id}`);
        }
    };

    const hasResults = results.products.length > 0 || results.customers.length > 0;

    return (
        <div ref={containerRef} className="relative max-w-md w-full ml-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
            <Input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder="Search everything... (Press /)"
                className="pl-10 pr-10 bg-slate-50 border-slate-200 focus:bg-white transition-all w-full h-9 rounded-full relative z-10"
            />

            {query && (
                <button
                    onClick={() => { setQuery(''); setResults({ products: [], customers: [] }); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 z-10"
                >
                    <X className="h-3 w-3" />
                </button>
            )}

            {/* Results Overlay */}
            {isOpen && (query.trim() || loading) && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {loading ? (
                        <div className="p-8 flex flex-col items-center justify-center gap-3 text-slate-400">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <p className="text-xs font-medium">Searching records...</p>
                        </div>
                    ) : !hasResults ? (
                        <div className="p-8 text-center text-slate-400">
                            <p className="text-sm">No results found for "{query}"</p>
                        </div>
                    ) : (
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {results.products.length > 0 && (
                                <div className="p-2">
                                    <h3 className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <Package className="h-3 w-3" /> Products
                                    </h3>
                                    <div className="space-y-1">
                                        {results.products.map((p) => (
                                            <button
                                                key={p.id}
                                                onClick={() => handleSelect('product', p.id)}
                                                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors text-left group"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold text-slate-700 truncate group-hover:text-primary transition-colors">{p.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</p>
                                                </div>
                                                <div className="text-right ml-4">
                                                    <p className="text-xs font-black text-slate-900">GH₵ {p.selling_price.toFixed(2)}</p>
                                                    <p className={cn(
                                                        "text-[10px] font-bold",
                                                        p.stock_quantity <= p.reorder_level ? "text-red-500" : "text-emerald-500"
                                                    )}>
                                                        {p.stock_quantity} in stock
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {results.products.length > 0 && results.customers.length > 0 && (
                                <div className="h-[1px] bg-slate-100 mx-4" />
                            )}

                            {results.customers.length > 0 && (
                                <div className="p-2">
                                    <h3 className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <Users className="h-3 w-3" /> Customers
                                    </h3>
                                    <div className="space-y-1">
                                        {results.customers.map((c) => (
                                            <button
                                                key={c.id}
                                                onClick={() => handleSelect('customer', c.id)}
                                                className="w-full flex items-center p-3 rounded-lg hover:bg-slate-50 transition-colors text-left group"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-700 truncate group-hover:text-primary transition-colors">{c.name}</p>
                                                    {c.phone && <p className="text-[10px] text-slate-400">{c.phone}</p>}
                                                </div>
                                                <div className="bg-slate-100 p-1.5 rounded-md group-hover:bg-primary/10 transition-colors">
                                                    <Users className="h-3 w-3 text-slate-400 group-hover:text-primary" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                        <p className="text-[9px] text-slate-400 font-medium">
                            Tip: Use ↑ ↓ to navigate (coming soon)
                        </p>
                        <X className="h-3 w-3 text-slate-300" />
                    </div>
                </div>
            )}
        </div>
    );
}
