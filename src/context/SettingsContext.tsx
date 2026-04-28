import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type SubscriptionTier = 'LITE' | 'STANDARD' | 'PRO';

interface License {
    id: number;
    shop_name: string;
    license_key: string;
    plan_type: SubscriptionTier;
    expires_at: string;
    is_active: number;
    activated_at: string;
    machine_fingerprint: string;
}

interface Settings {
    tier: SubscriptionTier;
    storeName: string;
    storeAddress: string;
    storePhone: string;
    storeEmail: string;
    receiptHeader: string;
    receiptFooter: string;
    taxId: string;
    showCashierName: string;
    showStoreEmail: string;
    customer_tracking_enabled: string;
    [key: string]: string;
}

const PLAN_FEATURES: Record<SubscriptionTier, string[]> = {
    LITE: ['basic_pos'],
    STANDARD: ['basic_pos', 'refunds', 'variations'],
    PRO: ['basic_pos', 'refunds', 'variations', 'hire_purchase', 'advanced_reports', 'audit_logs']
};

interface SettingsContextType {
    settings: Settings;
    license: License | null;
    machineId: string | null;
    loading: boolean;
    updateSetting: (key: string, value: string) => Promise<boolean>;
    refreshSettings: () => Promise<void>;
    hasFeature: (feature: string) => boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Settings>({
        tier: 'PRO',
        storeName: "FasTo",
        storeAddress: "Amasaman, Accra - Ghana",
        storePhone: "+233 24 123 4567",
        storeEmail: "contact@fasto.com",
        receiptHeader: "WELCOME TO FasTo",
        receiptFooter: "THANK YOU FOR YOUR PATRONAGE!",
        taxId: "",
        showCashierName: "true",
        showStoreEmail: "true",
        customer_tracking_enabled: "false"
    });
    const [loading, setLoading] = useState(true);
    const [license, setLicense] = useState<License | null>(null);
    const [machineId, setMachineId] = useState<string | null>(null);

    const fetchSettings = async () => {
        try {
            const [data, licenseStatus] = await Promise.all([
                window.api.getSettings(),
                window.api.getLicenseStatus()
            ]);

            // The DB may store keys as snake_case (shop_name) or camelCase (storeName).
            // Normalize: prefer camelCase but fall back to snake_case equivalents.
            const normalized = { ...data };
            if (!normalized.storeName && normalized.shop_name) normalized.storeName = normalized.shop_name;
            if (!normalized.storePhone && normalized.shop_phone) normalized.storePhone = normalized.shop_phone;
            if (!normalized.storeAddress && normalized.shop_address) normalized.storeAddress = normalized.shop_address;

            setSettings(prev => ({
                ...prev,
                ...normalized,
                tier: (normalized.tier as SubscriptionTier) || prev.tier,
            }));

            setLicense(licenseStatus.license);
            setMachineId(licenseStatus.machineId);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const updateSetting = async (key: string, value: string) => {
        try {
            const result = await window.api.updateSettings({ [key]: value });
            if (result.success) {
                setSettings(prev => ({ ...prev, [key]: value }));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to update setting:', error);
            return false;
        }
    };

    const hasFeature = (feature: string) => {
        const currentTier = license?.is_active ? license.plan_type : 'LITE';
        return PLAN_FEATURES[currentTier]?.includes(feature) || false;
    };

    return (
        <SettingsContext.Provider value={{ settings, license, machineId, loading, updateSetting, refreshSettings: fetchSettings, hasFeature }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
