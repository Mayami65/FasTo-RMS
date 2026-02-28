import { useState, useEffect } from 'react';
import { Category } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Edit2, Check, X, Tag } from 'lucide-react';
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
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Archive, ArchiveRestore, ChevronRight } from 'lucide-react';

interface CategoryManagerProps {
    open: boolean;
    onClose: () => void;
}

export function CategoryManager({ open, onClose }: CategoryManagerProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [newCategory, setNewCategory] = useState({ name: '', color: '#3b82f6', parent_id: null as number | null });
    const [editForm, setEditForm] = useState({ name: '', color: '', parent_id: null as number | null, is_archived: 0 });

    useEffect(() => {
        if (open) {
            loadCategories();
        }
    }, [open]);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const data = await window.api.getCategories();
            setCategories(data);
        } catch (error) {
            console.error('Failed to load categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newCategory.name.trim()) return;
        try {
            const result = await window.api.addCategory(newCategory);
            if (result.success) {
                setNewCategory({ name: '', color: '#3b82f6', parent_id: null });
                loadCategories();
            }
        } catch (error) {
            console.error('Failed to add category:', error);
        }
    };

    const handleStartEdit = (cat: Category) => {
        setEditingId(cat.id);
        setEditForm({
            name: cat.name,
            color: cat.color || '#3b82f6',
            parent_id: cat.parent_id || null,
            is_archived: cat.is_archived || 0
        });
    };

    const handleSaveEdit = async () => {
        if (!editingId || !editForm.name.trim()) return;
        try {
            const result = await window.api.updateCategory({ id: editingId, ...editForm });
            if (result.success) {
                setEditingId(null);
                loadCategories();
            }
        } catch (error) {
            console.error('Failed to save category:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure? Products in this category will be marked as uncategorized.')) {
            try {
                const result = await window.api.deleteCategory(id);
                if (result.success) {
                    loadCategories();
                }
            } catch (error) {
                console.error('Failed to delete category:', error);
            }
        }
    };

    const handleToggleArchive = async (cat: Category) => {
        try {
            const newStatus = cat.is_archived ? 0 : 1;
            const result = await window.api.updateCategory({
                ...cat,
                is_archived: newStatus
            });
            if (result.success) {
                loadCategories();
            }
        } catch (error) {
            console.error('Failed to toggle archive status:', error);
        }
    };

    const getParentName = (parentId: number | null) => {
        if (!parentId) return null;
        return categories.find(c => c.id === parentId)?.name;
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-primary" />
                        Manage Categories
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Add New Category */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border space-y-4">
                        <div className="flex items-end gap-3">
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="new-cat-name" className="text-xs uppercase font-bold text-muted-foreground tracking-wider">New Category Name</Label>
                                <Input
                                    id="new-cat-name"
                                    placeholder="e.g. Summer Collection"
                                    value={newCategory.name}
                                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Color</Label>
                                <div className="flex gap-1">
                                    <input
                                        type="color"
                                        value={newCategory.color}
                                        onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                                        className="h-9 w-9 p-1 rounded border bg-background cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-end gap-3">
                            <div className="flex-1 space-y-2">
                                <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Parent Category (Optional)</Label>
                                <Select
                                    value={newCategory.parent_id?.toString() || "none"}
                                    onValueChange={(v) => setNewCategory({ ...newCategory, parent_id: v === "none" ? null : parseInt(v) })}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="None (Top Level)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None (Top Level)</SelectItem>
                                        {categories.filter(c => !c.parent_id).map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button size="sm" onClick={handleAdd} disabled={!newCategory.name.trim()} className="h-9 px-3">
                                <Plus className="h-4 w-4 mr-1" /> Add Category
                            </Button>
                        </div>
                    </div>

                    {/* Categories List */}
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {loading ? (
                            <div className="text-center py-4 text-muted-foreground">Loading...</div>
                        ) : categories.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground italic border-2 border-dashed rounded-lg">
                                No categories yet. Create your first one above.
                            </div>
                        ) : (
                            categories.map((cat) => (
                                <div
                                    key={cat.id}
                                    className="flex items-center justify-between p-3 rounded-md border bg-card hover:shadow-sm transition-shadow"
                                >
                                    {editingId === cat.id ? (
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    className="h-8 flex-1"
                                                    value={editForm.name}
                                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                    autoFocus
                                                />
                                                <input
                                                    type="color"
                                                    value={editForm.color}
                                                    onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                                                    className="h-8 w-8 p-1 rounded border cursor-pointer"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Select
                                                    value={editForm.parent_id?.toString() || "none"}
                                                    onValueChange={(v) => setEditForm({ ...editForm, parent_id: v === "none" ? null : parseInt(v) })}
                                                >
                                                    <SelectTrigger className="h-8 flex-1">
                                                        <SelectValue placeholder="No Parent" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">No Parent</SelectItem>
                                                        {categories.filter(c => c.id !== cat.id && !c.parent_id).map(c => (
                                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <div className="flex gap-1">
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleSaveEdit}>
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setEditingId(null)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-3 h-3 rounded-full shrink-0"
                                                    style={{ backgroundColor: cat.color || '#3b82f6' }}
                                                />
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-medium text-sm ${cat.is_archived ? 'text-muted-foreground line-through' : ''}`}>
                                                            {cat.name}
                                                        </span>
                                                        {cat.is_archived === 1 && (
                                                            <Badge variant="secondary" className="text-[10px] h-4 px-1">Archived</Badge>
                                                        )}
                                                    </div>
                                                    {cat.parent_id && (
                                                        <div className="flex items-center text-[11px] text-muted-foreground">
                                                            <span>{getParentName(cat.parent_id)}</span>
                                                            <ChevronRight className="h-3 w-3 mx-0.5" />
                                                            <span>{cat.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                                                    title={cat.is_archived ? "Restore from Archive" : "Move to Archive"}
                                                    onClick={() => handleToggleArchive(cat)}
                                                >
                                                    {cat.is_archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 opacity-50 hover:opacity-100" onClick={() => handleStartEdit(cat)}>
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 opacity-50 hover:opacity-100 hover:bg-red-50" onClick={() => handleDelete(cat.id)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
