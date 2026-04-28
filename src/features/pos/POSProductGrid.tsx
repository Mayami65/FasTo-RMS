import { useState, useEffect, useRef } from 'react';
import { useSearchShortcut } from '@/hooks/useSearchShortcut';
import { Product, ProductVariant } from '@/types/product';
import { Card } from '@/components/ui/card';
import { Package, Search } from 'lucide-react';
import { Category } from '@/types/product';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useFeatures } from '@/hooks/useFeatures';

interface POSProductGridProps {
    products: Product[];
    categories: Category[];
    onAddToCart: (product: Product, variantId?: number) => void;
}

export function POSProductGrid({ products, categories, onAddToCart }: POSProductGridProps) {
    const { hasVariations } = useFeatures();
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isVariantOpen, setIsVariantOpen] = useState(false);
    const [imagePaths, setImagePaths] = useState<Record<string, string>>({});
    const searchInputRef = useRef<HTMLInputElement>(null);

    useSearchShortcut(searchInputRef);

    useEffect(() => {
        const resolveImages = async () => {
            const newPaths: Record<string, string> = {};
            for (const p of products) {
                if (p.image_path) {
                    const fullPath = await window.api.getProductImagePath(p.image_path);
                    if (fullPath) {
                        const normalizedPath = fullPath.replace(/\\/g, '/');
                        newPaths[p.image_path] = `media://${normalizedPath}`;
                    }
                }
            }
            setImagePaths(newPaths);
        };
        resolveImages();
    }, [products]);

    const handleProductClick = (product: Product) => {
        if (hasVariations && product.variants && product.variants.length > 1) {
            setSelectedProduct(product);
            setIsVariantOpen(true);
        } else if (product.variants && product.variants.length >= 1) {
            onAddToCart(product, product.variants[0].id);
        } else {
            onAddToCart(product);
        }
    };

    const handleVariantSelect = (variant: ProductVariant) => {
        if (selectedProduct) {
            onAddToCart(selectedProduct, variant.id);
            setIsVariantOpen(false);
            setSelectedProduct(null);
        }
    };

    const parentCategories = categories.filter(c => !c.parent_id && c.is_archived !== 1);

    const filteredProducts = products.filter(p => {
        const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategoryId === null || p.category_id === selectedCategoryId ||
            categories.find(c => c.id === p.category_id)?.parent_id === selectedCategoryId;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="flex flex-col h-full gap-4">
            {/* Top Row: Search and Category Tabs */}
            <div className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            ref={searchInputRef}
                            placeholder="Quick search products (SKU or Name)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/20 rounded-lg transition-all"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Horizontal Category Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    <Button
                        variant={selectedCategoryId === null ? "default" : "outline"}
                        size="sm"
                        className={cn(
                            "rounded-full px-5 whitespace-nowrap",
                            selectedCategoryId === null ? "bg-slate-900" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                        onClick={() => setSelectedCategoryId(null)}
                    >
                        All Categories
                    </Button>
                    {parentCategories.map(category => (
                        <Button
                            key={category.id}
                            variant={selectedCategoryId === category.id ? "default" : "outline"}
                            size="sm"
                            className={cn(
                                "rounded-full px-5 whitespace-nowrap",
                                selectedCategoryId === category.id ? "bg-slate-900" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                            )}
                            onClick={() => setSelectedCategoryId(category.id)}
                        >
                            {category.name}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Product Grid Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 pb-4">
                    {filteredProducts.map(product => {
                        const isOutOfStock = product.stock_quantity === 0;
                        const isLowStock = !isOutOfStock && product.stock_quantity <= product.reorder_level;

                        return (
                            <Card
                                key={product.id}
                                className={cn(
                                    "cursor-pointer transition-all duration-300 flex flex-col group relative overflow-hidden border border-slate-200 shadow-sm bg-white rounded-xl min-h-[280px]",
                                    isOutOfStock
                                        ? "opacity-60 cursor-not-allowed"
                                        : "hover:shadow-md hover:-translate-y-1 hover:border-primary/30"
                                )}
                                onClick={() => !isOutOfStock && handleProductClick(product)}
                            >
                                {/* Out of Stock Overlay */}
                                {isOutOfStock && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                        <Badge variant="destructive" className="font-bold px-3 py-1 shadow-lg capitalize">
                                            Out of Stock
                                        </Badge>
                                    </div>
                                )}

                                <div className="p-3 pb-0 flex-1 flex flex-col">
                                    {/* Image Area */}
                                    <div className="aspect-square w-full mb-3 relative bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden border border-slate-100">
                                        {product.image_path && imagePaths[product.image_path] ? (
                                            <img
                                                src={imagePaths[product.image_path]}
                                                alt={product.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-1">
                                                <Package className="h-10 w-10 text-slate-200" />
                                            </div>
                                        )}

                                        {/* Low Stock Badge */}
                                        {isLowStock && (
                                            <div className="absolute top-2 left-2">
                                                <Badge className="bg-amber-500 hover:bg-amber-500 text-[10px] h-5 py-0 px-1.5 uppercase font-black">Low</Badge>
                                            </div>
                                        )}

                                        {/* Price Overlay */}
                                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-md shadow-sm">
                                            <span className="text-sm font-bold text-slate-900">
                                                GH₵ {product.variants && product.variants.length > 1 ? (
                                                    Math.min(...product.variants.map((v: any) => v.selling_price)).toFixed(0)
                                                ) : (
                                                    product.selling_price.toFixed(2)
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="w-full space-y-1 mb-3">
                                        <h3 className="text-sm font-bold leading-tight text-slate-800 line-clamp-2 min-h-[2.5em] group-hover:text-primary transition-colors">
                                            {product.name}
                                        </h3>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.sku}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                            <span className={cn(
                                                "text-[10px] font-bold",
                                                isLowStock ? "text-amber-600" : "text-slate-500"
                                            )}>
                                                {product.stock_quantity} in stock
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-dashed border-slate-300">
                        <div className="bg-slate-50 p-4 rounded-full mb-4">
                            <Search className="h-8 w-8 text-slate-300" />
                        </div>
                        <h3 className="text-slate-900 font-bold mb-1">No products found</h3>
                        <p className="text-slate-500 text-sm">Try adjusting your search or category filters</p>
                        <Button variant="link" onClick={() => { setSearchQuery(''); setSelectedCategoryId(null) }} className="mt-2 text-primary">
                            Clear all filters
                        </Button>
                    </div>
                )}

                <Dialog open={isVariantOpen} onOpenChange={setIsVariantOpen}>
                    <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-2xl shadow-2xl flex flex-col h-auto max-h-[85vh]">
                        <DialogHeader className="p-6 bg-slate-900 text-white shrink-0">
                            <DialogTitle className="text-2xl font-bold">Select Variation</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Choose a specific type for <span className="text-white font-semibold">{selectedProduct?.name}</span>
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-slate-50 min-h-0">
                            <div className="grid gap-3">
                                {selectedProduct?.variants?.map((variant: any) => (
                                    <button
                                        key={variant.id}
                                        disabled={variant.stock_quantity === 0}
                                        onClick={() => handleVariantSelect(variant)}
                                        className={cn(
                                            "w-full text-left p-4 rounded-xl border bg-white transition-all group relative overflow-hidden shadow-sm hover:shadow-md",
                                            variant.stock_quantity === 0
                                                ? "opacity-50 cursor-not-allowed border-slate-200"
                                                : "border-slate-200 hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]"
                                        )}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-slate-800 text-lg leading-tight">{variant.variation_name}</span>
                                            <span className="text-primary font-black text-xl whitespace-nowrap ml-3">GH₵ {variant.selling_price.toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="rounded-md font-mono text-[10px] h-5 bg-slate-50 text-slate-500">
                                                {variant.sku}
                                            </Badge>
                                            <div className="flex items-center gap-1.5">
                                                <div className={cn("w-2 h-2 rounded-full", variant.stock_quantity <= variant.reorder_level ? "bg-amber-500" : "bg-emerald-500")} />
                                                <span className={cn(
                                                    "text-xs font-bold",
                                                    variant.stock_quantity <= variant.reorder_level ? "text-amber-600" : "text-emerald-600"
                                                )}>
                                                    {variant.stock_quantity} available
                                                </span>
                                            </div>
                                        </div>
                                        {variant.stock_quantity > 0 && (
                                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-white border-t border-slate-100 flex justify-end shrink-0">
                            <Button variant="ghost" onClick={() => setIsVariantOpen(false)} className="rounded-lg px-6 font-bold">
                                Close
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
