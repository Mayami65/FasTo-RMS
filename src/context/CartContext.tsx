import { createContext, useContext, useMemo, useCallback, useState, ReactNode } from 'react';
import { Product } from '@/types/product';
import { CartItem } from '@/types/sale';

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: Product, variantId?: number) => void;
    removeFromCart: (productId: number, variantId?: number) => void;
    updateQuantity: (productId: number, variantId: number | undefined, quantity: number) => void;
    clearCart: () => void;
    loadCart: (items: CartItem[]) => void;
    totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);

    const addToCart = useCallback((product: Product, variantId?: number) => {
        setCart((prev) => {
            const variantEntry = variantId ? product.variants?.find(v => v.id === variantId) : null;

            const existing = prev.find((item) =>
                item.id === product.id && item.variantId === variantId
            );

            if (existing) {
                return prev.map((item) =>
                    item.id === product.id && item.variantId === variantId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            const newCartItem: CartItem = {
                ...product,
                variantId,
                variationName: variantEntry?.variation_name,
                selling_price: variantEntry ? variantEntry.selling_price : product.selling_price,
                quantity: 1
            };

            return [...prev, newCartItem];
        });
    }, []);

    const removeFromCart = useCallback((productId: number, variantId?: number) => {
        setCart((prev) => prev.filter((item) => !(item.id === productId && item.variantId === variantId)));
    }, []);

    const updateQuantity = useCallback((productId: number, variantId: number | undefined, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId, variantId);
            return;
        }
        setCart((prev) =>
            prev.map((item) => (item.id === productId && item.variantId === variantId ? { ...item, quantity } : item))
        );
    }, [removeFromCart]);

    const clearCart = useCallback(() => {
        setCart([]);
    }, []);

    const loadCart = useCallback((items: CartItem[]) => {
        setCart(items);
    }, []);

    const totalAmount = cart.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);

    const value = useMemo(() => ({
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        loadCart,
        totalAmount,
    }), [cart, addToCart, removeFromCart, updateQuantity, clearCart, loadCart, totalAmount]);

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
