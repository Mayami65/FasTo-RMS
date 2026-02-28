import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Key, CheckCircle2 } from 'lucide-react';

interface ActivationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onActivate: (key: string) => Promise<void>;
}

export default function ActivationModal({ isOpen, onClose, onActivate }: ActivationModalProps) {
    const [key, setKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleActivate = async () => {
        if (!key.trim()) return;
        setLoading(true);
        try {
            await onActivate(key);
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setKey('');
            }, 2000);
        } catch (error) {
            console.error('Activation failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md border-none shadow-2xl rounded-3xl overflow-hidden p-0 bg-white">
                <div className="bg-primary p-8 text-white flex flex-col items-center gap-4">
                    <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                        <ShieldCheck className="h-10 w-10 text-white" />
                    </div>
                    <div className="text-center">
                        <DialogTitle className="text-2xl font-black text-white">Activate Product</DialogTitle>
                        <DialogDescription className="text-white/80 font-medium mt-1">
                            Enter your license key to unlock enterprise features.
                        </DialogDescription>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    {success ? (
                        <div className="flex flex-col items-center gap-3 py-4 animate-in zoom-in duration-300">
                            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                            <p className="font-black text-emerald-600 text-lg">Activation Successful!</p>
                            <p className="text-sm text-slate-500 font-medium">Reloading license data...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    className="pl-12 h-14 bg-slate-50 border-slate-200 focus:bg-white text-lg font-mono tracking-widest uppercase"
                                    placeholder="XXXX-XXXX-XXXX-XXXX"
                                    value={key}
                                    onChange={(e) => setKey(e.target.value.toUpperCase())}
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
                                Keys are machine-bound to this workstation
                            </p>
                        </div>
                    )}
                </div>

                {!success && (
                    <DialogFooter className="p-8 pt-0 flex-col sm:flex-col gap-3">
                        <Button
                            className="w-full h-12 font-black text-lg shadow-lg shadow-primary/20"
                            onClick={handleActivate}
                            disabled={loading || !key.trim()}
                        >
                            {loading ? 'Validating...' : 'Activate Now'}
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full text-slate-400 font-bold"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
