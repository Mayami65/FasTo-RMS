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
    UserCircle,
    Tag
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { useFeatures } from '@/hooks/useFeatures';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function TopMenuBar() {
    const location = useLocation();
    const { user, logout, isOwner } = useAuth();
    const { hasHirePurchase, hasAdvancedReports, hasRefunds } = useFeatures();

    const menuItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/pos', label: 'POS', icon: ShoppingCart },
        { path: '/inventory', label: 'Inventory', icon: Package },
        { path: '/customers', label: 'Customers', icon: Users },
        // Conditional Hire Purchase
        ...(hasHirePurchase ? [{ path: '/hire-purchase', label: 'Hire Purchase', icon: CreditCard }] : []),
        // Owner only items
        ...(isOwner ? [
            { path: '/marketing', label: 'Marketing', icon: Tag },
            ...(hasAdvancedReports ? [{ path: '/reports', label: 'Reports', icon: BarChart3 }] : []),
            ...(hasRefunds ? [{ path: '/refunds', label: 'Refunds', icon: RotateCcw }] : []),
            { path: '/audit', label: 'Audit', icon: ShieldAlert },
            { path: '/settings', label: 'Settings', icon: Settings },
        ] : [])
    ];

    return (
        <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 shadow-sm sticky top-0 z-50">
            <div className="flex items-center h-14 px-4">
                {/* App Branding */}
                {/* <div className="flex items-center gap-3 mr-8">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <span className="text-white font-bold text-sm">FT</span>
                    </div>
                    <h1 className="hidden md:block text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
                        FasTo RMS
                    </h1>
                </div> */}

                {/* Navigation Menu */}
                <nav className="flex items-center gap-1 flex-1 overflow-x-auto no-scrollbar mask-gradient">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path ||
                            (item.path !== '/' && location.pathname.startsWith(item.path));

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap
                  transition-all duration-200
                  ${isActive
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white'
                                    }
                `}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Right side - User & Theme */}
                <div className="flex items-center gap-2 ml-4">
                    <ThemeToggle />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <UserCircle className="h-6 w-6" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user?.username}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user?.role === 'OWNER' ? 'Administrator' : 'Shop Representative'}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout} className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
