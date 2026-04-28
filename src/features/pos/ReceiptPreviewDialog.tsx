import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ReceiptPrint } from "./ReceiptPrint";
import { Printer, CheckCircle2 } from "lucide-react";

interface ReceiptPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  sale: any | null;
  isHistory?: boolean;
}

export function ReceiptPreviewDialog({
  open,
  onClose,
  sale,
  isHistory,
}: ReceiptPreviewDialogProps) {
  if (!sale) return null;

  // Map database fields to what ReceiptPrint expects if necessary
  const mappedSale = {
    ...sale,
    date: sale.timestamp || sale.date,
    totalAmount: sale.total_amount || sale.totalAmount,
    paymentMethod: sale.payment_method || sale.paymentMethod,
    discount_amount: sale.discount_amount || 0,
    items: (sale.items || []).map((item: any) => ({
      ...item,
      price: Number(item.price_at_sale ?? item.price ?? 0),
      name: item.product_name || item.name || `Item ${item.product_id}`,
    })),
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          {!isHistory && (
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-bold">Sale Completed Successfully</span>
            </div>
          )}
          <DialogTitle>
            {isHistory ? "Sale Details" : "Receipt Preview"}
          </DialogTitle>
          <DialogDescription>
            {isHistory
              ? `Detail view for transaction ${sale.id}`
              : "Review the transaction details before printing or closing."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 bg-zinc-100/50 rounded-lg overflow-y-auto max-h-[60vh] flex flex-col items-center">
          <div className="bg-white shadow-md">
            <ReceiptPrint sale={mappedSale} isInline={true} />
          </div>
        </div>

        {/* Dedicated print target so browser print mode doesn't capture the dialog chrome. */}
        <ReceiptPrint sale={mappedSale} />

        <DialogFooter className="flex sm:justify-between items-center gap-2">
          <p className="text-xs text-muted-foreground italic">
            The receipt is ready for printing.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
