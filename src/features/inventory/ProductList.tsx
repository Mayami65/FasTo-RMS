import { Product } from '@/types/product';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Package, Search, ChevronDown, ChevronRight, Tags } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, Fragment } from 'react';
import { Category } from '@/types/product';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Download, FilterX } from 'lucide-react';
interface ProductListProps {
    products: Product[];
    search: string;
    onSearchChange: (search: string) => void;
    pagination: {
        page: number;
        total: number;
        totalPages: number;
        limit: number;
    };
    onPageChange: (page: number) => void;
    onEdit: (product: Product) => void;
    onDelete: (id: number) => void;
    onStockAction: (product: Product) => void;
    categoryId: number | 'none' | null;
    onCategoryChange: (id: number | 'none' | null) => void;
    stockStatus: 'all' | 'low_stock' | 'out_of_stock' | 'in_stock';
    onStockStatusChange: (status: 'all' | 'low_stock' | 'out_of_stock' | 'in_stock') => void;
}

export function ProductList({
    products,
    search,
    onSearchChange,
    pagination,
    onPageChange,
    onEdit,
    onDelete,
    onStockAction,
    categoryId,
    onCategoryChange,
    stockStatus,
    onStockStatusChange
}: ProductListProps) {
    const { page, totalPages } = pagination;
    const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
    const [categories, setCategories] = useState<Category[]>([]);
    const [imagePaths, setImagePaths] = useState<Record<string, string>>({});

    useEffect(() => {
        const resolveImages = async () => {
            const newPaths: Record<string, string> = {};
            for (const p of products) {
                if (p.image_path) {
                    const fullPath = await window.api.getProductImagePath(p.image_path);
                    if (fullPath) newPaths[p.image_path] = `media://${fullPath}`;
                }
            }
            setImagePaths(newPaths);
        };
        resolveImages();
    }, [products]);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const data = await window.api.getCategories();
                setCategories(data);
            } catch (error) {
                console.error("Failed to load categories", error);
            }
        };
        loadCategories();
    }, []);


    const handleExport = () => {
        const headers = ["SKU", "Name", "Category", "Cost Price", "Selling Price", "Stock Quantity", "Reorder Level", "Description"];
        const rows = products.map(p => [
            p.sku,
            p.name,
            p.category_name || p.category || 'Uncategorized',
            p.cost_price,
            p.selling_price,
            p.stock_quantity,
            p.reorder_level,
            p.description || ''
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(value => `"${value}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const resetFilters = () => {
        onSearchChange('');
        onCategoryChange(null);
        onStockStatusChange('all');
    };

    const toggleRow = (id: number) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const getStockBadge = (quantity: number, reorderLevel: number) => {
        if (quantity === 0) {
            return <Badge variant="destructive" className="text-[10px] h-5 px-1.5 uppercase font-bold">Out of Stock</Badge>;
        } else if (quantity <= reorderLevel) {
            return <Badge variant="outline" className="text-[10px] h-5 px-1.5 uppercase font-bold border-yellow-500 text-yellow-600 dark:text-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20">Low Stock</Badge>;
        } else {
            return <Badge variant="outline" className="text-[10px] h-5 px-1.5 uppercase font-bold border-green-500 text-green-600 dark:text-green-500 bg-green-50/50 dark:bg-green-950/20">In Stock</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-4 bg-slate-50/50 border-b border-slate-100">
                <div className="flex flex-1 flex-wrap items-center gap-3 w-full">
                    <div className="relative flex-1 min-w-[240px] max-w-sm">
                        <Search className="absolute left-3 top-[11px] h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search Name or SKU..."
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-10 h-10 bg-white border-slate-200 focus-visible:ring-primary/20"
                        />
                    </div>

                    <Select
                        value={categoryId?.toString() || 'all'}
                        onValueChange={(val) => onCategoryChange(val === 'all' ? null : (val === 'none' ? 'none' : parseInt(val)))}
                    >
                        <SelectTrigger className="w-[180px] h-10 bg-white border-slate-200">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200">
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="none">Uncategorized</SelectItem>
                            {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id.toString()}>
                                    <div className="flex items-center gap-2">
                                        {cat.color && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />}
                                        {cat.name}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={stockStatus}
                        onValueChange={(val: any) => onStockStatusChange(val)}
                    >
                        <SelectTrigger className="w-[160px] h-10 bg-white border-slate-200">
                            <SelectValue placeholder="Stock Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="in_stock">In Stock</SelectItem>
                            <SelectItem value="low_stock">Low Stock</SelectItem>
                            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                        </SelectContent>
                    </Select>

                    {(search || categoryId !== null || stockStatus !== 'all') && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetFilters}
                            className="h-10 px-3 text-slate-400 hover:text-red-500 hover:bg-red-50 font-bold uppercase text-[10px] tracking-widest"
                        >
                            <FilterX className="h-4 w-4 mr-2" /> Clear
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        className="h-10 border-slate-200 text-slate-600 font-bold bg-white"
                    >
                        <Download className="h-4 w-4 mr-2" /> Export
                    </Button>
                </div>
            </div>

            <div className="table-shell mx-4 mb-4">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-100">
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 py-4">SKU / Item Name</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400 py-4">Category</TableHead>
                            <TableHead className="text-right font-black uppercase text-[10px] tracking-widest text-slate-400 py-4">Pricing</TableHead>
                            <TableHead className="text-center font-black uppercase text-[10px] tracking-widest text-slate-400 py-4">Quantity</TableHead>
                            <TableHead className="text-center font-black uppercase text-[10px] tracking-widest text-slate-400 py-4">Status</TableHead>
                            <TableHead className="text-center font-black uppercase text-[10px] tracking-widest text-slate-400 py-4">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No products found.</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => {
                                const hasVariants = product.variants && product.variants.length > 0;
                                const isExpanded = expandedRows[product.id!];
                                const totalStock = hasVariants
                                    ? product.variants!.reduce((sum, v) => sum + v.stock_quantity, 0)
                                    : product.stock_quantity;

                                const minPrice = hasVariants
                                    ? Math.min(...product.variants!.map(v => v.selling_price))
                                    : product.selling_price;

                                const maxPrice = hasVariants
                                    ? Math.max(...product.variants!.map(v => v.selling_price))
                                    : product.selling_price;

                                return (
                                    <Fragment key={product.id}>
                                        <TableRow className={cn(
                                            "group transition-colors",
                                            isExpanded ? "bg-slate-50/80 dark:bg-slate-900/40" : "hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
                                        )}>
                                            <TableCell>
                                                {hasVariants && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => toggleRow(product.id!)}
                                                    >
                                                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                    </Button>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-border/50 shrink-0 shadow-sm">
                                                        {product.image_path && imagePaths[product.image_path] ? (
                                                            <img
                                                                src={imagePaths[product.image_path]}
                                                                alt={product.name}
                                                                className="h-full w-full object-cover"
                                                                loading="lazy"
                                                            />
                                                        ) : (
                                                            <Package className="h-5 w-5 text-muted-foreground/30" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-[13px] tracking-tight group-hover:text-primary transition-colors">{product.name}</span>
                                                        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">{product.sku}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {product.category_color && (
                                                        <div
                                                            className="w-2 h-2 rounded-full shrink-0"
                                                            style={{ backgroundColor: product.category_color }}
                                                        />
                                                    )}
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-[10px] font-bold py-0 h-5 lowercase whitespace-nowrap border"
                                                        style={product.category_color ? {
                                                            borderColor: `${product.category_color}60`,
                                                            color: product.category_color,
                                                            backgroundColor: `${product.category_color}20`
                                                        } : {
                                                            backgroundColor: 'rgba(100, 116, 139, 0.1)',
                                                            color: '#94a3b8',
                                                            borderColor: 'rgba(148, 163, 184, 0.2)'
                                                        }}
                                                    >
                                                        {product.category_name || product.category || 'Uncategorized'}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-bold text-sm">
                                                        GH₵ {hasVariants && minPrice !== maxPrice ? `${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}` : minPrice.toFixed(2)}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        Cost: GH₵ {product.cost_price.toFixed(2)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className={cn(
                                                        "text-sm font-bold tracking-tight",
                                                        totalStock <= product.reorder_level
                                                            ? 'text-red-600 dark:text-red-400'
                                                            : 'text-slate-900 dark:text-slate-100'
                                                    )}>
                                                        {totalStock}
                                                    </span>
                                                    {hasVariants && <span className="text-[10px] text-muted-foreground uppercase font-medium">{product.variants!.length} Variations</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {getStockBadge(totalStock, product.reorder_level)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex justify-center gap-1">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        title="Manage Stock"
                                                        onClick={() => onStockAction(product)}
                                                        className="h-8 w-8 border-0 bg-transparent hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-400"
                                                    >
                                                        <Package className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        title="Edit Product"
                                                        onClick={() => onEdit(product)}
                                                        className="h-8 w-8 border-0 bg-transparent hover:bg-primary/10 hover:text-primary"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        title="Delete Product"
                                                        className="h-8 w-8 border-0 bg-transparent hover:bg-destructive/10 hover:text-destructive"
                                                        onClick={() => product.id && onDelete(product.id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        {hasVariants && isExpanded && (
                                            <TableRow className="bg-slate-50/30 dark:bg-slate-900/20">
                                                <TableCell colSpan={8} className="p-0 border-t-0">
                                                    <div className="pl-[50px] pr-8 py-3 animate-in slide-in-from-top-2 duration-300">
                                                        <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                                                            <Table className="text-xs">
                                                                <TableHeader>
                                                                    <TableRow className="bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-100/50 border-b">
                                                                        <TableHead className="h-8 font-bold text-[10px] text-muted-foreground uppercase">Variation</TableHead>
                                                                        <TableHead className="h-8 font-bold text-[10px] text-muted-foreground uppercase">SKU</TableHead>
                                                                        <TableHead className="h-8 text-right font-bold text-[10px] text-muted-foreground uppercase">Cost</TableHead>
                                                                        <TableHead className="h-8 text-right font-bold text-[10px] text-muted-foreground uppercase">Price</TableHead>
                                                                        <TableHead className="h-8 text-center font-bold text-[10px] text-muted-foreground uppercase">Stock</TableHead>
                                                                        <TableHead className="h-8 text-center font-bold text-[10px] text-muted-foreground uppercase">Status</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {product.variants!.map((variant) => (
                                                                        <TableRow key={variant.id} className="hover:bg-muted/30">
                                                                            <TableCell className="py-2 flex items-center gap-2">
                                                                                <Tags className="h-3 w-3 text-muted-foreground" />
                                                                                <span className="font-semibold">{variant.variation_name}</span>
                                                                            </TableCell>
                                                                            <TableCell className="py-2 font-mono text-[10px]">{variant.sku}</TableCell>
                                                                            <TableCell className="py-2 text-right text-muted-foreground italic">GH₵ {variant.cost_price.toFixed(2)}</TableCell>
                                                                            <TableCell className="py-2 text-right font-bold text-slate-900 dark:text-slate-100">GH₵ {variant.selling_price.toFixed(2)}</TableCell>
                                                                            <TableCell className="py-2 text-center font-mono">
                                                                                <span className={variant.stock_quantity <= variant.reorder_level ? "text-red-500 font-bold" : ""}>
                                                                                    {variant.stock_quantity}
                                                                                </span>
                                                                            </TableCell>
                                                                            <TableCell className="py-2 text-center">
                                                                                {getStockBadge(variant.stock_quantity, variant.reorder_level)}
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </Fragment>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-2">
                <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages || 1}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(Math.max(1, page - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                        disabled={page >= totalPages}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}
