import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CartProvider, useCart } from "@/context/CartContext";
import { POSProductGrid } from "@/features/pos/POSProductGrid";
import { CartPanel } from "@/features/pos/CartPanel";
import { CheckoutDialog } from "@/features/pos/CheckoutDialog";
import { Product, Category } from "@/types/product";
import { ReceiptPrint } from "@/features/pos/ReceiptPrint";
import { RefundDialog } from "@/features/pos/RefundDialog";
import { ReceiptPreviewDialog } from "@/features/pos/ReceiptPreviewDialog";
import { HeldSalesDialog } from "@/features/pos/HeldSalesDialog";
import { useAuth } from "@/context/AuthContext";
import { useFeatures } from "@/hooks/useFeatures";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

function POSContent() {
  const { addToCart, cart, totalAmount, clearCart, loadCart } = useCart();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const editSale = (location.state as any)?.editSale;
  const { hasRefunds } = useFeatures();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [isReceiptPreviewOpen, setIsReceiptPreviewOpen] = useState(false);
  const [isHeldSalesOpen, setIsHeldSalesOpen] = useState(false);
  const [heldSalesCount, setHeldSalesCount] = useState(0);
  const [lastSale, setLastSale] = useState<any>(null); // Store last sale for printing

  useEffect(() => {
    loadProducts();
    loadCategories();
    updateHeldSalesCount();
  }, []);

  useEffect(() => {
    if (!editSale?.items?.length) return;

    const mappedItems = editSale.items.map((item: any) => ({
      id: item.product_id,
      name: item.product_name || item.name || `Item ${item.product_id}`,
      selling_price: Number(item.price_at_sale || item.price || 0),
      quantity: Number(item.quantity || 0),
      variantId: item.variant_id,
      variationName: item.variation_name,
    }));

    loadCart(mappedItems as any);
    setIsReceiptPreviewOpen(false);
    setIsCheckoutOpen(true);
  }, [editSale, loadCart]);

  const updateHeldSalesCount = async () => {
    try {
      const data = await window.api.getHeldSales();
      setHeldSalesCount(data.length);
    } catch (error) {
      console.error("Failed to update held sales count", error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await window.api.getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await window.api.getProducts({ limit: 10000 });
      if (response && "data" in response) {
        setProducts(response.data);
      } else {
        setProducts(Array.isArray(response) ? response : []);
      }
    } catch (error) {
      console.error("Failed to load products", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = () => {
    setIsCheckoutOpen(true);
  };

  const handleHoldSale = async () => {
    if (cart.length === 0) return;

    try {
      const result = await window.api.holdSale({
        userId: user?.id,
        items: cart,
        totalAmount: totalAmount,
        notes: "", // Could add a prompt for notes if needed
      });

      if (result.success) {
        clearCart();
        updateHeldSalesCount();
      } else {
        alert("Failed to hold sale: " + result.error);
      }
    } catch (error) {
      console.error("Hold sale error", error);
    }
  };

  const handleResumeSale = async (heldSale: any) => {
    if (cart.length > 0) {
      if (
        !confirm(
          "Your current cart is not empty. Resuming will overwrite it. Continue?",
        )
      ) {
        return;
      }
    }

    const items = heldSale.items.map((item: any) => ({
      id: item.product_id,
      variantId: item.variant_id,
      variationName: item.variation_name,
      selling_price: item.price_at_hold,
      quantity: item.quantity,
      name: item.product_name,
    }));

    loadCart(items);

    // Delete the held sale after resumption
    await window.api.deleteHeldSale(heldSale.id);
    updateHeldSalesCount();
    setIsHeldSalesOpen(false);
  };

  const handleConfirmSale = async (paymentData: {
    paymentMethod: string;
    amountTendered: number;
    customerId?: number;
    customerName?: string;
    hpDuration?: string;
    momoTransactionId?: string;
    momoProvider?: string;
    discount_amount?: number;
    coupon_id?: number;
  }) => {
    // Prepare sale data
    const currentCart = [...cart]; // Snapshot cart
    const saleData = {
      items: currentCart.map((item) => ({
        productId: item.id,
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.selling_price,
      })),
      paymentMethod: paymentData.paymentMethod,
      totalAmount: totalAmount - (paymentData.discount_amount || 0), // Use final total
      userId: user?.id || 1,
      customerId: paymentData.customerId,
      depositAmount:
        paymentData.paymentMethod === "HIRE_PURCHASE"
          ? paymentData.amountTendered
          : undefined,
      hpDuration: paymentData.hpDuration,
      momoTransactionId: paymentData.momoTransactionId,
      momoProvider: paymentData.momoProvider,
      discount_amount: paymentData.discount_amount,
      coupon_id: paymentData.coupon_id,
    };

    const result = editSale
      ? await window.api.updateSale({
          saleId: editSale.id,
          ...saleData,
        })
      : await window.api.processSale(saleData);

    if (result.success) {
      // Prepare receipt data
      const receiptData = {
        id: result.saleId,
        items: currentCart.map((item) => ({
          ...item,
          productId: item.id!,
          variantId: item.variantId,
          variationName: item.variationName,
          price: item.selling_price,
        })),
        totalAmount: totalAmount - (paymentData.discount_amount || 0),
        subtotal: totalAmount,
        discount_amount: paymentData.discount_amount,
        paymentMethod: paymentData.paymentMethod,
        amountTendered: paymentData.amountTendered,
        change:
          paymentData.amountTendered -
          (totalAmount - (paymentData.discount_amount || 0)),
        date: new Date().toISOString(),
        customerId: paymentData.customerId,
        customerName: paymentData.customerName,
      };

      setLastSale(receiptData);
      setIsReceiptPreviewOpen(true);
      clearCart();
      setIsCheckoutOpen(false);
      loadProducts(); // Refresh stock
    } else {
      throw new Error(result.error);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-110px)] gap-4 no-print -m-1">
      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left: Product Selection (70%) */}
        <div className="flex-[0.7] flex flex-col min-w-0">
          {loading ? (
            <div className="flex-1 flex items-center justify-center bg-white rounded-xl border border-slate-200">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 font-medium">Loading catalog...</p>
              </div>
            </div>
          ) : (
            <POSProductGrid
              products={products}
              categories={categories}
              onAddToCart={addToCart}
            />
          )}
        </div>

        {/* Right: Cart Panel (30%) */}
        <div className="flex-[0.3] min-w-[380px] flex flex-col">
          <div className="panel flex-1 flex flex-col bg-white">
            <CartPanel onCheckout={handleCheckout} />
          </div>

          <div className="mt-4 flex gap-1.5 px-0.5">
            <Button
              variant="outline"
              className={cn(
                "flex-1 min-w-0 border-slate-200 text-slate-600 hover:bg-slate-50 relative px-2",
                !hasRefunds && "opacity-60",
              )}
              onClick={() => setIsRefundOpen(true)}
              disabled={!hasRefunds}
            >
              <RotateCcw className="mr-1.5 h-4 w-4 shrink-0" />
              <span className="truncate text-xs">Return Sale</span>
              {!hasRefunds && (
                <Badge
                  variant="outline"
                  className="absolute -top-1 -right-1 bg-white text-[8px] px-1 font-black"
                >
                  PRO
                </Badge>
              )}
            </Button>
            <Button
              variant="outline"
              className="flex-1 min-w-0 border-slate-200 text-slate-600 hover:bg-slate-50 relative px-2"
              onClick={handleHoldSale}
              disabled={cart.length === 0}
            >
              <span className="truncate text-xs">Hold Sale</span>
            </Button>
            <Button
              variant="outline"
              className="shrink-0 w-11 border-slate-200 text-slate-400 hover:text-primary hover:bg-primary/5 transition-all relative p-0"
              onClick={() => setIsHeldSalesOpen(true)}
            >
              <ShoppingCart className="h-4 w-4" />
              {heldSalesCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] w-auto flex items-center justify-center px-1 bg-orange-500 text-[10px] font-black border-2 border-white rounded-full">
                  {heldSalesCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      <CheckoutDialog
        open={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onConfirm={handleConfirmSale}
        initialValues={
          editSale
            ? {
                paymentMethod: editSale.payment_method,
                amountTendered: Number(
                  editSale.amount_tendered || editSale.total_amount || 0,
                ),
                customerId: editSale.customer_id,
                customerName: editSale.customer_name,
                momoTransactionId: editSale.momo_transaction_id,
                momoProvider: editSale.momo_provider,
                couponId: editSale.coupon_id,
              }
            : undefined
        }
      />

      <RefundDialog
        open={isRefundOpen}
        onClose={() => setIsRefundOpen(false)}
        userId={user?.id}
        onRefundSuccess={loadProducts}
      />

      {!isReceiptPreviewOpen && <ReceiptPrint sale={lastSale} />}

      <ReceiptPreviewDialog
        open={isReceiptPreviewOpen}
        onClose={() => {
          setIsReceiptPreviewOpen(false);
          if (editSale) {
            navigate("/sales");
          }
        }}
        sale={lastSale}
      />

      <HeldSalesDialog
        open={isHeldSalesOpen}
        onClose={() => setIsHeldSalesOpen(false)}
        onResume={handleResumeSale}
        onUpdate={updateHeldSalesCount}
      />
    </div>
  );
}

export default function POS() {
  return (
    <CartProvider>
      <POSContent />
    </CartProvider>
  );
}
