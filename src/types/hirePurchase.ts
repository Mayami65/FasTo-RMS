import { Customer } from './customer';

export interface HirePurchaseAgreement {
    id: number;
    customer_id: number;
    sale_id: number;
    total_amount: number;
    balance_due: number;
    status: 'ACTIVE' | 'COMPLETED' | 'DEFAULTED';
    created_at: string;
    customer?: Customer;
}

export interface Installment {
    id: number;
    agreement_id: number;
    amount_paid: number;
    payment_date: string;
    notes?: string;
}
