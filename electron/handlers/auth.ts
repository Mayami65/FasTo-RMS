import type { IpcMain } from "electron";
import type { AppDatabase } from '../db';
import * as bcrypt from 'bcryptjs';
import { audit } from "../services/audit";

export function registerAuthHandlers(ipcMain: IpcMain, db: AppDatabase) {

    // Login Handler
    ipcMain.handle('login', async (_event, { username, password }) => {
        if (!db) return { success: false, error: 'Database error' };
        try {
            const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

            // Check if user exists and is active
            if (!user) return { success: false, error: 'Invalid credentials' };
            if (!user.is_active) return { success: false, error: 'Account is deactivated' };

            // Verify password
            const validCurrent = await bcrypt.compare(password, user.password);

            // Fallback for migrated plain text passwords (if any, though not recommended in prod)
            // Ideally we re-hash on successful login if it matches plain text, but let's stick to bcrypt.

            if (!validCurrent) return { success: false, error: 'Invalid credentials' };

            // Log successful login
            audit(db, {
                userId: user.id,
                action: 'LOGIN',
                details: 'User logged in'
            });

            // Return user info (exclude password)
            const { password: _, ...userWithoutPassword } = user;
            return { success: true, user: userWithoutPassword };
        } catch (error) {
            console.error('Login failed:', error);
            return { success: false, error: 'Login failed' };
        }
    });

    // Get Users
    ipcMain.handle('get-users', async () => {
        if (!db) return [];
        try {
            // Return all users with their password hash omitted
            return db.prepare('SELECT id, username, role, is_active, created_at FROM users').all();
        } catch (error) {
            console.error('Failed to get users:', error);
            return [];
        }
    });

    // Create User
    ipcMain.handle('create-user', async (_event, userData) => {
        if (!db) return { success: false, error: 'Database not initialized' };
        try {
            // Check if username exists
            const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(userData.username);
            if (existing) return { success: false, error: 'Username already exists' };

            const hashedPassword = await bcrypt.hash(userData.password, 10);

            const stmt = db.prepare(`
                INSERT INTO users (username, password, role, is_active)
                VALUES (?, ?, ?, ?)
            `);

            const info = stmt.run(
                userData.username,
                hashedPassword,
                userData.role || 'SHOP_REP',
                userData.is_active !== undefined ? userData.is_active : 1
            );

            audit(db, {
                userId: undefined, // System action or current user? usually we might need current user id here but for now leave undefined or pass from frontend
                action: 'USER_CREATE',
                details: `Created user ${userData.username}`,
                entity: 'user',
                entityId: info.lastInsertRowid
            });

            return { success: true, id: info.lastInsertRowid };
        } catch (error: any) {
            console.error('Failed to create user:', error);
            return { success: false, error: error.message };
        }
    });

    // Reset User Password
    ipcMain.handle('reset-user-password', async (_event, { id, newPassword }) => {
        if (!db) return { success: false, error: 'Database not initialized' };
        try {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, id);

            audit(db, {
                action: 'USER_PASSWORD_RESET',
                details: `Reset password for user ID: ${id}`,
                entity: 'user',
                entityId: id
            });

            return { success: true };
        } catch (error: any) {
            console.error('Failed to reset user password:', error);
            return { success: false, error: error.message };
        }
    });

    // Update User
    ipcMain.handle('update-user', async (_event, userData) => {
        if (!db) return { success: false, error: 'Database not initialized' };
        try {
            // Build query dynamically based on whether password is being updated
            let query = 'UPDATE users SET username = ?, role = ?, is_active = ?';
            const params = [userData.username, userData.role, userData.is_active];

            if (userData.password) {
                const hashedPassword = await bcrypt.hash(userData.password, 10);
                query += ', password = ?';
                params.push(hashedPassword);
            }

            query += ' WHERE id = ?';
            params.push(userData.id);

            db.prepare(query).run(...params);

            audit(db, {
                action: 'USER_UPDATE',
                details: `Updated user ${userData.username} (ID: ${userData.id})`,
                entity: 'user',
                entityId: userData.id
            });

            return { success: true };
        } catch (error: any) {
            console.error('Failed to update user:', error);
            return { success: false, error: error.message };
        }
    });

    // Delete User
    ipcMain.handle('delete-user', async (_event, id) => {
        if (!db) return { success: false, error: 'Database not initialized' };
        try {
            // Prevent deleting the last admin/owner? (Optional check)

            db.prepare('DELETE FROM users WHERE id = ?').run(id);

            audit(db, {
                action: 'USER_DELETE',
                details: `Deleted user ID: ${id}`,
                entity: 'user',
                entityId: id
            });

            return { success: true };
        } catch (error: any) {
            console.error('Failed to delete user:', error);
            return { success: false, error: error.message };
        }
    });

    // Audit Logs
    ipcMain.handle('get-audit-logs', async (_event, { page = 1, limit = 50 } = {}) => {
        if (!db) return { logs: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } };
        try {
            const offset = (page - 1) * limit;
            const countResult = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get() as any;
            const total = countResult.count;
            const totalPages = Math.ceil(total / limit);

            const logs = db.prepare(`
                SELECT a.*, u.username 
                FROM audit_logs a 
                LEFT JOIN users u ON a.user_id = u.id 
                ORDER BY a.timestamp DESC 
                LIMIT ? OFFSET ?
            `).all(limit, offset);

            return {
                logs,
                pagination: { total, page, limit, totalPages }
            };
        } catch (error) {
            console.error('Failed to get audit logs:', error);
            return { logs: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } };
        }
    });
}
