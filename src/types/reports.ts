export interface SaleItem {
    id: number;
    sale_id: number;
    product_id: number;
    product_name?: string;
    quantity: number;
    price_at_sale: number;
}

export interface Sale {
    id: number;
    user_id: number;
    total_amount: number;
    payment_method: string;
    timestamp: string;
    items?: SaleItem[];
}

export interface SalesReportData {
    sales: Sale[];
    summary: {
        total_sales: number;
        total_revenue: number;
        payment_breakdown: {
            CASH: number;
            MOBILE_MONEY: number;
            HIRE_PURCHASE: number;
        };
    };
}

export interface HPSummaryData {
    total_active_agreements: number;
    total_debt: number;
    recent_payments: {
        customer_name: string;
        amount: number;
        date: string;
    }[];
}
