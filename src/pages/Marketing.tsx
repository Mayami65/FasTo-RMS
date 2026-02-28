import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Calendar,
    Ticket,
    Percent,
    Banknote,
    BadgePercent,
    Trash2,
    Edit2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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
import { Label } from '@/components/ui/label';
import { Discount } from '@/types/sale';
import { format } from 'date-fns';

export default function Marketing() {
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [search, setSearch] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Form states
    const [formData, setFormData] = useState<Partial<Discount>>({
        name: '',
        type: 'PERCENTAGE',
        value: 0,
        min_purchase: 0,
        is_active: 1,
        start_date: null,
        end_date: null
    });

    useEffect(() => {
        loadDiscounts();
    }, []);

    const loadDiscounts = async () => {
        setIsLoading(true);
        try {
            const data = await window.api.getDiscounts();
            setDiscounts(data);
        } catch (error) {
            console.error('Failed to load discounts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingDiscount(null);
        setFormData({
            name: '',
            type: 'PERCENTAGE',
            value: 0,
            min_purchase: 0,
            is_active: 1,
            start_date: null,
            end_date: null
        });
        setIsDialogOpen(true);
    };

    const handleEdit = (discount: Discount) => {
        setEditingDiscount(discount);
        setFormData({ ...discount });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this discount?')) {
            try {
                await window.api.deleteDiscount(id);
                loadDiscounts();
            } catch (error) {
                console.error('Failed to delete discount:', error);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingDiscount?.id) {
                await window.api.updateDiscount({ ...formData, id: editingDiscount.id } as Discount);
            } else {
                await window.api.addDiscount(formData);
            }
            setIsDialogOpen(false);
            loadDiscounts();
        } catch (error) {
            console.error('Failed to save discount:', error);
        }
    };

    const filteredDiscounts = discounts.filter(d =>
        (d.name || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                        <BadgePercent className="h-8 w-8 text-primary" />
                        Marketing & Promotions
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage store-wide discounts and specialized coupon codes.</p>
                </div>
                <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Promotion
                </Button>
            </div>

            <Card className="border-none shadow-sm bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search promotions..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredDiscounts.map((discount) => (
                            <Card key={discount.id} className="group relative overflow-hidden border-gray-200 dark:border-zinc-800 hover:border-primary/50 transition-all duration-300 hover:shadow-md">
                                <CardHeader className="p-4 pb-2">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                {discount.type === 'PERCENTAGE' ? <Percent className="h-5 w-5" /> : <Banknote className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <CardTitle className="text-base font-bold truncate max-w-[150px]">{discount.name}</CardTitle>
                                                <CardDescription className="text-[10px] uppercase font-bold tracking-wider">
                                                    {discount.type === 'PERCENTAGE' ? 'Percentage Off' : 'Fixed Amount'}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Badge variant={discount.is_active ? "outline" : "secondary"} className={cn("text-[10px] h-5", discount.is_active && "border-green-500 text-green-600 bg-green-50/50")}>
                                            {discount.is_active ? 'Active' : 'Paused'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-2">
                                    <div className="mt-2 space-y-3">
                                        <div className="flex items-end gap-1">
                                            <span className="text-3xl font-black text-primary">
                                                {discount.type === 'PERCENTAGE' ? `${discount.value}%` : `GH₵ ${discount.value}`}
                                            </span>
                                            <span className="text-xs text-muted-foreground mb-1 font-medium">OFF</span>
                                        </div>

                                        <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-zinc-800">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                                <Ticket className="h-3 w-3" />
                                                <span>Min. Purchase: GH₵ {discount.min_purchase || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                                <Calendar className="h-3 w-3" />
                                                <span>{discount.start_date ? format(new Date(discount.start_date), 'MMM d, yyyy') : 'No start date'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(discount)} className="h-8 w-8 p-0">
                                            <Edit2 className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(discount.id!)} className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {filteredDiscounts.length === 0 && !isLoading && (
                            <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                                <Ticket className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p className="font-medium text-lg italic">No active promotions found.</p>
                                <Button variant="link" onClick={handleAdd} className="text-primary mt-2">Create your first discount</Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>{editingDiscount ? 'Edit Promotion' : 'New Promotion'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Promotion Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Easter Special Sale"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Discount Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(val: any) => setFormData({ ...formData, type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                                        <SelectItem value="FIXED">Fixed Amount (GH₵)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="value">Discount Value</Label>
                                <Input
                                    id="value"
                                    type="number"
                                    step="0.01"
                                    value={formData.value}
                                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="min_purchase">Minimum Purchase (GH₵)</Label>
                                <Input
                                    id="min_purchase"
                                    type="number"
                                    step="0.01"
                                    value={formData.min_purchase}
                                    onChange={(e) => setFormData({ ...formData, min_purchase: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="is_active">Status</Label>
                                <Select
                                    value={formData.is_active?.toString()}
                                    onValueChange={(val) => setFormData({ ...formData, is_active: Number(val) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Active</SelectItem>
                                        <SelectItem value="0">Paused</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2 text-muted-foreground/60 italic text-[11px]">
                                * Start/End dates coming in v2
                            </div>
                        </div>

                        <DialogFooter className="pt-6 border-t">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-primary hover:bg-primary/90 min-w-[100px]">Save Promotion</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
