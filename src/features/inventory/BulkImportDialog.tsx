import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Upload, Download, FileSpreadsheet, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface BulkImportDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function BulkImportDialog({ open, onClose, onSuccess }: BulkImportDialogProps) {
    const [isImporting, setIsImporting] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);


    const handleDownloadTemplate = async () => {
        try {
            const result = await window.api.downloadTemplate();
            if (result.success) {
                // Optional: Show toast
            } else if (result.error !== 'Cancelled') {
                setError(result.error || 'Unknown error');
            }
        } catch (err: any) {
            setError(err.message);
        }
    };


    const handleImportClick = async () => {
        setError(null);
        setResult(null);

        try {
            const filePath = await window.api.selectExcelFile();

            if (!filePath) return;

            setIsImporting(true);
            const res = await window.api.importProducts(filePath);
            setIsImporting(false);

            if (res.success) {
                setResult(res.summary);
                if (res.summary.imported > 0) {
                    onSuccess();
                }
            } else {
                setError(res.error || 'Unknown error');
            }
        } catch (err: any) {
            setIsImporting(false);
            setError(err.message);
        }
    };

    const handleClose = () => {
        setResult(null);
        setError(null);
        setIsImporting(false);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Bulk Import Products</DialogTitle>
                    <DialogDescription>
                        Import products from an Excel file. Download the template to see the required format.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <FileSpreadsheet className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="font-medium">Step 1: Get Template</p>
                                <p className="text-xs text-muted-foreground">Download the Excel template file</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                        </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="font-medium">Step 2: Upload Data</p>
                                <p className="text-xs text-muted-foreground">Select your filled Excel file</p>
                            </div>
                        </div>
                        <Button onClick={handleImportClick} disabled={isImporting}>
                            {isImporting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                'Select File'
                            )}
                        </Button>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {result && (
                        <div className="space-y-3">
                            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-900">
                                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <AlertTitle className="text-green-800 dark:text-green-300">Import Complete</AlertTitle>
                                <AlertDescription className="text-green-700 dark:text-green-400">
                                    Processed {result.total} rows.
                                </AlertDescription>
                            </Alert>

                            <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">
                                    <span className="block font-bold text-green-600">{result.imported}</span>
                                    <span className="text-muted-foreground text-xs">Imported</span>
                                </div>
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">
                                    <span className="block font-bold text-yellow-600">{result.skipped}</span>
                                    <span className="text-muted-foreground text-xs">Skipped</span>
                                </div>
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">
                                    <span className="block font-bold text-red-600">{result.failed}</span>
                                    <span className="text-muted-foreground text-xs">Failed</span>
                                </div>
                            </div>

                            {result.errors.length > 0 && (
                                <div className="max-h-[100px] overflow-y-auto text-xs text-red-600 bg-red-50 dark:bg-red-900/10 p-2 rounded border border-red-100 dark:border-red-900">
                                    <p className="font-bold mb-1">Errors:</p>
                                    <ul className="list-disc pl-4 space-y-0.5">
                                        {result.errors.map((e: string, i: number) => (
                                            <li key={i}>{e}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
