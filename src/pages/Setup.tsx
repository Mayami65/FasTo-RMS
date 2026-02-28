import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, User, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export default function Setup() {
    const navigate = useNavigate();
    const [step, setStep] = useState('shop');
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        shopName: '',
        shopPhone: '',
        shopAddress: '',
        username: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleNext = () => {
        if (!formData.shopName) {
            alert("Shop Name is required");
            return;
        }
        setStep('account');
    };

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
                // Determine legacy redirect or login
                alert("Setup Complete! Please log in.");
                navigate('/login');
                // Force reload to clear AppGate state if needed, or rely on navigate
                window.location.reload();
            } else {
                alert("Setup failed: " + result.error);
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred during setup.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
            <Card className="w-full max-w-md border-t-4 border-t-primary shadow-xl">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
                        <Store className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Welcome to FasTo RMS</CardTitle>
                    <CardDescription>Let's set up your shop profile and admin account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={step} onValueChange={setStep} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="shop" disabled={loading}>1. Shop Profile</TabsTrigger>
                            <TabsTrigger value="account" disabled={loading || !formData.shopName}>2. Owner Account</TabsTrigger>
                        </TabsList>

                        <TabsContent value="shop" className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <Label htmlFor="shopName">Shop Name <span className="text-red-500">*</span></Label>
                                <Input id="shopName" placeholder="e.g. My Awesome Shop" value={formData.shopName} onChange={handleChange} autoFocus />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="shopPhone">Phone Number</Label>
                                <Input id="shopPhone" placeholder="e.g. 054 123 4567" value={formData.shopPhone} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="shopAddress">Location / Address</Label>
                                <Input id="shopAddress" placeholder="e.g. Accra, Ghana" value={formData.shopAddress} onChange={handleChange} />
                            </div>
                        </TabsContent>

                        <TabsContent value="account" className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm text-blue-800 dark:text-blue-300 mb-2 flex gap-2">
                                <User className="h-4 w-4 shrink-0 mt-0.5" />
                                <p>Create the main Administrator account for this shop. You can create more users later.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="username">Username <span className="text-red-500">*</span></Label>
                                <Input id="username" placeholder="admin" value={formData.username} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                                <Input id="password" type="password" value={formData.password} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></Label>
                                <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} />
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
                <CardFooter className="flex justify-between">
                    {step === 'shop' ? (
                        <Button className="w-full" onClick={handleNext}>
                            Next Step <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <div className="flex gap-2 w-full">
                            <Button variant="outline" onClick={() => setStep('shop')} disabled={loading}>Back</Button>
                            <Button className="flex-1" onClick={handleFinish} disabled={loading}>
                                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting up...</> : <><CheckCircle2 className="mr-2 h-4 w-4" /> Finish Setup</>}
                            </Button>
                        </div>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
