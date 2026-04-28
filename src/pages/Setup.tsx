import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, User, ArrowRight, Loader2, CheckCircle2, MapPin, Phone, ShieldCheck } from 'lucide-react';
import logoFull from '@/assets/logo_full.png';

export default function Setup() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        shopName: '',
        shopPhone: '',
        shopAddress: '',
        username: 'admin',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const nextStep = () => {
        if (step === 2 && !formData.shopName) {
            return;
        }
        setStep(prev => prev + 1);
    };

    const prevStep = () => setStep(prev => prev - 1);

    const handleFinish = async () => {
        if (!formData.username || !formData.password) {
            alert("Username and Password are required");
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const result = await window.api.initializeSetup({
                shopName: formData.shopName,
                shopPhone: formData.shopPhone,
                shopAddress: formData.shopAddress,
                username: formData.username,
                password: formData.password
            });

            if (result.success) {
                setIsSuccess(true);
                // Wait for a bit to show success state before redirecting
                setTimeout(() => {
                    navigate('/login');
                    window.location.reload();
                }, 2000);
            } else {
                alert("Setup failed: " + result.error);
                setLoading(false);
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred during setup.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 overflow-hidden relative font-sans">
            {/* Elegant Background Accents */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-100/50 -skew-x-12 transform origin-top-right transition-all duration-700" />

            <div className="w-full max-w-xl relative">

                <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative z-10 overflow-hidden bg-white">
                    <div className="h-1.5 w-full bg-[#1e1b4b]" />
                    {isSuccess ? (
                        <CardContent className="py-16 text-center animate-scale-in">
                            <div className="mx-auto mb-10">
                                <img
                                    src={logoFull}
                                    alt="FasTo RMS"
                                    className="h-24 w-auto mx-auto animate-bounce drop-shadow-2xl"
                                />
                            </div>
                            <h2 className="text-4xl font-bold text-[#1e1b4b] mb-3 tracking-tight">You're All Set!</h2>
                            <p className="text-muted-foreground text-lg mb-8 font-medium">
                                Welcome to the FasTo family.
                                <br />Redirecting to your new enterprise station...
                            </p>
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                        </CardContent>
                    ) : (
                        <>
                            {step === 1 && (
                                <div className="animate-fade-in-up">
                                    <CardHeader className="text-center pt-10 pb-6">
                                        <div className="flex justify-center mb-6">
                                            <img
                                                src={logoFull}
                                                alt="FasTo RMS"
                                                className="h-16 w-auto animate-in fade-in zoom-in-95 duration-700"
                                            />
                                        </div>
                                        <CardTitle className="text-4xl font-bold tracking-tight text-[#1e1b4b]">Welcome to FasTo RMS</CardTitle>
                                        <CardDescription className="text-lg pt-2 text-slate-500">
                                            The professional enterprise solution for modern retail.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6 px-10">
                                        <div className="grid grid-cols-1 gap-4 py-4">
                                            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                                <div className="bg-indigo-100 p-2 rounded-lg"><Store className="h-5 w-5 text-[#1e1b4b]" /></div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-900">Business Intelligence</h4>
                                                    <p className="text-sm text-slate-500 font-medium">Detailed reports and stock tracking at your fingertips.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                                <div className="bg-indigo-100 p-2 rounded-lg"><ShieldCheck className="h-5 w-5 text-[#1e1b4b]" /></div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-900">Enterprise Security</h4>
                                                    <p className="text-sm text-slate-500 font-medium">Secure daily backups and audit logs for peace of mind.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pb-10 px-10">
                                        <Button className="w-full h-12 text-lg font-bold bg-[#1e1b4b] hover:bg-[#312e81] shadow-lg shadow-indigo-900/10 group" onClick={nextStep}>
                                            Get Started <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                        </Button>
                                    </CardFooter>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="animate-fade-in-up">
                                    <CardHeader className="pt-10 pb-6">
                                        <div className="flex justify-center mb-4">
                                            <img src={logoFull} alt="FasTo RMS" className="h-10 w-auto opacity-80" />
                                        </div>
                                        <CardTitle className="text-2xl font-bold">Shop Profile</CardTitle>
                                        <CardDescription>Tell us about your business</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-5 px-10">
                                        <div className="space-y-2">
                                            <Label htmlFor="shopName" className="flex items-center gap-2">
                                                <Store className="h-4 w-4 text-primary" /> Shop Name <span className="text-ghana-red">*</span>
                                            </Label>
                                            <Input id="shopName" placeholder="e.g. FasTo Store" value={formData.shopName} onChange={handleChange} className="h-11" autoFocus />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="shopPhone" className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-primary" /> Phone Number
                                            </Label>
                                            <Input id="shopPhone" placeholder="054 123 4567" value={formData.shopPhone} onChange={handleChange} className="h-11" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="shopAddress" className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-primary" /> Location
                                            </Label>
                                            <Input id="shopAddress" placeholder="Accra, Ghana" value={formData.shopAddress} onChange={handleChange} className="h-11" />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex gap-3 pb-10 px-10">
                                        <Button variant="ghost" onClick={prevStep} className="h-12 px-6 text-slate-500">Back</Button>
                                        <Button className="flex-1 h-12 text-lg font-bold bg-[#1e1b4b] hover:bg-[#312e81]" onClick={nextStep} disabled={!formData.shopName}>
                                            Next <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </CardFooter>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="animate-fade-in-up">
                                    <CardHeader className="pt-10 pb-6">
                                        <div className="flex justify-center mb-4">
                                            <img src={logoFull} alt="FasTo RMS" className="h-10 w-auto opacity-80" />
                                        </div>
                                        <CardTitle className="text-2xl font-bold">Account Setup</CardTitle>
                                        <CardDescription>Create your administrator credentials</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-5 px-10">
                                        <div className="bg-primary/5 p-3 rounded-lg text-sm text-primary mb-2 flex gap-3 border border-primary/10">
                                            <User className="h-5 w-5 shrink-0 mt-0.5" />
                                            <p>This will be your <strong>Owner</strong> account. You will have full access to all features.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="username">Username</Label>
                                            <Input id="username" placeholder="admin" value={formData.username} onChange={handleChange} className="h-11" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="password">Password</Label>
                                                <Input id="password" type="password" value={formData.password} onChange={handleChange} className="h-11" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="confirmPassword">Confirm</Label>
                                                <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} className="h-11" />
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex gap-3 pb-10 px-10">
                                        <Button variant="ghost" onClick={prevStep} className="h-12 px-6 text-slate-500">Back</Button>
                                        <Button className="flex-1 h-12 text-lg font-bold bg-[#1e1b4b] hover:bg-[#312e81]" onClick={nextStep} disabled={!formData.password || formData.password !== formData.confirmPassword}>
                                            Almost Done <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </CardFooter>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="animate-fade-in-up">
                                    <CardHeader className="text-center pt-10 pb-6">
                                        <div className="flex justify-center mb-4">
                                            <img src={logoFull} alt="FasTo RMS" className="h-10 w-auto opacity-80" />
                                        </div>
                                        <CardTitle className="text-2xl font-bold">Review & Finish</CardTitle>
                                        <CardDescription>Ready to launch {formData.shopName}?</CardDescription>
                                    </CardHeader>
                                    <CardContent className="px-10 pb-6">
                                        <div className="rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 p-4 space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Shop Name:</span>
                                                <span className="font-semibold">{formData.shopName}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Location:</span>
                                                <span className="font-semibold">{formData.shopAddress || 'Not specified'}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Admin User:</span>
                                                <span className="font-semibold text-ghana-green">{formData.username}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex gap-3 pb-10 px-10">
                                        <Button variant="ghost" onClick={prevStep} className="h-12 px-6 text-slate-500" disabled={loading}>Back</Button>
                                        <Button className="flex-1 h-12 text-lg font-bold bg-[#1e1b4b] hover:bg-[#312e81] text-white" onClick={handleFinish} disabled={loading}>
                                            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
                                            Launch FasTo RMS
                                        </Button>
                                    </CardFooter>
                                </div>
                            )}
                        </>
                    )}
                    {/* Brand Footer */}
                    <div className="py-3 px-6 bg-slate-50/80 border-t border-slate-100 text-center">
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest leading-relaxed">
                            FasTo RMS &bull; Version 1.0.0 &bull; Secure Enterprise Retail Platform
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
