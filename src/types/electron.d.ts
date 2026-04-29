
// Define the shape of the API exposed to the renderer
import { Product, Category } from './product';
import { Discount } from './sale';

// Define the shape of the API exposed to the renderer
export interface IElectronAPI {
    // Test function
    ping: () => Promise<string>;

    // Database functions
    getProducts: (params?: { page?: number; limit?: number; search?: string; categoryId?: number | 'none' | null; stockStatus?: 'all' | 'low_stock' | 'out_of_stock' | 'in_stock'; tripName?: string }) => Promise<{ data: Product[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>;
    addProduct: (product: Product) => Promise<{ success: boolean; id?: number; error?: string }>;
    updateProduct: (product: Product) => Promise<{ success: boolean; error?: string }>;
    deleteProduct: (id: number) => Promise<{ success: boolean; error?: string }>;
    deleteAllProducts: () => Promise<{ success: boolean; error?: string }>;

    // Stock
    adjustStock: (data: { productId: number; quantityChange: number; reason: string; notes?: string }) => Promise<{ success: boolean; error?: string }>;
    getStockMovements: (productId: number) => Promise<any[]>;

    // Sales
    processSale: (data: any) => Promise<{ success: boolean; saleId?: number; error?: string }>;
    updateSale: (data: any) => Promise<{ success: boolean; saleId?: number; totalAmount?: number; error?: string }>;
    getSaleDetails: (saleId: number) => Promise<any | null>;
    searchSalesByPhone: (phone: string) => Promise<any[]>;
    searchSalesByCustomerName: (name: string) => Promise<any[]>;
    holdSale: (data: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    getHeldSales: () => Promise<any[]>;
    deleteHeldSale: (id: number) => Promise<{ success: boolean; error?: string }>;

    // Customers
    getCustomers: (params?: { page?: number; limit?: number; search?: string }) => Promise<{ data: any[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>;
    getRecentCustomers: (params?: { limit?: number }) => Promise<any[]>;
    addCustomer: (data: any) => Promise<{ success: boolean; id: number; error?: string }>;
    updateCustomer: (customer: any) => Promise<{ success: boolean; error?: string }>;
    checkCustomerExists: (phone: string) => Promise<any | null>;
    getCustomerDetails: (id: number) => Promise<{ customer: any; agreements: any[] } | null>;
    addInstallment: (data: { agreementId: number; amount: number; notes?: string; nextPaymentDate?: string; userId?: number }) => Promise<{ success: boolean; error?: string }>;
    getSaleForRefund: (saleId: number) => Promise<{ sale: any; items: any[]; refunded_total: number } | null>;
    processRefund: (data: { saleId: number; reason: string; userId?: number; items: { saleItemId: number; quantity: number }[] }) => Promise<{ success: boolean; refundId?: number; refundAmount?: number; error?: string }>;
    getRefunds: (params: { page?: number; limit?: number; search?: string }) => Promise<{ data: any[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>;
    getHPSummary: () => Promise<{ total_active_agreements: number; total_debt: number; overdue_count: number; recent_payments: any[] } | null>;
    getHirePurchaseAgreements: (filter: { status?: string, search?: string, page?: number, limit?: number }) => Promise<{ data: any[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>;
    getOverdueAgreements: () => Promise<any[]>;

    // Analytics Dashboard
    getExecutiveOverview: (range: { startDate: string; endDate: string; compare?: string; storeId?: string }) => Promise<any>;
    getCustomerIntelligence: (range: { startDate: string; endDate: string; compare?: string; storeId?: string }) => Promise<any>;
    getProductIntelligence: (range: { startDate: string; endDate: string; compare?: string; storeId?: string }) => Promise<any>;
    getOperationalIntelligence: (range: { startDate: string; endDate: string; compare?: string; storeId?: string }) => Promise<any>;

    // Bulk Import
    downloadTemplate: () => Promise<any>;
    selectExcelFile: () => Promise<string | null>;
    importProducts: (filePath: string, tripName?: string) => Promise<{ success: boolean; summary?: any; error?: string }>;
    getTripNames: () => Promise<string[]>;
    getDailySummary: (date: string) => Promise<any>;
    closeDayTransactions: (data: { date: string, summary: any, notes: string, userId?: number }) => Promise<{ success: boolean; error?: string }>;
    getClosingHistory: () => Promise<any[]>;
    backupDatabase: () => Promise<{ success: boolean; path?: string; error?: string }>;
    restoreDatabase: () => Promise<{ success: boolean; error?: string }>;
    getAuditLogs: (params?: any) => Promise<any>;
    login: (credentials: { username: string; password: string }) => Promise<{ success: boolean; user?: any; error?: string }>;
    getUsers: () => Promise<any[]>;
    createUser: (user: { username: string; password: string; role: string }) => Promise<{ success: boolean; id?: number; error?: string }>;
    deleteUser: (id: number) => Promise<{ success: boolean; error?: string }>;
    resetUserPassword: (data: { id: number; newPassword: string }) => Promise<{ success: boolean; error?: string }>;
    getAppInfo: () => Promise<{ version: string; dbPath: string }>;
    openDataFolder: () => Promise<{ success: boolean; error?: string }>;
    openExportsFolder: () => Promise<{ success: boolean; error?: string }>;

    // Setup Functions
    checkHasUsers: () => Promise<{ hasUsers: boolean; error?: string }>;
    initializeSetup: (payload: {
        shopName: string;
        shopPhone?: string;
        shopAddress?: string;
        username: string;
        password: string;
    }) => Promise<{ success: boolean; error?: string }>;
    getSalesReport: (params: { startDate: string; endDate: string; page?: number; limit?: number; search?: string }) => Promise<{ sales: any[]; summary: any; pagination: { total: number; page: number; limit: number; totalPages: number } }>;
    getTopProducts: (limit?: number) => Promise<any[]>;
    getDashboardStats: () => Promise<{ todayRevenue: number; todayTransactions: number; revenueTrend: number; transactionsTrend: number; activeAgreements: number; lowStockCount: number } | null>;
    getDailySalesChart: (days?: number) => Promise<any[]>;
    getInventorySummary: () => Promise<{
        totalProducts: number;
        totalStock: number;
        totalValue: number;
        lowStockCount: number;
        outOfStockCount: number;
    }>;
    getCategories: () => Promise<Category[]>;
    addCategory: (category: any) => Promise<{ success: boolean; id?: number; error?: string }>;
    updateCategory: (category: any) => Promise<{ success: boolean; error?: string }>;
    deleteCategory: (id: number) => Promise<{ success: boolean; error?: string }>;
    getCategoryPerformance: (params: { startDate: string; endDate: string }) => Promise<any[]>;
    printReceipt: () => Promise<{ success: boolean; error?: string }>;
    getSettings: () => Promise<Record<string, string>>;
    updateSettings: (settings: Record<string, string>) => Promise<{ success: boolean; error?: string }>;

    // Image & Discount Features
    selectProductImage: () => Promise<string | null>;
    getProductImagePath: (fileName: string) => Promise<string | null>;
    getDiscounts: () => Promise<Discount[]>;
    addDiscount: (discount: Partial<Discount>) => Promise<{ success: boolean; id?: number; error?: string }>;
    updateDiscount: (discount: Discount) => Promise<{ success: boolean; error?: string }>;
    deleteDiscount: (id: number) => Promise<{ success: boolean; error?: string }>;

    // License Handlers
    getLicenseStatus: () => Promise<{ license: any | null; machineId: string; isMachineBound: boolean }>;
    activateLicense: (payload: { licenseKey: string; planType: string; shopName: string }) => Promise<{ success: boolean; plan?: string; error?: string }>;
    deactivateLicense: () => Promise<{ success: boolean; error?: string }>;

    // Update Handlers
    checkForUpdates: () => Promise<any>;
    downloadUpdate: () => Promise<{ success: boolean }>;
    installUpdate: () => Promise<{ success: boolean }>;
    listBackups: () => Promise<{
        backups: Array<{
            filename: string;
            path: string;
            sizeBytes: number;
            sizeMB: string;
            createdAt: string;
            createdAtFormatted: string;
        }>;
    }>;
    restoreBackup: (backupPath: string) => Promise<{ success: boolean; message?: string }>;
    deleteBackup: (backupPath: string) => Promise<{ success: boolean; message?: string }>;

    // Update Event Listeners
    onUpdateAvailable: (callback: (data: { version: string; releaseDate?: string; releaseNotes?: string }) => void) => void;
    onUpdateNotAvailable: (callback: () => void) => void;
    onUpdateDownloadProgress: (callback: (progress: number) => void) => void;
    onUpdateDownloaded: (callback: (data: { version: string }) => void) => void;
    onUpdateError: (callback: (error: string) => void) => void;
}

declare global {
    interface Window {
        api: IElectronAPI
    }
}
