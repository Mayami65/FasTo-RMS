import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Upload, Download, Moon, Sun, Monitor, ShieldCheck, Zap, Store, ReceiptText, Building2, Phone, Mail, FileText, Save, Users, TriangleAlert, Package, Loader2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from "@/lib/utils";

import UserManagement from '@/components/settings/UserManagement';
import ActivationModal from '@/components/settings/ActivationModal';
import DeleteAllProductsModal from '@/components/settings/DeleteAllProductsModal';
import { Lock, Unlock, AlertTriangle } from 'lucide-react';

export default function Settings() {
    const [backUpLoading, setBackUpLoading] = useState(false);
    const [restoreLoading, setRestoreLoading] = useState(false);
    const [isFullExporting, setIsFullExporting] = useState(false);
    const [isDeletingAllProducts, setIsDeletingAllProducts] = useState(false);
    const { theme, setTheme } = useTheme();
    const { isOwner } = useAuth();
    const { settings, license, machineId, updateSetting, refreshSettings, hasFeature } = useSettings();
    const [activeTab, setActiveTab] = useState('general');
    const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const categories = [
        { id: 'general', label: 'General', icon: Monitor },
        { id: 'store', label: 'Store Profile', icon: Store },
        { id: 'receipt', label: 'Receipt Setup', icon: ReceiptText },
        { id: 'users', label: 'Users & Roles', icon: Users },
        { id: 'license', label: 'License', icon: ShieldCheck },
        { id: 'data', label: 'Data & Backup', icon: Database },
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'about', label: 'About', icon: FileText },
    ];

    const [appInfo, setAppInfo] = useState({
        version: '...',
        dbPath: '...',
        lastBackup: 'Never'
    });

    const handleOpenDataFolder = async () => {
        const result = await window.api.openDataFolder();
        if (!result.success) alert('Failed to open folder: ' + result.error);
    };

    const handleOpenExportsFolder = async () => {
        const result = await window.api.openExportsFolder();
        if (!result.success) alert('Failed to open folder: ' + result.error);
    };

    useEffect(() => {
        const fetchAppInfo = async () => {
            try {
                const info = await window.api.getAppInfo();
                setAppInfo(prev => ({ ...prev, version: info.version, dbPath: info.dbPath }));
            } catch (err) {
                console.error("Failed to load App Info", err);
            }
        };
        fetchAppInfo();
    }, []);

    // Local state for Store Profile
    const [storeForm, setStoreForm] = useState({
        storeName: settings.storeName || '',
        storeAddress: settings.storeAddress || '',
        storePhone: settings.storePhone || '',
        storeEmail: settings.storeEmail || '',
        taxId: settings.taxId || ''
    });

    // Local state for Receipt Layout
    const [receiptForm, setReceiptForm] = useState({
        receiptHeader: settings.receiptHeader || '',
        receiptFooter: settings.receiptFooter || ''
    });

    const [isSavingStore, setIsSavingStore] = useState(false);
    const [isSavingReceipt, setIsSavingReceipt] = useState(false);

    // Dirty checking for buttons
    const isStoreDirty =
        storeForm.storeName !== (settings.storeName || '') ||
        storeForm.storeAddress !== (settings.storeAddress || '') ||
        storeForm.storePhone !== (settings.storePhone || '') ||
        storeForm.storeEmail !== (settings.storeEmail || '') ||
        storeForm.taxId !== (settings.taxId || '');

    const isReceiptDirty =
        receiptForm.receiptHeader !== (settings.receiptHeader || '') ||
        receiptForm.receiptFooter !== (settings.receiptFooter || '');

    // Sync local state when global settings load (e.g. initial load)
    useEffect(() => {
        if (settings) {
            setStoreForm({
                storeName: settings.storeName || '',
                storeAddress: settings.storeAddress || '',
                storePhone: settings.storePhone || '',
                storeEmail: settings.storeEmail || '',
                taxId: settings.taxId || ''
            });
            setReceiptForm({
                receiptHeader: settings.receiptHeader || '',
                receiptFooter: settings.receiptFooter || ''
            });
        }
    }, [settings.storeName, settings.storeAddress, settings.storePhone, settings.storeEmail, settings.taxId, settings.receiptHeader, settings.receiptFooter]);

    const handleSaveStore = async () => {
        setIsSavingStore(true);
        try {
            const updates = Object.entries(storeForm).map(([key, value]) => updateSetting(key, value));
            await Promise.all(updates);
            alert('Store Profile updated successfully');
        } catch (error) {
            console.error('Failed to save store profile:', error);
            alert('Failed to save store profile');
        } finally {
            setIsSavingStore(false);
        }
    };

    const handleSaveReceipt = async () => {
        setIsSavingReceipt(true);
        try {
            const updates = Object.entries(receiptForm).map(([key, value]) => updateSetting(key, value));
            await Promise.all(updates);
            alert('Receipt layout updated successfully');
        } catch (error) {
            console.error('Failed to save receipt settings:', error);
            alert('Failed to save receipt settings');
        } finally {
            setIsSavingReceipt(false);
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                if (activeTab === 'store' && isStoreDirty) handleSaveStore();
                if (activeTab === 'receipt' && isReceiptDirty) handleSaveReceipt();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTab, isStoreDirty, isReceiptDirty, storeForm, receiptForm]);

    const handleBackup = async () => {
        setBackUpLoading(true);
        try {
            const result = await window.api.backupDatabase();
            if (result.success) {
                alert(`Backup created successfully at: ${result.path}`);
            } else if (result.error !== 'Backup cancelled') {
                alert('Backup failed: ' + result.error);
            }
        } catch (error) {
            console.error('Backup error:', error);
            alert('An error occurred during backup');
        } finally {
            setBackUpLoading(false);
        }
    };

    const handleRestore = async () => {
        if (!window.confirm('WARNING: Restoring will overwrite all current data. This cannot be undone. Are you sure?')) {
            return;
        }

        setRestoreLoading(true);
        try {
            const result = await window.api.restoreDatabase();
            if (result.success) {
                alert('Database restored successfully. The application will now reload.');
            } else if (result.error !== 'Restore cancelled') {
                alert('Restore failed: ' + result.error);
            }
        } catch (error) {
            console.error('Restore error:', error);
            alert('An error occurred during restore');
        } finally {
            setRestoreLoading(false);
        }
    };

    const handleFullInventoryExport = async () => {
        try {
            setIsFullExporting(true);
            const response = await window.api.getProducts({ page: 1, limit: 1000000 });
            const exportData = response.data || [];

            if (exportData.length === 0) {
                alert("No inventory data found.");
                return;
            }

            const headers = ["ID", "SKU", "Name", "Category", "Cost Price", "Selling Price", "Stock Quantity", "Reorder Level", "Description"];
            const rows = exportData.map(p => [
                p.id || '',
                p.sku || '',
                p.name || '',
                p.category_name || p.category || 'Uncategorized',
                p.cost_price || 0,
                p.selling_price || 0,
                p.stock_quantity || 0,
                p.reorder_level || 0,
                p.description || ''
            ]);

            const csvContent = [
                headers.join(","),
                ...rows.map(row => row.map(value => `"${value}"`).join(","))
            ].join("\n");

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `full_inventory_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Full export failed", error);
            alert("Failed to export full inventory.");
        } finally {
            setIsFullExporting(false);
        }
    };

    const handleDeleteAllProducts = async () => {
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteAll = async () => {
        setIsDeletingAllProducts(true);
        try {
            const result = await window.api.deleteAllProducts();
            if (result.success) {
                alert("All products have been deleted successfully.");
            } else {
                alert("Failed to delete products: " + result.error);
            }
        } catch (error) {
            console.error("Bulk delete failed", error);
            alert("An error occurred during bulk deletion.");
        } finally {
            setIsDeletingAllProducts(false);
        }
    };

    return (
        <div className="h-full flex flex-col animate-in fade-in duration-500">
            <div className="p-8 pb-4">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 border-b-4 border-primary w-fit pb-1">Settings</h1>
                <p className="text-muted-foreground mt-2 font-medium">Configure and manage your enterprise retail engine.</p>
            </div>

            <div className="flex-1 flex overflow-hidden p-8 pt-4 gap-8">
                {/* Left Sidebar Navigation */}
                <div className="w-64 shrink-0 flex flex-col gap-1">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                                activeTab === cat.id
                                    ? "bg-primary text-white shadow-lg shadow-primary/20 translate-x-1"
                                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            )}
                        >
                            <cat.icon className={cn("h-5 w-5", activeTab === cat.id ? "text-white" : "text-slate-400")} />
                            {cat.label}
                            {cat.id === 'store' && isStoreDirty && <div className="ml-auto h-2 w-2 rounded-full bg-amber-400 shadow-sm" />}
                            {cat.id === 'receipt' && isReceiptDirty && <div className="ml-auto h-2 w-2 rounded-full bg-amber-400 shadow-sm" />}
                        </button>
                    ))}
                </div>

                {/* Right Content Area */}
                <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide">
                    <div className="max-w-4xl space-y-6">
                        {activeTab === 'general' && (
                            <>
                                <Card className="border-none shadow-sm ring-1 ring-slate-200">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Monitor className="h-5 w-5 text-primary" />
                                            Appearance
                                        </CardTitle>
                                        <CardDescription>Customize the application theme.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <RadioGroup value={theme} onValueChange={(v: any) => setTheme(v)} className="grid grid-cols-3 gap-4">
                                            {['light', 'dark', 'system'].map((t) => (
                                                <div key={t}>
                                                    <RadioGroupItem value={t} id={t} className="peer sr-only" />
                                                    <Label
                                                        htmlFor={t}
                                                        className="flex flex-col items-center justify-between rounded-xl border-2 border-slate-100 bg-white p-4 hover:bg-slate-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all cursor-pointer"
                                                    >
                                                        {t === 'light' && <Sun className="mb-3 h-6 w-6 text-orange-500" />}
                                                        {t === 'dark' && <Moon className="mb-3 h-6 w-6 text-blue-500" />}
                                                        {t === 'system' && <Monitor className="mb-3 h-6 w-6 text-slate-500" />}
                                                        <span className="capitalize font-bold text-slate-700">{t}</span>
                                                    </Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm ring-1 ring-slate-200 border-l-4 border-l-primary">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="h-5 w-5 text-primary" />
                                            Customer Tracking
                                        </CardTitle>
                                        <CardDescription>Link customers to sales for loyalty and purchase history.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                            <div>
                                                <p className="font-bold text-slate-900">Enable Customer Tracking</p>
                                                <p className="text-[10px] text-slate-500 font-medium">Allows linking customers to sales for purchase history and marketing.</p>
                                            </div>
                                            <button
                                                disabled={!isOwner}
                                                onClick={() => updateSetting('customer_tracking_enabled', settings.customer_tracking_enabled === 'true' ? 'false' : 'true')}
                                                className={cn(
                                                    "w-10 h-5 rounded-full relative transition-all",
                                                    settings.customer_tracking_enabled === 'true' ? "bg-primary" : "bg-slate-300",
                                                    !isOwner && "opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                <div className={cn(
                                                    "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                                                    settings.customer_tracking_enabled === 'true' ? "right-1" : "left-1"
                                                )} />
                                            </button>
                                        </div>

                                        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex gap-3">
                                            <Zap className="h-5 w-5 text-blue-500 shrink-0" />
                                            <div className="text-xs text-blue-800">
                                                <p className="font-bold uppercase tracking-widest text-[10px] mb-1">What this enables:</p>
                                                <ul className="list-disc list-inside space-y-1 font-medium italic opacity-80">
                                                    <li>Optional customer selection at checkout</li>
                                                    <li>Quick-add new customers without leaving POS</li>
                                                    <li>Unified purchase history in Customer Profiles</li>
                                                    <li>Enhanced returns/refunds via phone lookup</li>
                                                </ul>
                                            </div>
                                        </div>
                                        {!isOwner && (
                                            <p className="text-[10px] text-amber-600 font-bold italic flex items-center gap-1">
                                                <Lock className="h-3 w-3" /> Admin/Owner permission required to change this setting.
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        {activeTab === 'store' && (
                            <Card className="border-none shadow-sm ring-1 ring-slate-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Store className="h-5 w-5 text-primary" />
                                        Store Profile
                                    </CardTitle>
                                    <CardDescription>Public information that appears on receipts and reports.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] uppercase text-slate-400 font-black tracking-widest">Store Name</Label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                className="pl-10 h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-bold"
                                                value={storeForm.storeName}
                                                onChange={(e) => setStoreForm(prev => ({ ...prev, storeName: e.target.value }))}
                                                placeholder="Enter store name"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] uppercase text-slate-400 font-black tracking-widest">Store Address</Label>
                                        <Input
                                            className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-bold"
                                            value={storeForm.storeAddress}
                                            onChange={(e) => setStoreForm(prev => ({ ...prev, storeAddress: e.target.value }))}
                                            placeholder="Enter full address"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[11px] uppercase text-slate-400 font-black tracking-widest">Phone Number</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    className="pl-10 h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-bold"
                                                    value={storeForm.storePhone}
                                                    onChange={(e) => setStoreForm(prev => ({ ...prev, storePhone: e.target.value }))}
                                                    placeholder="Phone"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[11px] uppercase text-slate-400 font-black tracking-widest">Email Address</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    className="pl-10 h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-bold"
                                                    value={storeForm.storeEmail}
                                                    onChange={(e) => setStoreForm(prev => ({ ...prev, storeEmail: e.target.value }))}
                                                    placeholder="Email"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] uppercase text-slate-400 font-black tracking-widest">Tax/Business ID</Label>
                                        <div className="relative">
                                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                className="pl-10 h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-bold"
                                                value={storeForm.taxId}
                                                onChange={(e) => setStoreForm(prev => ({ ...prev, taxId: e.target.value }))}
                                                placeholder="TIN or Business Reg #"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-slate-50/50 border-t p-6">
                                    <Button
                                        className={cn(
                                            "font-bold h-11 px-8 shadow-lg transition-all",
                                            isStoreDirty
                                                ? "bg-primary hover:bg-primary/90 text-white shadow-primary/20"
                                                : "bg-slate-200 text-slate-500 cursor-not-allowed shadow-none"
                                        )}
                                        onClick={handleSaveStore}
                                        disabled={isSavingStore || !isStoreDirty}
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        {isSavingStore ? 'Saving...' : 'Save Store Details'}
                                    </Button>
                                    {isStoreDirty && (
                                        <p className="ml-4 text-xs font-bold text-amber-600 flex items-center gap-1 animate-pulse">
                                            <div className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                                            Unsaved changes
                                        </p>
                                    )}
                                </CardFooter>
                            </Card>
                        )}

                        {activeTab === 'receipt' && (
                            <Card className="border-none shadow-sm ring-1 ring-slate-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ReceiptText className="h-5 w-5 text-primary" />
                                        Receipt Layout
                                    </CardTitle>
                                    <CardDescription>Customize the message printed for customers.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] uppercase text-slate-400 font-black tracking-widest">Receipt Header (e.g. Slogan)</Label>
                                        <Input
                                            className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-bold text-center"
                                            value={receiptForm.receiptHeader}
                                            onChange={(e) => setReceiptForm(prev => ({ ...prev, receiptHeader: e.target.value }))}
                                            placeholder="WELCOME TO OUR STORE"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] uppercase text-slate-400 font-black tracking-widest">Receipt Footer (e.g. Thank You Message)</Label>
                                        <Textarea
                                            className="h-32 bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-bold"
                                            value={receiptForm.receiptFooter}
                                            onChange={(e) => setReceiptForm(prev => ({ ...prev, receiptFooter: e.target.value }))}
                                            placeholder="Enter footer thank you note"
                                        />
                                    </div>
                                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex gap-3">
                                        <TriangleAlert className="h-5 w-5 text-orange-500 shrink-0" />
                                        <p className="text-xs text-orange-800 font-medium">
                                            Formatting Note: These fields are optimized for thermal receipt width (58mm/80mm). Keep text concise for maximum impact.
                                        </p>
                                    </div>

                                    <div className="pt-4 border-t space-y-4">
                                        <Label className="text-[11px] uppercase text-slate-400 font-black tracking-widest">Display Preferences</Label>
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">Show Cashier Name</p>
                                                <p className="text-[10px] text-slate-500 font-medium">Include the name of the person processing the sale.</p>
                                            </div>
                                            <button
                                                onClick={() => updateSetting('showCashierName', settings.showCashierName === 'true' ? 'false' : 'true')}
                                                className={cn(
                                                    "w-10 h-5 rounded-full relative transition-all",
                                                    settings.showCashierName === 'true' ? "bg-primary" : "bg-slate-300"
                                                )}
                                            >
                                                <div className={cn(
                                                    "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                                                    settings.showCashierName === 'true' ? "right-1" : "left-1"
                                                )} />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">Show Store Email</p>
                                                <p className="text-[10px] text-slate-500 font-medium">Display your business email for customer support.</p>
                                            </div>
                                            <button
                                                onClick={() => updateSetting('showStoreEmail', settings.showStoreEmail === 'true' ? 'false' : 'true')}
                                                className={cn(
                                                    "w-10 h-5 rounded-full relative transition-all",
                                                    settings.showStoreEmail === 'true' ? "bg-primary" : "bg-slate-300"
                                                )}
                                            >
                                                <div className={cn(
                                                    "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                                                    settings.showStoreEmail === 'true' ? "right-1" : "left-1"
                                                )} />
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-slate-50/50 border-t p-6">
                                    <Button
                                        className={cn(
                                            "font-bold h-11 px-8 shadow-lg transition-all",
                                            isReceiptDirty
                                                ? "bg-primary hover:bg-primary/90 text-white shadow-primary/20"
                                                : "bg-slate-200 text-slate-500 cursor-not-allowed shadow-none"
                                        )}
                                        onClick={handleSaveReceipt}
                                        disabled={isSavingReceipt || !isReceiptDirty}
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        {isSavingReceipt ? 'Saving...' : 'Save Receipt Layout'}
                                    </Button>
                                    {isReceiptDirty && (
                                        <p className="ml-4 text-xs font-bold text-amber-600 flex items-center gap-1 animate-pulse">
                                            <div className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                                            Unsaved changes
                                        </p>
                                    )}
                                </CardFooter>
                            </Card>
                        )}

                        {activeTab === 'users' && <UserManagement />}

                        {activeTab === 'license' && (
                            <div className="space-y-6">
                                {license && new Date(license.expires_at).getTime() - Date.now() < 14 * 24 * 60 * 60 * 1000 && (
                                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-between animate-in slide-in-from-top duration-500">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-orange-100 rounded-xl flex items-center justify-center">
                                                <AlertTriangle className="h-5 w-5 text-orange-600" />
                                            </div>
                                            <div>
                                                <p className="font-black text-orange-900 text-sm">Action Required: Expiration Warning</p>
                                                <p className="text-xs text-orange-700/80 font-medium">Your license expires in {Math.max(0, Math.ceil((new Date(license.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days. Renew now to avoid feature restrictions.</p>
                                            </div>
                                        </div>
                                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white font-black">Renew License</Button>
                                    </div>
                                )}

                                <Card className="border-none shadow-sm ring-1 ring-slate-200">
                                    <CardHeader className="border-b bg-slate-50/30">
                                        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500">
                                            <ShieldCheck className="h-4 w-4" />
                                            License Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="grid grid-cols-1 divide-y divide-slate-100">
                                            {[
                                                { label: 'Plan', value: `${license?.plan_type || 'LITE'} Edition`, bold: true },
                                                {
                                                    label: 'Status',
                                                    value: (
                                                        <Badge className={cn(
                                                            "font-black",
                                                            license?.is_active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-500 hover:bg-slate-100"
                                                        )}>
                                                            {license?.is_active ? '✅ ACTIVE' : 'INACTIVE'}
                                                        </Badge>
                                                    )
                                                },
                                                { label: 'Licensed To', value: license?.shop_name || 'Unregistered' },
                                                { label: 'License Key', value: license?.license_key ? `XXXX-XXXX-XXXX-${license.license_key.split('-').pop()}` : 'Not Activated', mono: true },
                                                { label: 'Machine ID', value: machineId || 'Unknown', mono: true },
                                                { label: 'Activated On', value: license?.activated_at ? new Date(license.activated_at).toLocaleDateString() : 'N/A' },
                                                { label: 'Expires On', value: license?.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'Never' },
                                            ].map((item, idx) => (
                                                <div key={idx} className="flex items-center p-6 gap-8">
                                                    <span className="w-48 text-[11px] uppercase font-black text-slate-400 tracking-widest">{item.label}</span>
                                                    <div className={cn(
                                                        "text-sm font-medium text-slate-900",
                                                        item.bold && "font-black text-primary text-base",
                                                        item.mono && "font-mono bg-slate-50 px-2 py-0.5 rounded border"
                                                    )}>
                                                        {item.value}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="bg-slate-50/50 border-t p-6 gap-3">
                                        <Button
                                            className="font-black"
                                            variant="outline"
                                            onClick={() => setIsActivationModalOpen(true)}
                                        >
                                            Change License
                                        </Button>
                                        {license?.is_active && (
                                            <Button
                                                variant="ghost"
                                                className="text-red-500 font-bold hover:bg-red-50 hover:text-red-600"
                                                onClick={async () => {
                                                    if (window.confirm('Are you sure you want to deactivate this license? This will remove all Pro and enterprise features.')) {
                                                        await window.api.deactivateLicense();
                                                        refreshSettings();
                                                    }
                                                }}
                                            >
                                                Deactivate
                                            </Button>
                                        )}
                                        <Button className="ml-auto bg-primary hover:bg-primary/90 text-white font-black px-6 shadow-lg shadow-primary/20">Upgrade Plan</Button>
                                    </CardFooter>
                                </Card>

                                <Card className="border-none shadow-sm ring-1 ring-slate-200">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400">
                                            <Zap className="h-4 w-4" />
                                            Plan Features
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-y-4 gap-x-12">
                                            {[
                                                { feature: 'POS Sales', key: 'basic_pos' },
                                                { feature: 'Refunds & Voids', key: 'refunds' },
                                                { feature: 'Product Variations', key: 'variations' },
                                                { feature: 'Hire Purchase', key: 'hire_purchase' },
                                                { feature: 'Advanced Reports', key: 'advanced_reports' },
                                                { feature: 'Audit Logs', key: 'audit_logs' },
                                            ].map((f, idx) => {
                                                const unlocked = hasFeature(f.key);
                                                return (
                                                    <div key={idx} className={cn("flex items-center gap-3 transition-opacity", !unlocked && "opacity-40 grayscale")}>
                                                        <div className={cn(
                                                            "h-5 w-5 rounded-full flex items-center justify-center",
                                                            unlocked ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                                                        )}>
                                                            {unlocked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-700">{f.feature}</span>
                                                        {!unlocked && <Badge variant="outline" className="text-[9px] font-black h-4 px-1 leading-none ml-auto">PRO ONLY</Badge>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>

                                <ActivationModal
                                    isOpen={isActivationModalOpen}
                                    onClose={() => setIsActivationModalOpen(false)}
                                    onActivate={async (key) => {
                                        // Mock activation - in real app would pick plan from key
                                        await window.api.activateLicense({
                                            licenseKey: key,
                                            planType: 'PRO',
                                            shopName: settings.storeName || 'My Shop'
                                        });
                                        refreshSettings();
                                    }}
                                />
                            </div>
                        )}

                        {activeTab === 'data' && (
                            <Card className="border-none shadow-sm ring-1 ring-slate-200 border-l-4 border-l-blue-500">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Database className="h-5 w-5 text-blue-500" />
                                        Data Management
                                    </CardTitle>
                                    <CardDescription>Backup, restore, and maintenance.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex items-start gap-4">
                                        <TriangleAlert className="h-6 w-6 text-blue-600 shrink-0 mt-1" />
                                        <div>
                                            <p className="font-black text-blue-900 uppercase text-xs tracking-widest">System Integrity</p>
                                            <p className="text-sm text-blue-700/80 font-medium mt-1">
                                                Regular backups protect against hardware failure. We recommend off-site storage for your `.sqlite` backup files.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Button
                                            onClick={handleBackup}
                                            disabled={backUpLoading || restoreLoading}
                                            className="h-24 flex-col gap-2 rounded-2xl border-2 border-slate-100 bg-white hover:bg-slate-50 text-slate-900 font-black shadow-sm"
                                            variant="outline"
                                        >
                                            <Download className="h-6 w-6 text-blue-500" />
                                            {backUpLoading ? 'Creating...' : 'Backup Database'}
                                        </Button>

                                        <Button
                                            onClick={handleRestore}
                                            disabled={backUpLoading || restoreLoading}
                                            className="h-24 flex-col gap-2 rounded-2xl border-2 border-slate-100 bg-white hover:bg-red-50 text-slate-900 font-black shadow-sm hover:text-red-900 hover:border-red-200"
                                            variant="outline"
                                        >
                                            <Upload className="h-6 w-6 text-red-500" />
                                            {restoreLoading ? 'Restoring...' : 'Restore Database'}
                                        </Button>

                                        <Button
                                            onClick={handleOpenDataFolder}
                                            className="h-24 flex-col gap-2 rounded-2xl border-2 border-slate-100 bg-white hover:bg-slate-50 text-slate-900 font-black shadow-sm"
                                            variant="outline"
                                        >
                                            <Database className="h-6 w-6 text-emerald-500" />
                                            Open Data Folder
                                        </Button>

                                        <Button
                                            onClick={handleOpenExportsFolder}
                                            className="h-24 flex-col gap-2 rounded-2xl border-2 border-slate-100 bg-white hover:bg-slate-50 text-slate-900 font-black shadow-sm"
                                            variant="outline"
                                        >
                                            <FileText className="h-6 w-6 text-amber-500" />
                                            Open Exports
                                        </Button>

                                        <Button
                                            onClick={handleFullInventoryExport}
                                            disabled={isFullExporting}
                                            className="h-24 flex-col gap-2 rounded-2xl border-2 border-slate-100 bg-white hover:bg-blue-50 text-slate-900 font-black shadow-sm hover:text-blue-900 hover:border-blue-200"
                                            variant="outline"
                                        >
                                            {isFullExporting ? <Loader2 className="h-6 w-6 text-primary animate-spin" /> : <Package className="h-6 w-6 text-primary" />}
                                            {isFullExporting ? 'Exporting...' : 'Export Inventory'}
                                        </Button>

                                        <Button
                                            onClick={handleDeleteAllProducts}
                                            disabled={isDeletingAllProducts}
                                            className="h-24 flex-col gap-2 rounded-2xl border-2 border-red-100 bg-red-50 hover:bg-red-100 text-red-900 font-black shadow-sm border-dashed"
                                            variant="outline"
                                        >
                                            {isDeletingAllProducts ? <Loader2 className="h-6 w-6 text-red-600 animate-spin" /> : <AlertTriangle className="h-6 w-6 text-red-600" />}
                                            {isDeletingAllProducts ? 'Deleting...' : 'Clear All Products'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'security' && (
                            <Card className="border-none shadow-sm ring-1 ring-slate-200 border-l-4 border-l-amber-500">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-amber-500" />
                                        Security & Access
                                    </CardTitle>
                                    <CardDescription>Protect your POS operations.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4 opacity-50 grayscale pointer-events-none">
                                        {[
                                            { label: 'Require Admin PIN for Refunds', desc: 'Prevents unauthorized payouts.' },
                                            { label: 'Manager Approval for Voids', desc: 'Track every deleted item.' },
                                            { label: 'Auto-Lock Screen', desc: 'Secure terminal during inactivity.' }
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                                <div>
                                                    <p className="font-bold text-slate-900">{item.label}</p>
                                                    <p className="text-xs text-slate-500">{item.desc}</p>
                                                </div>
                                                <Badge variant="outline" className="font-black text-[10px]">COMING SOON</Badge>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-center text-xs text-slate-400 font-bold italic">Enterprise security modules are being finalized for your region.</p>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'about' && (
                            <div className="space-y-6">
                                <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden bg-slate-900 text-white">
                                    <div className="p-8 relative">
                                        <div className="relative z-10">
                                            <h2 className="text-4xl font-black tracking-tighter mb-2">FasTo <span className="text-primary italic">RMS</span></h2>
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Enterprise Station Edition</p>
                                            <div className="mt-8 flex gap-8">
                                                <div>
                                                    <p className="text-[10px] text-slate-500 font-black uppercase">Version</p>
                                                    <p className="font-bold text-lg">{appInfo.version}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-500 font-black uppercase">License</p>
                                                    <p className="font-bold text-lg">{license?.plan_type || 'Lite Edition'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-500 font-black uppercase">Station ID</p>
                                                    <div className="font-bold text-lg text-emerald-400 flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                                        {machineId?.split('-').pop() || 'Unknown'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <Monitor className="absolute -bottom-10 -right-10 h-64 w-64 text-slate-800 opacity-50 rotate-12" />
                                    </div>
                                </Card>

                                <Card className="border-none shadow-sm ring-1 ring-slate-200">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">System Environment</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 font-mono text-xs">
                                        <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center group">
                                            <span className="text-slate-400">Database Path</span>
                                            <span className="text-slate-900 font-bold break-all ml-4 group-hover:text-primary transition-colors cursor-default text-right">{appInfo.dbPath}</span>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                                            <span className="text-slate-400">Database Backups</span>
                                            <span className="text-slate-900 font-bold">Manual via Export</span>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                                            <span className="text-slate-400">Storage Engine</span>
                                            <span className="text-slate-900 font-bold uppercase">SQLite 3 / Electron</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ActivationModal
                isOpen={isActivationModalOpen}
                onClose={() => setIsActivationModalOpen(false)}
                onActivate={async (key) => {
                    await window.api.activateLicense({
                        licenseKey: key,
                        planType: 'enterprise',
                        shopName: settings.storeName || 'FasTo RMS User'
                    });
                    await refreshSettings();
                }}
            />

            <DeleteAllProductsModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDeleteAll}
            />
        </div>
    );
}

