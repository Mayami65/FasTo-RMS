import { ipcMain } from 'electron';
import { getDb } from '../db';
import { getMachineFingerprint } from '../utils/fingerprint';

export function registerLicenseHandlers() {
    ipcMain.handle('license:get-status', async () => {
        const db = getDb();
        const fingerprint = getMachineFingerprint();

        try {
            const license = db.prepare('SELECT * FROM license LIMIT 1').get() as any;

            return {
                license: license || null,
                machineId: fingerprint,
                isMachineBound: license ? license.machine_fingerprint === fingerprint : false
            };
        } catch (error) {
            console.error('Failed to get license status:', error);
            throw error;
        }
    });

    ipcMain.handle('license:activate', async (_, { licenseKey, planType, shopName }) => {
        const db = getDb();
        const fingerprint = getMachineFingerprint();

        try {
            // In a real app, you'd validate the key against a server here
            // For this implementation, we'll simulate validation
            const isExisting = db.prepare('SELECT count(*) as count FROM license').get() as any;

            const expiresAt = new Date();
            expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year license

            if (isExisting.count > 0) {
                db.prepare(`
                    UPDATE license 
                    SET license_key = ?, plan_type = ?, shop_name = ?, machine_fingerprint = ?, 
                        is_active = 1, activated_at = CURRENT_TIMESTAMP, expires_at = ?
                `).run(licenseKey, planType, shopName, fingerprint, expiresAt.toISOString());
            } else {
                db.prepare(`
                    INSERT INTO license (license_key, plan_type, shop_name, machine_fingerprint, is_active, activated_at, expires_at)
                    VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, ?)
                `).run(licenseKey, planType, shopName, fingerprint, expiresAt.toISOString());
            }

            // Sync with settings table for backward compatibility if needed
            db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('tier', ?)").run(planType);

            return { success: true, plan: planType };
        } catch (error) {
            console.error('Activation failed:', error);
            return { success: false, error: 'Failed to activate license' };
        }
    });

    ipcMain.handle('license:deactivate', async () => {
        const db = getDb();
        try {
            db.prepare('UPDATE license SET is_active = 0, machine_fingerprint = NULL').run();
            db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('tier', 'LITE')").run();
            return { success: true };
        } catch (error) {
            console.error('Deactivation failed:', error);
            return { success: false, error: 'Failed to deactivate license' };
        }
    });
}
