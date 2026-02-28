import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    CreditCard,
    BarChart3,
    RotateCcw,
    Settings,
    ShieldAlert,
    LogOut,
    Tag,
    ChevronLeft,
    ChevronRight,
    List
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFeatures } from '@/hooks/useFeatures';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function Sidebar() {
    const location = useLocation();
    const { user, logout, isOwner } = useAuth();
    const { hasHirePurchase, hasAdvancedReports, hasRefunds, hasAuditLogs } = useFeatures();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const menuItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/pos', label: 'POS', icon: ShoppingCart },
        { path: '/inventory', label: 'Inventory', icon: Package },
        { path: '/customers', label: 'Customers', icon: Users },
        { path: '/sales', label: 'Sales', icon: List },
        ...(hasHirePurchase ? [{ path: '/hire-purchase', label: 'Hire Purchase', icon: CreditCard }] : []),
        ...(isOwner ? [
            { path: '/marketing', label: 'Marketing', icon: Tag },
            ...(hasAdvancedReports ? [{ path: '/reports', label: 'Reports', icon: BarChart3 }] : []),
            ...(hasRefunds ? [{ path: '/refunds', label: 'Refunds', icon: RotateCcw }] : []),
            ...(hasAuditLogs ? [{ path: '/audit', label: 'Audit', icon: ShieldAlert }] : []),
            { path: '/settings', label: 'Settings', icon: Settings },
        ] : [])
    ];

    return (
        <aside
            className={cn(
                "relative flex flex-col h-screen bg-white border-r border-slate-200 transition-all duration-300 z-30 shadow-sm",
                isCollapsed ? "w-16" : "w-64"
            )}
        >
            {/* Logo area */}
            <div className="flex items-center h-16 px-4 border-b border-slate-100">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-primary-foreground font-bold text-sm">FT</span>
                    </div>
                    {!isCollapsed && (
                        <h1 className="text-base font-bold text-slate-900 tracking-tight truncate">
                            FasTo RMS
                        </h1>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1 custom-scrollbar">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path ||
                        (item.path !== '/' && location.pathname.startsWith(item.path));

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            title={isCollapsed ? item.label : ""}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                                isActive
                                    ? "bg-primary/10 text-primary font-semibold"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-primary" : "text-slate-500 group-hover:text-slate-700")} />
                            {!isCollapsed && <span className="text-sm truncate">{item.label}</span>}
                            {isActive && !isCollapsed && (
                                <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <div className={cn("flex flex-col gap-3", isCollapsed ? "items-center" : "")}>
                    {!isCollapsed && (
                        <div className="flex flex-col">
                            <p className="text-sm font-semibold text-slate-900 truncate">{user?.username}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] uppercase font-bold tracking-wider bg-slate-200 text-slate-700">
                                    {user?.role === 'OWNER' ? 'Admin' : 'Rep'}
                                </Badge>
                                <span className="flex h-2 w-2 rounded-full bg-green-500" title="System Online" />
                            </div>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size={isCollapsed ? "icon" : "sm"}
                        onClick={logout}
                        className={cn(
                            "w-full flex items-center justify-start gap-3 text-slate-600 hover:text-red-600 hover:bg-red-50 py-2",
                            isCollapsed ? "justify-center p-0" : ""
                        )}
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
                    </Button>
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-20 bg-white border border-slate-200 rounded-full p-1 shadow-sm hover:bg-slate-50 focus:outline-none transition-transform hover:scale-110"
            >
                {isCollapsed ? <ChevronRight className="w-4 h-4 text-slate-600" /> : <ChevronLeft className="w-4 h-4 text-slate-600" />}
            </button>
        </aside>
    );
}
