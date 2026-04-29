import type { IpcMain } from "electron";
import type { AppDatabase } from '../db';
import { audit } from "../services/audit";

export function registerHirePurchaseHandlers(ipcMain: IpcMain, db: AppDatabase) {

    // Get HP Summary
    ipcMain.handle('get-hp-summary', async () => {
        if (!db) return null;

        const { checkLicenseFeature } = require('../utils/license');
        if (!checkLicenseFeature('hire_purchase')) {
            throw new Error('Feature Locked: PRO edition required for Hire Purchase.');
        }

        try {
                const activeAgreements = db.prepare(`
                    SELECT COUNT(*) as count
                    FROM hire_purchase_agreements
                    WHERE TRIM(UPPER(status)) = 'ACTIVE'
                `).get() as any;
                const totalDebt = db.prepare(`
                    SELECT COALESCE(SUM(balance_due), 0) as total
                    FROM hire_purchase_agreements
                    WHERE TRIM(UPPER(status)) = 'ACTIVE'
                `).get() as any;

            const overdueAgreements = db.prepare(`
                SELECT COUNT(*) as count 
                FROM hire_purchase_agreements 
                WHERE TRIM(UPPER(status)) = 'ACTIVE' 
                AND next_payment_date < datetime('now')
            `).get() as any;

            const recentPayments = db.prepare(`
                SELECT c.name as customer_name, i.amount_paid as amount, i.payment_date as date, hpa.balance_due
                FROM installments i
                JOIN hire_purchase_agreements hpa ON i.agreement_id = hpa.id
                JOIN customers c ON hpa.customer_id = c.id
                ORDER BY i.payment_date DESC
                LIMIT 10
            `).all();

            return {
                total_active_agreements: activeAgreements.count || 0,
                total_debt: totalDebt.total || 0,
                overdue_count: overdueAgreements.count || 0,
                recent_payments: recentPayments
            };
        } catch (error) {
            console.error('Failed to get HP summary:', error);
            return null;
        }
    });

    // Get HP Agreements
    ipcMain.handle('get-hire-purchase-agreements', async (_event, { status, search, page = 1, limit = 10 }) => {
        if (!db) return { data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
        try {
            const offset = (page - 1) * limit;
            let query = `
                SELECT hpa.*, c.name as customer_name, c.phone as customer_phone
                FROM hire_purchase_agreements hpa
                JOIN customers c ON hpa.customer_id = c.id
                WHERE 1=1
            `;
            let countQuery = `
                SELECT COUNT(*) as count
                FROM hire_purchase_agreements hpa
                JOIN customers c ON hpa.customer_id = c.id
                WHERE 1=1
            `;

            const params: any[] = [];
            let whereClause = '';

            if (status && status !== 'ALL') {
                whereClause += ' AND TRIM(UPPER(hpa.status)) = TRIM(UPPER(?))';
                params.push(status);
            }

            if (search) {
                whereClause += ' AND (c.name LIKE ? OR c.phone LIKE ?)';
                params.push(`%${search}%`, `%${search}%`);
            }

            const totalResult = db.prepare(countQuery + whereClause).get(...params) as any;
            const total = totalResult ? totalResult.count : 0;
            const totalPages = Math.ceil(total / limit);

            query += whereClause + ' ORDER BY hpa.next_payment_date ASC LIMIT ? OFFSET ?';
            const data = db.prepare(query).all(...params, limit, offset);

            return {
                data,
                pagination: { total, page, limit, totalPages }
            };
        } catch (error) {
            console.error('Failed to get HP agreements:', error);
            return { data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
        }
    });

    // Get Overdue Agreements
    ipcMain.handle('get-overdue-agreements', async () => {
        if (!db) return [];
        try {
            return db.prepare(`
                SELECT hpa.*, c.name as customer_name, c.phone as customer_phone
                FROM hire_purchase_agreements hpa
                JOIN customers c ON hpa.customer_id = c.id
                WHERE TRIM(UPPER(hpa.status)) = 'ACTIVE' 
                AND hpa.next_payment_date < datetime('now')
                ORDER BY hpa.next_payment_date ASC
            `).all();
        } catch (error) {
            console.error('Failed to get overdue agreements:', error);
            return [];
        }
    });

    // Add Installment
    ipcMain.handle('add-installment', async (_event, { agreementId, amount, notes, nextPaymentDate, userId }) => {
        if (!db) return { success: false, error: 'Database not initialized' };

        try {
            const insertInstallment = db.prepare('INSERT INTO installments (agreement_id, amount_paid, notes) VALUES (?, ?, ?)');
            const getAgreement = db.prepare('SELECT id, customer_id, balance_due, status, next_payment_date FROM hire_purchase_agreements WHERE id = ?');

            let updateQuery = 'UPDATE hire_purchase_agreements SET balance_due = balance_due - ?, status = CASE WHEN (balance_due - ?) <= 0 THEN \'COMPLETED\' ELSE status END';
            const params = [amount, amount];

            if (nextPaymentDate) {
                updateQuery += ', next_payment_date = ?';
                params.push(nextPaymentDate);
            }

            updateQuery += ' WHERE id = ?';
            params.push(agreementId);

            const updateAgreement = db.prepare(updateQuery);

            const transaction = db.transaction(() => {
                const before = getAgreement.get(agreementId) as any;
                if (!before) throw new Error('Agreement not found');
                if (amount <= 0) throw new Error('Installment amount must be greater than 0');
                if (amount > before.balance_due) throw new Error('Installment amount exceeds balance due');

                insertInstallment.run(agreementId, amount, notes);
                const result = updateAgreement.run(...params);
                if (result.changes === 0) throw new Error('Agreement not found');

                const after = getAgreement.get(agreementId) as any;
                audit(db, {
                    action: 'INSTALLMENT_ADD',
                    details: `Added installment of GH₵ ${amount} for Agreement #${agreementId}`,
                    entity: 'installment',
                    entityId: agreementId, // ideally installment ID, but transaction didn't return it easily without extra query or result usage.
                    before: { balance: before.balance_due, status: before.status },
                    after: { balance: after.balance_due, status: after.status }
                });
            });

            transaction();
            return { success: true };
        } catch (error: any) {
            console.error('Failed to add installment:', error);
            return { success: false, error: error.message };
        }
    });
}
