import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product } from '@/types/product';
import { ProductList } from '@/features/inventory/ProductList';
import { ProductForm } from '@/features/inventory/ProductForm';
import { StockActionDialog } from '@/features/inventory/StockActionDialog';
import { Button } from '@/components/ui/button';
import { Plus, Tag, Upload, Loader2 } from 'lucide-react';
import { CategoryManager } from '@/features/inventory/CategoryManager';
import { InventorySummary } from '@/features/inventory/InventorySummary';
import { BulkImportDialog } from '@/features/inventory/BulkImportDialog';
import { cn } from '@/lib/utils';

export default function Inventory() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
    const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [selectedProductForStock, setSelectedProductForStock] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [summaryData, setSummaryData] = useState<any>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'none' | null>(null);
    const [stockStatus, setStockStatus] = useState<'all' | 'low_stock' | 'out_of_stock' | 'in_stock'>('all');
    const [tripName, setTripName] = useState<string>('all');
    const [searchParams] = useSearchParams();
    const querySearch = searchParams.get('search');

    // Pagination state
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
    });

    // Debounce search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 600); // Increased to 600ms for slower typists
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        loadProducts();
        loadSummary();
    }, [page, debouncedSearch, selectedCategoryId, stockStatus, tripName]);

    useEffect(() => {
        if (page !== 1) setPage(1);
    }, [debouncedSearch, selectedCategoryId, stockStatus, tripName]);

    useEffect(() => {
        if (querySearch) {
            setSearch(querySearch);
        }
    }, [querySearch]);

    const loadSummary = async () => {
        try {
            const data = await window.api.getInventorySummary();
            setSummaryData(data);
        } catch (error) {
            console.error("Failed to load inventory summary", error);
        }
    };

    const loadProducts = async () => {
        setLoading(true);
        try {
            const response = await window.api.getProducts({
                page,
                limit: 10,
                search: debouncedSearch,
                categoryId: selectedCategoryId,
                stockStatus,
                tripName
            });
            if (response && 'data' in response) {
                setProducts(response.data);
                setPagination(response.pagination);
            } else {
                // Fallback for non-paginated response
                setProducts((response as any) || []);
            }
        } catch (error) {
            console.error("Failed to load products", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddClick = () => {
        setEditingProduct(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (product: Product) => {
        setEditingProduct(product);
        setIsFormOpen(true);
    };

    const handleStockClick = (product: Product) => {
        setSelectedProductForStock(product);
        setIsStockDialogOpen(true);
    };

    const handleDeleteClick = async (id: number) => {
        if (confirm('Are you sure you want to delete this product?')) {
            const result = await window.api.deleteProduct(id);
            if (result.success) {
                loadProducts();
            } else {
                alert('Failed to delete: ' + result.error);
            }
        }
    };

    const handleFormSubmit = async (data: Product) => {
        let result;
        if (editingProduct?.id) {
            // Ensure ID is passed for updates
            result = await window.api.updateProduct({ ...data, id: editingProduct.id });
        } else {
            result = await window.api.addProduct(data);
        }

        if (result.success) {
            setIsFormOpen(false);
            loadProducts();
            loadSummary();
        } else {
            alert('Operation failed: ' + result.error);
        }
    };

    const handleStockSubmit = async (data: { quantityChange: number; reason: any; notes?: string }) => {
        if (!selectedProductForStock?.id) return;

        const result = await window.api.adjustStock({
            productId: selectedProductForStock.id,
            quantityChange: data.quantityChange,
            reason: data.reason,
            notes: data.notes
        });

        if (result.success) {
            setIsStockDialogOpen(false);
            loadProducts();
            loadSummary();
        } else {
            alert('Stock update failed: ' + result.error);
        }
    };

    const handleImportSuccess = () => {
        setIsImportDialogOpen(false);
        loadProducts();
        loadSummary();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">Inventory Management</h1>
                    <p className="text-slate-500 text-sm font-medium">Manage your products, categories, and stock levels</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" className="flex-1 md:flex-none border-slate-200 text-slate-600 hover:bg-slate-50 font-bold" onClick={() => setIsImportDialogOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" /> Import
                    </Button>
                    <Button variant="outline" className="flex-1 md:flex-none border-slate-200 text-slate-600 hover:bg-slate-50 font-bold" onClick={() => setIsCategoryManagerOpen(true)}>
                        <Tag className="mr-2 h-4 w-4" /> Categories
                    </Button>
                    <Button className="flex-1 md:flex-none bg-slate-900 hover:bg-slate-800 text-white font-black px-6" onClick={handleAddClick}>
                        <Plus className="mr-2 h-4 w-4" /> Add Product
                    </Button>
                </div>
            </div>

            <InventorySummary data={summaryData} />

            <div className="panel bg-white overflow-hidden min-h-[400px] relative">
                {loading && products.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-3 min-h-[400px]">
                        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Fetching Inventory...</p>
                    </div>
                ) : (
                    <div className={cn("transition-opacity duration-200", loading ? "opacity-50" : "opacity-100")}>
                        <ProductList
                            products={products}
                            search={search}
                            onSearchChange={setSearch}
                            categoryId={selectedCategoryId}
                            onCategoryChange={setSelectedCategoryId}
                            stockStatus={stockStatus}
                            onStockStatusChange={setStockStatus}
                            tripName={tripName}
                            onTripNameChange={setTripName}
                            pagination={pagination}
                            onPageChange={setPage}
                            onEdit={handleEditClick}
                            onDelete={handleDeleteClick}
                            onStockAction={handleStockClick}
                        />
                        {loading && products.length > 0 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-[1px] z-10">
                                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ProductForm
                open={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={editingProduct}
            />

            <StockActionDialog
                open={isStockDialogOpen}
                onClose={() => setIsStockDialogOpen(false)}
                onSubmit={handleStockSubmit}
                product={selectedProductForStock}
            />

            <CategoryManager
                open={isCategoryManagerOpen}
                onClose={() => setIsCategoryManagerOpen(false)}
            />

            <BulkImportDialog
                open={isImportDialogOpen}
                onClose={() => setIsImportDialogOpen(false)}
                onSuccess={handleImportSuccess}
            />
        </div>
    );
}
