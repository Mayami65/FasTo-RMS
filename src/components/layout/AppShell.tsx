import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Bell, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { GlobalSearch } from './GlobalSearch';

export function AppShell() {
    const location = useLocation();
    const [pageTitle, setPageTitle] = useState('Dashboard');
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Map path to title
    useEffect(() => {
        const path = location.pathname;
        if (path === '/') setPageTitle('Dashboard Overview');
        else if (path === '/pos') setPageTitle('Point of Sale');
        else if (path === '/inventory') setPageTitle('Inventory Management');
        else if (path === '/customers') setPageTitle('Customer Directory');
        else if (path.startsWith('/customers/')) setPageTitle('Customer Details');
        else if (path === '/hire-purchase') setPageTitle('Hire Purchase Agreements');
        else if (path === '/reports') setPageTitle('Business Intelligence');
        else if (path === '/marketing') setPageTitle('Marketing Tools');
        else if (path === '/refunds') setPageTitle('Returns & Refunds');
        else if (path === '/audit') setPageTitle('System Audit Logs');
        else if (path === '/settings') setPageTitle('System Configuration');
    }, [location.pathname]);

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 overflow-hidden font-sans">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Top Bar */}
                <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 z-20 shrink-0">
                    <div className="flex items-center gap-4 flex-1">
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight min-w-[200px]">
                            {pageTitle}
                        </h2>

                        {/* Global Search */}
                        <GlobalSearch />
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Day Status / Clock */}
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200 mr-2">
                            <Clock className="w-4 h-4 text-slate-500" />
                            <span className="text-xs font-mono font-medium text-slate-600">
                                {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} | {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className="h-3 w-[1px] bg-slate-300 mx-1" />
                            <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Day Open</span>
                            </div>
                        </div>

                        <ThemeToggle />

                        <button className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        </button>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-auto bg-slate-50/50 p-6 custom-scrollbar">
                    <div className="max-w-[1600px] mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
