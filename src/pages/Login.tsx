import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, ShieldCheck, Lock, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import logoFull from '@/assets/logo_full.png';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isCapsLockOn, setIsCapsLockOn] = useState(false);
    const [keepMeSignedIn, setKeepMeSignedIn] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const checkCapsLock = (e: React.KeyboardEvent) => {
        if (e.getModifierState('CapsLock')) {
            setIsCapsLockOn(true);
        } else {
            setIsCapsLockOn(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const result = await window.api.login({ username, password });

            if (result.success && result.user) {
                login(result.user);
                navigate('/');
            } else {
                setError(result.error || 'Invalid username or password');
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 overflow-hidden relative font-sans">
            {/* Elegant Background Accents */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-100/50 -skew-x-12 transform origin-top-right transition-all duration-700" />

            <div className="w-full max-w-[420px] relative z-10 animate-scale-in">
                <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden bg-white">
                    {/* Brand Top Line */}
                    <div className="h-1.5 w-full bg-[#1e1b4b]" />

                    <CardHeader className="space-y-0 text-center pt-10 pb-6">
                        <div className="flex justify-center mb-6">
                            <img
                                src={logoFull}
                                alt="FasTo RMS"
                                className="h-16 w-auto animate-in fade-in zoom-in-95 duration-700"
                            />
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold tracking-tight text-[#1e1b4b]">
                                FasTo RMS
                            </h1>
                            <CardDescription className="text-slate-500 font-medium">
                                Sign in to your account
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="pb-8 px-8">
                        <form onSubmit={handleLogin} className="space-y-5">
                            {error && (
                                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700 animate-in fade-in slide-in-from-top-1">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="font-medium text-sm">{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Username
                                </Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={loading}
                                    className="h-11 bg-slate-50/50 border-slate-200 focus:ring-2 focus:ring-[#1e1b4b]/10 focus:border-[#1e1b4b] transition-all"
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" title="Enter Password" className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                    <Lock className="w-3.5 h-3.5" /> Password
                                </Label>
                                <div className="relative group">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyUp={checkCapsLock}
                                        disabled={loading}
                                        className="h-11 pr-10 bg-slate-50/50 border-slate-200 focus:ring-2 focus:ring-[#1e1b4b]/10 focus:border-[#1e1b4b] transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        disabled={loading}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {isCapsLockOn && (
                                    <p className="text-[11px] font-semibold text-amber-600 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                                        <AlertCircle className="w-3 h-3" /> Caps Lock is ON
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-between text-[13px] pt-1">
                                <label className="flex items-center gap-2 cursor-pointer group text-slate-600">
                                    <input
                                        type="checkbox"
                                        checked={keepMeSignedIn}
                                        onChange={(e) => setKeepMeSignedIn(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 text-[#1e1b4b] focus:ring-[#1e1b4b]/20"
                                    />
                                    <span>Keep me signed in</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => alert('Please contact your administrator to reset your password.')}
                                    className="text-[#1e1b4b] font-semibold hover:underline"
                                >
                                    Forgot password?
                                </button>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 bg-[#1e1b4b] hover:bg-[#312e81] text-white font-bold text-base shadow-lg shadow-indigo-900/10 transition-all flex items-center justify-center gap-2"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Authenticating...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sign In</span>
                                        <CheckCircle2 className="h-4 w-4 opacity-70" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>

                    <div className="py-3 px-6 bg-slate-50/80 border-t border-slate-100 text-center">
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest leading-relaxed">
                            FasTo RMS &bull; Version 1.0.0 &bull; Secure Enterprise Retail Platform
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Login;

