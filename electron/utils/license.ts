import { getDb } from '../db';

export type FeatureKey = 'hire_purchase' | 'advanced_reports' | 'audit_logs';

const PLAN_PERMISSIONS: Record<string, FeatureKey[]> = {
    'LITE': [],
    'STANDARD': [],
    'PRO': ['hire_purchase', 'advanced_reports', 'audit_logs']
};

export function checkLicenseFeature(feature: FeatureKey): boolean {
    const db = getDb();
    try {
        const license = db.prepare('SELECT plan_type, is_active FROM license LIMIT 1').get() as any;
        if (!license || !license.is_active) return false;

        const plan = license.plan_type || 'LITE';
        return PLAN_PERMISSIONS[plan]?.includes(feature) || false;
    } catch (error) {
        console.error('License check failed:', error);
        return false;
    }
}
