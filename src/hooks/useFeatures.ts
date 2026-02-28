import { useSettings } from '../context/SettingsContext';

export const useFeatures = () => {
    const { hasFeature, license } = useSettings();
    const tier = license?.is_active ? license.plan_type : 'LITE';

    return {
        tier,
        hasRefunds: hasFeature('refunds'),
        hasVariations: hasFeature('variations'),
        hasHirePurchase: hasFeature('hire_purchase'),
        hasAdvancedReports: hasFeature('advanced_reports'),
        hasAuditLogs: hasFeature('audit_logs'),
        isLite: tier === 'LITE',
        isStandard: tier === 'STANDARD',
        isPro: tier === 'PRO'
    };
};
