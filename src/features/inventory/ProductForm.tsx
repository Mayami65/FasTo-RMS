import { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Layers, Wand2, Image as ImageIcon, X } from 'lucide-react';
import { Product, Category } from '@/types/product';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const variantSchema = z.object({
    id: z.number().optional(),
    variation_name: z.string().min(1, 'Variation name is required'),
    sku: z.string().min(1, 'SKU is required'),
    cost_price: z.coerce.number().min(0),
    selling_price: z.coerce.number().min(0),
    stock_quantity: z.coerce.number().int().min(0),
    reorder_level: z.coerce.number().int().min(0),
});

const productSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    sku: z.string().min(1, 'SKU is required'),
    category_id: z.coerce.number().nullable().optional(),
    cost_price: z.coerce.number().min(0).optional(),
    selling_price: z.coerce.number().min(0).optional(),
    stock_quantity: z.coerce.number().int().min(0).optional(),
    reorder_level: z.coerce.number().int().min(0).optional(),
    description: z.string().optional(),
    image_path: z.string().nullable().optional(),
    has_variations: z.boolean().default(false),
    variants: z.array(variantSchema).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: Product) => void;
    initialData?: Product | null;
}

export function ProductForm({ open, onClose, onSubmit, initialData }: ProductFormProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        control,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema) as any,
        defaultValues: {
            name: '',
            sku: '',
            category_id: null,
            cost_price: 0,
            selling_price: 0,
            stock_quantity: 0,
            reorder_level: 5,
            description: '',
            has_variations: false,
            variants: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'variants',
    });

    const hasVariations = watch('has_variations');
    const watchedVariants = watch('variants');

    // Automatic synchronization of stock and prices from variations
    useEffect(() => {
        if (hasVariations && watchedVariants && watchedVariants.length > 0) {
            const totalStock = watchedVariants.reduce((sum, v: any) => sum + (Number(v.stock_quantity) || 0), 0);
            const prices = watchedVariants.map((v: any) => Number(v.selling_price) || 0);
            const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
            const costs = watchedVariants.map((v: any) => Number(v.cost_price) || 0);
            const avgCost = costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0;

            setValue('stock_quantity', totalStock, { shouldValidate: true });
            setValue('selling_price', minPrice, { shouldValidate: true });
            setValue('cost_price', avgCost, { shouldValidate: true });
        }
    }, [watchedVariants, hasVariations, setValue]);

    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name || '',
                sku: initialData.sku || '',
                category_id: initialData.category_id || null,
                cost_price: initialData.cost_price || 0,
                selling_price: initialData.selling_price || 0,
                stock_quantity: initialData.stock_quantity || 0,
                reorder_level: initialData.reorder_level || 5,
                description: initialData.description || '',
                image_path: initialData.image_path || null,
                has_variations: initialData.variants && initialData.variants.length > 0,
                variants: initialData.variants || [],
            } as any);

            if (initialData.image_path) {
                window.api.getProductImagePath(initialData.image_path).then(path => {
                    if (path) {
                        const normalizedPath = path.replace(/\\/g, '/');
                        setImagePreview(`media:///${normalizedPath}`);
                    }
                });
            } else {
                setImagePreview(null);
            }
        } else {
            reset({
                name: '',
                sku: '',
                category_id: null,
                cost_price: 0,
                selling_price: 0,
                stock_quantity: 0,
                reorder_level: 5,
                description: '',
                image_path: null,
                has_variations: false,
                variants: [],
            } as any);
            setImagePreview(null);
        }
    }, [open, initialData, reset]);

    useEffect(() => {
        if (open) {
            loadCategories();
        }
    }, [open]);

    const loadCategories = async () => {
        try {
            const data = await window.api.getCategories();
            setCategories(data);
        } catch (err) {
            console.error('Failed to load categories:', err);
        }
    };

    const generateProductSKU = () => {
        const name = watch('name');
        if (!name) return;

        const words = name.split(' ').filter(w => w.length > 0);
        let prefix = '';
        if (words.length >= 2) {
            prefix = (words[0].substring(0, 3) + words[1].substring(0, 3)).toUpperCase();
        } else {
            prefix = words[0].substring(0, 5).toUpperCase();
        }

        const random = Math.random().toString(36).substring(2, 5).toUpperCase();
        const generatedSKU = `${prefix}-${random}`;
        setValue('sku', generatedSKU, { shouldValidate: true });
    };

    const updateVariationSKU = (index: number, varName: string) => {
        const baseSku = watch('sku');
        if (!baseSku || !varName) return;

        const cleanVarName = varName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 5);
        setValue(`variants.${index}.sku` as any, `${baseSku}-${cleanVarName}`, { shouldValidate: true });
    };

    const handleImageSelect = async () => {
        const fileName = await window.api.selectProductImage();
        if (fileName) {
            setValue('image_path', fileName, { shouldValidate: true });
            const fullPath = await window.api.getProductImagePath(fileName);
            if (fullPath) {
                const normalizedPath = fullPath.replace(/\\/g, '/');
                setImagePreview(`media:///${normalizedPath}`);
            }
        }
    };

    const removeImage = () => {
        setValue('image_path', null, { shouldValidate: true });
        setImagePreview(null);
    };

    const handleFormSubmit = (data: any) => {
        onSubmit({ ...data, id: initialData?.id });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)}>
                    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Product Name</Label>
                                    <Input id="name" {...register('name')} />
                                    {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sku">SKU / Barcode</Label>
                                    <div className="flex gap-2">
                                        <Input id="sku" {...register('sku')} className="flex-1" />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={generateProductSKU}
                                            title="Generate SKU"
                                            className="h-9 w-9 shrink-0"
                                        >
                                            <Wand2 className="h-4 w-4 text-primary" />
                                        </Button>
                                    </div>
                                    {errors.sku && <p className="text-sm text-red-500">{errors.sku.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Product Image</Label>
                                <div
                                    onClick={handleImageSelect}
                                    className={cn(
                                        "relative h-32 w-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-slate-50 dark:bg-slate-900",
                                        imagePreview ? "border-solid border-slate-200 dark:border-slate-800" : "border-slate-300 dark:border-slate-700 hover:border-primary/50"
                                    )}
                                >
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeImage();
                                                }}
                                                className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground group">
                                            <ImageIcon className="h-8 w-8 transition-transform group-hover:scale-110" />
                                            <span className="text-xs font-medium">Click to upload</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category_id">Category</Label>
                                <Controller
                                    name="category_id"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            onValueChange={(val) => field.onChange(val === 'none' ? null : Number(val))}
                                            value={field.value?.toString() || 'none'}
                                        >
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Uncategorized</SelectItem>
                                                {categories
                                                    .filter(cat => cat.is_archived !== 1)
                                                    .map((cat: Category) => {
                                                        const parent = categories.find(c => c.id === cat.parent_id);
                                                        return (
                                                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                                                {parent ? `${parent.name} > ${cat.name}` : cat.name}
                                                            </SelectItem>
                                                        );
                                                    })
                                                }
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reorder_level">Low Stock Alert Limit</Label>
                                <Input
                                    id="reorder_level"
                                    type="number"
                                    {...register('reorder_level')}
                                    min="0"
                                    className="text-right"
                                />
                                {errors.reorder_level && (
                                    <p className="text-sm text-red-500">{errors.reorder_level.message}</p>
                                )}
                                <p className="text-xs text-muted-foreground">Alert me when stock falls below this number.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                            <div className="space-y-2">
                                <Label htmlFor="cost_price">Cost Price</Label>
                                <Input id="cost_price" type="number" step="0.01" {...register('cost_price')} readOnly={hasVariations} className={cn(hasVariations && "bg-muted cursor-not-allowed")} />
                                {errors.cost_price && <p className="text-sm text-red-500">{errors.cost_price.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="selling_price">Selling Price {hasVariations && <span className="text-[10px] text-primary">(Min)</span>}</Label>
                                <Input id="selling_price" type="number" step="0.01" {...register('selling_price')} readOnly={hasVariations} className={cn(hasVariations && "bg-muted cursor-not-allowed")} />
                                {errors.selling_price && (
                                    <p className="text-sm text-red-500">{errors.selling_price.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stock_quantity">Total Stock</Label>
                                <Input id="stock_quantity" type="number" {...register('stock_quantity')} readOnly={hasVariations} className={cn(hasVariations && "bg-muted cursor-not-allowed")} />
                                {errors.stock_quantity && (
                                    <p className="text-sm text-red-500">{errors.stock_quantity.message}</p>
                                )}
                                {hasVariations && <p className="text-[9px] text-primary font-medium">Calculated from variations</p>}
                            </div>
                        </div>

                        {hasVariations && (
                            <div className="grid grid-cols-3 gap-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Stock</p>
                                    <p className="text-lg font-bold">{watch('stock_quantity')}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Starting Price</p>
                                    <p className="text-lg font-bold text-primary">GH₵ {Number(watch('selling_price')).toFixed(2)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Avg Cost</p>
                                    <p className="text-lg font-bold text-muted-foreground">GH₵ {Number(watch('cost_price')).toFixed(2)}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center space-x-2 py-2">
                            <input
                                type="checkbox"
                                id="has_variations"
                                {...register('has_variations')}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="has_variations" className="cursor-pointer font-bold flex items-center gap-2">
                                <Layers className="h-4 w-4 text-primary" />
                                This product has multiple variations (Size, Color, etc.)
                            </Label>
                        </div>

                        {hasVariations && (
                            <div className="space-y-4 border rounded-lg p-4 bg-slate-50 dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-700">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-sm">Variations</h3>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => append({ variation_name: '', sku: `${watch('sku') || ''}-`, cost_price: watch('cost_price') || 0, selling_price: watch('selling_price') || 0, stock_quantity: 0, reorder_level: 5 })}
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Add Variation
                                    </Button>
                                </div>

                                {fields.length === 0 && (
                                    <div className="text-center py-6 text-muted-foreground text-sm italic">
                                        No variations added yet. Click "Add Variation" to start.
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="p-3 bg-white dark:bg-slate-800 rounded-md shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <Input
                                                        placeholder="Variation (e.g. Size: M, Color: Red)"
                                                        {...register(`variants.${index}.variation_name`)}
                                                        onChange={(e) => {
                                                            register(`variants.${index}.variation_name`).onChange(e);
                                                            updateVariationSKU(index, e.target.value);
                                                        }}
                                                        className="h-8 text-sm font-medium"
                                                    />
                                                </div>
                                                <div className="w-32">
                                                    <Input
                                                        placeholder="SKU"
                                                        {...register(`variants.${index}.sku`)}
                                                        className="h-8 text-sm font-mono"
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => remove(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Cost</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        {...register(`variants.${index}.cost_price`)}
                                                        className="h-7 text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Price</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        {...register(`variants.${index}.selling_price`)}
                                                        className="h-7 text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Stock</Label>
                                                    <Input
                                                        type="number"
                                                        {...register(`variants.${index}.stock_quantity`)}
                                                        className="h-7 text-xs"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 pb-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" {...register('description')} />
                        </div>
                    </div>

                    <DialogFooter className="pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {initialData ? 'Update Product' : 'Save Product'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
