import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Product } from '@/types/product';
import { StockMovementReason } from '@/types/stock';
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

const stockSchema = z.object({
    quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
    reason: z.enum(['RESTOCK', 'DAMAGE', 'LOSS', 'CORRECTION'] as const),
    notes: z.string().optional(),
});

type StockFormData = z.infer<typeof stockSchema>;

interface StockActionDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: { quantityChange: number; reason: StockMovementReason; notes?: string }) => void;
    product: Product | null;
}

export function StockActionDialog({ open, onClose, onSubmit, product }: StockActionDialogProps) {
    const {
        register,
        handleSubmit,
        setValue,
        reset,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<StockFormData>({
        resolver: zodResolver(stockSchema) as any,
        defaultValues: {
            quantity: 1,
            reason: 'RESTOCK',
            notes: '',
        },
    });

    const reason = watch('reason');

    const handleFormSubmit = (data: StockFormData) => {
        let quantityChange = data.quantity;
        // If reason is DAMAGE or LOSS, quantity change is negative
        if (data.reason === 'DAMAGE' || data.reason === 'LOSS') {
            quantityChange = -data.quantity;
        }
        // CORRECTION could be either, but let's assume UI handles absolute value here and we might need a "Sign" toggle or just infer.
        // For simplicity, let's treat CORRECTION as an arbitrary adjustment.
        // Actually, for CORRECTION, it's better to ask "New Stock Level" or just let them type signed int.
        // But to keep UI simple, let's say "Correction" means "Manual Adjustment" and maybe we just allow negative input?
        // Let's stick to RESTOCK (+), DAMAGE (-), LOSS (-).
        // For CORRECTION, let's assume it's an additive correction for now (e.g. found extra item).
        // Or we can add a toggle.

        // Refined Logic:
        // RESTOCK -> +
        // DAMAGE -> -
        // LOSS -> -
        // CORRECTION -> Allow user to specify sign? Or just default to +.
        // Let's make Correction enforce positive/negative in the input? No, standard input is absolute.
        // Let's force Correction to be + for "Found Item". If lost, use LOSS.

        onSubmit({
            quantityChange,
            reason: data.reason,
            notes: data.notes,
        });
        reset();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Update Stock: {product?.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Action Type</Label>
                        <Select
                            onValueChange={(val) => setValue('reason', val as 'RESTOCK' | 'DAMAGE' | 'LOSS' | 'CORRECTION')}
                            defaultValue="RESTOCK"
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select action" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="RESTOCK">Restock (Add)</SelectItem>
                                <SelectItem value="DAMAGE">Damage (Remove)</SelectItem>
                                <SelectItem value="LOSS">Loss/Theft (Remove)</SelectItem>
                                <SelectItem value="CORRECTION">Correction (Add)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                            id="quantity"
                            type="number"
                            {...register('quantity')}
                            className={reason === 'DAMAGE' || reason === 'LOSS' ? 'text-red-500' : 'text-green-500'}
                        />
                        {errors.quantity && <p className="text-sm text-red-500">{errors.quantity.message}</p>}
                        <p className="text-sm text-muted-foreground">
                            {reason === 'DAMAGE' || reason === 'LOSS' ? 'Will decrease stock.' : 'Will increase stock.'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" {...register('notes')} placeholder="Optional details..." />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            Confirm Update
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
