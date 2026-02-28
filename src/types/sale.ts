import { Product } from './product';

export interface CartItem extends Product {
    variantId?: number;
    variationName?: string;
    quantity: number;
}

export interface SaleItem {
    productId: number;
    variantId?: number;
    quantity: number;
    price: number;
    name: string;
    productName?: string;
    variationName?: string;
    discount_amount?: number;
}

export interface Discount {
    id?: number;
    name: string;
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    min_purchase?: number;
    is_active?: number;
    start_date?: string | null;
    end_date?: string | null;
    created_at?: string;
}

export interface SaleTransaction {
    items: SaleItem[];
    paymentMethod: 'CASH' | 'MOBILE_MONEY' | 'CARD' | 'HIRE_PURCHASE';
    totalAmount: number;
    userId?: number;
    customerId?: number;
    depositAmount?: number;
    hpDuration?: string;
    momoTransactionId?: string;
    momoProvider?: string;
    discount_amount?: number;
    coupon_id?: number;
}
