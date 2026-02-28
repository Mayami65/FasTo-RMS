export interface Category {
    id: number;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    parent_id?: number | null;
    is_archived?: number; // 0 or 1
    created_at?: string;
}

export interface ProductVariant {
    id?: number;
    product_id: number;
    sku: string;
    variation_name: string;
    cost_price: number;
    selling_price: number;
    stock_quantity: number;
    reorder_level: number;
    created_at?: string;
}

export interface Product {
    id?: number;
    name: string;
    sku: string;
    category?: string;
    category_id?: number | null;
    category_name?: string;
    category_color?: string;
    category_icon?: string;
    cost_price: number;
    selling_price: number;
    stock_quantity: number;
    reorder_level: number;
    description?: string;
    image_path?: string;
    variants?: ProductVariant[];
    created_at?: string;
}
