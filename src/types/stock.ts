export type StockMovementReason = 'RESTOCK' | 'SALE' | 'DAMAGE' | 'LOSS' | 'CORRECTION';

export interface StockMovement {
    id: number;
    product_id: number;
    quantity_change: number;
    reason: StockMovementReason;
    notes?: string;
    timestamp: string;
}

export interface StockAdjustmentPayload {
    productId: number;
    quantityChange: number;
    reason: StockMovementReason;
    notes?: string;
}
