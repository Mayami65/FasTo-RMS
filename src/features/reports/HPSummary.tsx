import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function HPSummary() {
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSummary();
    }, []);

    const loadSummary = async () => {
        try {
            const data = await window.api.getHPSummary();
            setSummary(data);
        } catch (error) {
            console.error('Failed to load HP summary', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8">Loading HP summary...</div>;
    }

    if (!summary) {
        return <div className="p-8">No data available</div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Active Agreements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{summary.total_active_agreements}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Total Outstanding Debt</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-red-600">GH₵ {summary.total_debt.toFixed(2)}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Payments</CardTitle>
                </CardHeader>
                <CardContent>
                    {summary.recent_payments.length === 0 ? (
                        <p className="text-muted-foreground">No recent payments</p>
                    ) : (
                        <div className="space-y-2">
                            {summary.recent_payments.map((payment: any, index: number) => (
                                <div key={index} className="flex justify-between items-center border-b pb-2">
                                    <div>
                                        <p className="font-medium">{payment.customer_name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(payment.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <p className="font-semibold text-green-600">GH₵ {payment.amount.toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
