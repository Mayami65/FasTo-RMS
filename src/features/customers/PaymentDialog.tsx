import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

interface PaymentDialogProps {
    open: boolean;
    onClose: () => void;
    agreement: any;
    onConfirm: (amount: number, notes: string) => Promise<void>;
    onDateChange?: (date: string) => void;
}

export function PaymentDialog({ open, onClose, agreement, onConfirm, onDateChange }: PaymentDialogProps) {
    const [amount, setAmount] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleConfirm = async () => {
        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        if (numAmount > agreement.balance_due) {
            alert('Amount exceeds balance due');
            return;
        }

        setIsProcessing(true);
        await onConfirm(numAmount, notes);
        setIsProcessing(false);
        setAmount('');
        setNotes('');
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Balance Due:</span>
                        <span className="text-xl font-bold">GH₵ {agreement?.balance_due.toFixed(2)}</span>
                    </div>

                    <div className="space-y-2">
                        <Label>Payment Amount</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Notes (Optional)</Label>
                        <Input
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g., Weekly payment"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Next Payment Due (Optional)</Label>
                        <Input
                            type="date"
                            onChange={(e) => onDateChange && onDateChange(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
                    <Button onClick={handleConfirm} disabled={isProcessing}>
                        {isProcessing ? 'Processing...' : 'Confirm Payment'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
