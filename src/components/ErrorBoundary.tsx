import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-100 p-8 text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="h-8 w-8 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h1>
                        <p className="text-slate-500 mb-8">
                            The application encountered an unexpected error. We've logged the details and you can try refreshing.
                        </p>

                        {this.state.error && (
                            <div className="bg-slate-50 rounded-lg p-4 mb-8 text-left overflow-auto max-h-32">
                                <code className="text-[10px] text-red-600 font-mono">
                                    {this.state.error.message}
                                </code>
                            </div>
                        )}

                        <Button
                            onClick={() => window.location.reload()}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reload Application
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
