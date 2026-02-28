import { forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { SaleItem } from '@/types/sale';
import { useSettings } from '@/context/SettingsContext';

interface ReceiptPrintProps {
    sale: {
        id: number;
        items: SaleItem[];
        totalAmount: number;
        subtotal?: number;
        discount_amount?: number;
        paymentMethod: string;
        date: string;
        amountTendered?: number;
        change?: number;
        customerId?: number;
        customerName?: string;
    } | null;
    isInline?: boolean;
}

export const ReceiptPrint = forwardRef<HTMLDivElement, ReceiptPrintProps>(({ sale, isInline }, ref) => {
    const { settings } = useSettings();
    if (!sale) return null;

    const receiptWidth = "w-[80mm]"; // Standard thermal width
    const line = "--------------------------------"; // Traditional divider

    const content = (
        <div ref={ref} className={`p-2 font-mono ${receiptWidth} mx-auto text-[12px] leading-tight text-black bg-white ${isInline ? 'border shadow-sm' : 'print-only no-print-screen'}`}>
            <style dangerouslySetInnerHTML={{
                __html: `
                @media screen {
                    .no-print-screen { position: absolute !important; left: -9999px !important; pointer-events: none !important; opacity: 0 !important; }
                }
                @media print {
                    body > *:not(.print-only) { display: none !important; }
                    .print-only { display: block !important; position: static !important; width: 80mm !important; }
                }
            `}} />
            {/* Header */}
            <div className="text-center mb-2">
                <h1 className="text-lg font-bold uppercase">{settings.storeName}</h1>
                {settings.receiptHeader && <p className="text-[10px] italic">{settings.receiptHeader}</p>}
                <p className="text-[10px]">{settings.storeAddress}</p>
                <p className="text-[10px]">Tel: {settings.storePhone}</p>
                {settings.showStoreEmail === 'true' && settings.storeEmail && <p className="text-[10px]">{settings.storeEmail}</p>}
                {settings.taxId && <p className="text-[10px]">TIN: {settings.taxId}</p>}
            </div>

            <div className="text-[10px] mb-2">
                <div className="flex justify-between">
                    <span>Date: {new Date(sale.date).toLocaleDateString()}</span>
                    <span>Time: {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p>Receipt: #{sale.id.toString().padStart(6, '0')}</p>
                {sale.customerName && sale.customerName !== 'Walk-in Customer' && <p>Customer: {sale.customerName}</p>}
                {settings.showCashierName === 'true' && <p>Cashier: Admin</p>}
            </div>

            <div className="mb-1">{line}</div>

            {/* Items Table - Manual layout for better thermal alignment */}
            <div className="space-y-1 mb-2">
                <div className="flex justify-between font-bold text-[10px]">
                    <span className="w-1/2">ITEM</span>
                    <span className="w-1/6 text-right">QTY</span>
                    <span className="w-1/3 text-right">TOTAL</span>
                </div>
                <div className="border-b border-black border-dashed mb-1" />

                {sale.items.map((item, index) => (
                    <div key={index} className="text-[10px] py-0.5">
                        <div className="flex justify-between">
                            <span className="font-bold truncate pr-2 uppercase italic">{item.name || `Item ${item.productId}`}</span>
                        </div>
                        {item.variationName && (
                            <div className="text-[9px] text-zinc-600 pl-2">
                                Variation: {item.variationName}
                            </div>
                        )}
                        <div className="flex justify-between pl-2 italic">
                            <span>{item.quantity} x {(Number(item.price) || 0).toFixed(2)}</span>
                            <span className="font-bold">{(item.quantity * (Number(item.price) || 0)).toFixed(2)}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mb-1">{line}</div>

            {/* Totals */}
            <div className="space-y-1 text-[11px]">
                <div className="flex justify-between font-bold">
                    <span>SUBTOTAL</span>
                    <span>GH₵ {(Number(sale.subtotal || sale.totalAmount) || 0).toFixed(2)}</span>
                </div>

                {sale.discount_amount !== undefined && sale.discount_amount > 0 && (
                    <div className="flex justify-between italic text-[10px]">
                        <span>DISCOUNT</span>
                        <span>-GH₵ {(Number(sale.discount_amount) || 0).toFixed(2)}</span>
                    </div>
                )}

                {sale.paymentMethod === 'MOBILE_MONEY' && (
                    <div className="flex justify-between italic text-[10px]">
                        <span>Momo Fee (0%)</span>
                        <span>0.00</span>
                    </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-black pt-1 mt-1">
                    <span>TOTAL</span>
                    <span>GH₵ {(Number(sale.totalAmount) || 0).toFixed(2)}</span>
                </div>

                <div className="pt-1">
                    <div className="flex justify-between">
                        <span>Payment:</span>
                        <span className="font-bold">{sale.paymentMethod.replace('_', ' ')}</span>
                    </div>
                    {sale.amountTendered !== undefined && (
                        <div className="flex justify-between">
                            <span>Paid:</span>
                            <span>GH₵ {(Number(sale.amountTendered) || 0).toFixed(2)}</span>
                        </div>
                    )}
                    {sale.change !== undefined && sale.paymentMethod === 'CASH' && (
                        <div className="flex justify-between">
                            <span>Change:</span>
                            <span>GH₵ {(Number(sale.change) || 0).toFixed(2)}</span>
                        </div>
                    )}
                </div>

                {sale.paymentMethod === 'HIRE_PURCHASE' && (
                    <div className="mt-2 p-1 border border-black border-dashed rounded text-[9px]">
                        <p className="font-bold text-center uppercase mb-1">HP Agreement</p>
                        <div className="flex justify-between">
                            <span>Total Due:</span>
                            <span>GH₵ {(Number(sale.totalAmount) || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Initial:</span>
                            <span>GH₵ {(Number(sale.amountTendered) || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                            <span>Balance:</span>
                            <span>GH₵ {(Number(sale.totalAmount) - (Number(sale.amountTendered) || 0)).toFixed(2)}</span>
                        </div>
                        <p className="text-[8px] mt-1 italic">Title remains with FasTo until full payment.</p>
                    </div>
                )}
            </div>

            <div className="mt-4 text-center text-[10px]">
                <div className="mb-2 italic">{line}</div>
                {settings.receiptFooter && <p className="font-bold">{settings.receiptFooter}</p>}
                <p>Items can be exchanged within 7 days.</p>
                <p>Please keep this receipt for returns.</p>
                <div className="mt-2 text-[8px]">
                    Software by Antigravity v1.0
                </div>
            </div>
        </div>
    );

    if (isInline) return content;

    return createPortal(
        content,
        document.body
    );
});

ReceiptPrint.displayName = 'ReceiptPrint';
