import type { IpcMain } from "electron";
import type { AppDatabase } from '../db';
import { audit } from "../services/audit";

export function registerCustomerHandlers(ipcMain: IpcMain, db: AppDatabase) {
    const normalizePhone = (phone: string | undefined | null) => {
        if (!phone) return null;
        return phone.replace(/[\s\-\(\)]/g, '');
    };

    const normalizeName = (name: string | undefined | null) => {
        if (!name) return null;
        return name.trim().split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    };

    // Get Customers
    ipcMain.handle('get-customers', async (_event, { page = 1, limit = 15, search = '' } = {}) => {
        if (!db) return { data: [], pagination: { total: 0, page: 1, limit: 15, totalPages: 0 } };
        try {
            const offset = (page - 1) * limit;
            let query = 'SELECT * FROM customers WHERE 1=1';
            let countQuery = 'SELECT COUNT(*) as count FROM customers WHERE 1=1';
            const params: any[] = [];

            if (search) {
                // Use a more efficient search pattern for POS
                const searchClause = ' AND (name LIKE ? OR phone LIKE ?)';
                query += searchClause;
                countQuery += searchClause;
                params.push(`%${search}%`, `${search}%`); // Phone usually starts with prefix
            }

            const totalResult = db.prepare(countQuery).get(...params) as any;
            const total = totalResult ? totalResult.count : 0;
            const totalPages = Math.ceil(total / limit);

            query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
            const data = db.prepare(query).all(...params, limit, offset);

            return {
                data,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages
                }
            };
        } catch (error) {
            console.error('Failed to get customers:', error);
            return { data: [], pagination: { total: 0, page: 1, limit: 15, totalPages: 0 } };
        }
    });

    // Get Recent Customers (based on last sales)
    ipcMain.handle('get-recent-customers', async (_event, { limit = 5 } = {}) => {
        if (!db) return [];
        try {
            // Join with sales to find most recently used customers
            const query = `
                SELECT DISTINCT c.* 
                FROM customers c
                JOIN sales s ON c.id = s.customer_id
                ORDER BY s.timestamp DESC
                LIMIT ?
            `;
            const data = db.prepare(query).all(limit);
            return data;
        } catch (error) {
            console.error('Failed to get recent customers:', error);
            return [];
        }
    });

    // Add Customer
    ipcMain.handle('add-customer', async (_event, customer) => {
        if (!db) return { success: false, error: 'Database not initialized' };
        try {
            const normalizedName = normalizeName(customer.name) || '';
            const normalizedPhone = normalizePhone(customer.phone);

            const stmt = db.prepare('INSERT INTO customers (name, phone, email, id_card_number, address) VALUES (@name, @phone, @email, @id_card_number, @address)');
            const info = stmt.run({
                email: null,
                id_card_number: null,
                address: null,
                ...customer,
                name: normalizedName,
                phone: normalizedPhone
            });

            audit(db, {
                action: 'CUSTOMER_CREATE',
                details: `Added customer ${customer.name}`,
                entity: 'customer',
                entityId: info.lastInsertRowid
            });

            return { success: true, id: info.lastInsertRowid };
        } catch (error: any) {
            console.error('Failed to add customer:', error);
            return { success: false, error: error.message };
        }
    });

    // Update Customer
    ipcMain.handle('update-customer', async (_event, customer) => {
        if (!db) return { success: false, error: 'Database not initialized' };
        try {
            const normalizedName = normalizeName(customer.name) || '';
            const normalizedPhone = normalizePhone(customer.phone);

            const oldCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer.id) as any;
            const stmt = db.prepare('UPDATE customers SET name = @name, phone = @phone, email = @email, id_card_number = @id_card_number, address = @address WHERE id = @id');
            const result = stmt.run({
                email: null,
                id_card_number: null,
                address: null,
                ...customer,
                name: normalizedName,
                phone: normalizedPhone
            });

            if (result.changes === 0) {
                return { success: false, error: 'Customer not found' };
            }

            if (oldCustomer) {
                const changes: any = {};
                const trackedFields = ['name', 'phone', 'email', 'id_card_number', 'address'];
                for (const field of trackedFields) {
                    if (oldCustomer[field] !== customer[field]) {
                        changes[field] = { from: oldCustomer[field], to: customer[field] };
                    }
                }
                if (Object.keys(changes).length > 0) {
                    audit(db, {
                        action: 'CUSTOMER_UPDATE',
                        details: `Updated customer ${customer.name} (ID: ${customer.id})`,
                        entity: 'customer',
                        entityId: customer.id,
                        after: changes
                    });
                }
            }

            return { success: true };
        } catch (error: any) {
            console.error('Failed to update customer:', error);
            return { success: false, error: error.message };
        }
    });

    // Delete Customer
    ipcMain.handle('delete-customer', async (_event, id) => {
        if (!db) return { success: false, error: 'Database not initialized' };
        try {
            // Check if customer has linked data (sales, hp agreements)
            const hpCount = db.prepare('SELECT COUNT(*) as c FROM hire_purchase_agreements WHERE customer_id = ?').get(id) as any;
            if (hpCount.c > 0) {
                return { success: false, error: 'Cannot delete customer with active or past hire purchase agreements.' };
            }

            const salesCount = db.prepare('SELECT COUNT(*) as c FROM sales WHERE customer_id = ?').get(id) as any;
            if (salesCount.c > 0) {
                return { success: false, error: 'Cannot delete customer with associated sales history.' };
            }

            const stmt = db.prepare('DELETE FROM customers WHERE id = ?');
            stmt.run(id);

            audit(db, {
                action: 'CUSTOMER_DELETE',
                details: `Deleted customer ID: ${id}`,
                entity: 'customer',
                entityId: id
            });

            return { success: true };
        } catch (error: any) {
            console.error('Failed to delete customer:', error);
            return { success: false, error: error.message };
        }
    });

    // Get Customer Details
    ipcMain.handle('get-customer-details', async (_event, customerId) => {
        if (!db) return null;
        try {
            const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
            if (!customer) return null;

            // 1. Get Hire Purchase Agreements
            const agreements = db.prepare(`
                SELECT hpa.*, s.payment_method, s.total_amount as sale_total, s.timestamp as sale_date 
                FROM hire_purchase_agreements hpa
                JOIN sales s ON hpa.sale_id = s.id
                WHERE hpa.customer_id = ?
                ORDER BY hpa.created_at DESC
            `).all(customerId);

            for (const agreement of agreements) {
                agreement.installments = db.prepare('SELECT * FROM installments WHERE agreement_id = ? ORDER BY payment_date DESC').all(agreement.id);
            }

            // 2. Get Unified Sales History (Cash, Momo, HP)
            const salesHistory = db.prepare(`
                SELECT s.*, u.username as cashier_name
                FROM sales s
                LEFT JOIN users u ON s.user_id = u.id
                WHERE s.customer_id = ?
                ORDER BY s.timestamp DESC
            `).all(customerId);

            return { customer, agreements, salesHistory };
        } catch (error) {
            console.error('Failed to get customer details:', error);
            return null;
        }
    });

    // Check if Customer exists by phone
    ipcMain.handle('check-customer-exists', async (_event, phone) => {
        if (!db) return null;
        try {
            const normalizedPhone = normalizePhone(phone);
            if (!normalizedPhone) return null;
            return db.prepare('SELECT * FROM customers WHERE phone = ?').get(normalizedPhone);
        } catch (error) {
            console.error('Failed to check customer existence:', error);
            return null;
        }
    });
}
