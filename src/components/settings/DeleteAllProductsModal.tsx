import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';

interface DeleteAllProductsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

export default function DeleteAllProductsModal({ isOpen, onClose, onConfirm }: DeleteAllProductsModalProps) {
    const [confirmText, setConfirmText] = useState('');
    const [loading, setLoading] = useState(false);
    const REQUIRED_TEXT = "DELETE ALL";

    const handleConfirm = async () => {
        if (confirmText !== REQUIRED_TEXT) return;
        setLoading(true);
        try {
            await onConfirm();
            onClose();
            setConfirmText('');
        } catch (error) {
            console.error('Bulk deletion failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md border-none shadow-2xl rounded-3xl overflow-hidden p-0 bg-white">
                <div className="bg-red-600 p-8 text-white flex flex-col items-center gap-4">
                    <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                        <AlertTriangle className="h-10 w-10 text-white" />
                    </div>
                    <div className="text-center">
                        <DialogTitle className="text-2xl font-black text-white">Critical Action</DialogTitle>
                        <DialogDescription className="text-white/80 font-medium mt-1">
                            This will permanently delete all products, variants, and images.
                        </DialogDescription>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600 font-medium text-center">
                            To confirm, please type <span className="font-black text-red-600">"{REQUIRED_TEXT}"</span> in the box below:
                        </p>
                        <Input
                            className="h-14 bg-red-50 border-red-100 focus:bg-white text-lg font-black tracking-widest uppercase text-center text-red-600 placeholder:text-red-200"
                            placeholder="Type here..."
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                            disabled={loading}
                        />
                    </div>
                </div>

                <DialogFooter className="p-8 pt-0 flex-col sm:flex-col gap-3">
                    <Button
                        variant="destructive"
                        className="w-full h-12 font-black text-lg shadow-lg shadow-red-200"
                        onClick={handleConfirm}
                        disabled={loading || confirmText !== REQUIRED_TEXT}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="mr-2 h-5 w-5" />
                                Wipe All Data
                            </>
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full text-slate-400 font-bold"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
