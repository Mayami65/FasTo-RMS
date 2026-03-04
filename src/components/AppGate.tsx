import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface AppGateProps {
    children: React.ReactNode;
}

export function AppGate({ children }: AppGateProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkStatus();
    }, [location.pathname]);

    const checkStatus = async () => {
        try {
            console.log("AppGate: Checking status...");
            const response = await window.api.checkHasUsers();
            console.log("AppGate: Received response:", response);
            const { hasUsers } = response;

            console.log(`AppGate: hasUsers=${hasUsers}, path=${location.pathname}`);

            // If no users exist, and we are not already on the setup page, go to setup
            if (!hasUsers && location.pathname !== '/setup') {
                console.log("AppGate: Redirecting to /setup");
                navigate('/setup', { replace: true });
                return; // Stop execution to avoid setting loading false immediately if we are navigating
            }
            // If users exist, and we are on the setup page, go to login
            else if (hasUsers && location.pathname === '/setup') {
                console.log("AppGate: Redirecting to /login");
                navigate('/login', { replace: true });
                return;
            }

            console.log("AppGate: No redirect needed.");
            setLoading(false);

        } catch (error) {
            console.error("Failed to check app status:", error);
            setLoading(false); // Ensure we don't get stuck on loading if error
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">Initializing FasTo...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-700 h-full w-full">
            {children}
        </div>
    );
}
