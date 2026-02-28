import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lock, History, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function DayClosing() {
    const { user } = useAuth();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [summary, setSummary] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        loadSummary();
        loadHistory();
    }, [date]);

    const loadSummary = async () => {
        setLoading(true);
        try {
            const result = await window.api.getDailySummary(date);
            setSummary(result);
        } catch (error) {
            console.error('Failed to load summary', error);
        } finally {
            setLoading(false);
        }
    };

    const loadHistory = async () => {
        try {
            const result = await window.api.getClosingHistory();
            setHistory(result);
        } catch (error) {
            console.error('Failed to load history', error);
        }
    };

    const handleCloseDay = async () => {
        if (!summary) return;

        if (!window.confirm('Are you sure you want to close the day? This will lock all transactions for this date.')) {
            return;
        }

        setClosing(true);
        try {
            const result = await window.api.closeDayTransactions({
                date,
                summary,
                notes,
                userId: user?.id,
            });

            if (result.success) {
                loadSummary();
                loadHistory();
                setNotes('');
                alert('Day closed successfully');
            } else {
                alert('Failed to close day: ' + result.error);
            }
        } catch (error) {
            console.error('Error closing day:', error);
            alert('An error occurred');
        } finally {
            setClosing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Closing Action Section */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>End-of-Day Closing</CardTitle>
                            <CardDescription>Review daily totals and lock transactions.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Select Date</Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            {loading ? (
                                <div>Loading summary...</div>
                            ) : summary ? (
                                <div className="space-y-4">
                                    {summary.is_closed ? (
                                        <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            <AlertTitle className="text-green-800 dark:text-green-300">Day Closed</AlertTitle>
                                            <AlertDescription className="text-green-700 dark:text-green-400">
                                                Transactions for this date are locked.
                                            </AlertDescription>
                                        </Alert>
                                    ) : (
                                        <Alert variant="destructive">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertTitle>Day Open</AlertTitle>
                                            <AlertDescription>
                                                Transactions are still editable.
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total Revenue</p>
                                            <p className="text-2xl font-bold">GH₵ {summary.total_revenue.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Transactions</p>
                                            <p className="text-2xl font-bold">{summary.total_sales_count}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm border-b pb-2">
                                            <span>Cash Sales</span>
                                            <span className="font-medium">GH₵ {summary.cash_total.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm border-b pb-2">
                                            <span>Mobile Money</span>
                                            <span className="font-medium">GH₵ {summary.momo_total.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm pb-2">
                                            <span>Hire Purchase</span>
                                            <span className="font-medium">GH₵ {summary.hp_total.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {!summary.is_closed && (
                                        <div className="space-y-4 pt-4 border-t">
                                            <div className="space-y-2">
                                                <Label>Closing Notes</Label>
                                                <Textarea
                                                    placeholder="Enter any notes about today's closing..."
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                />
                                            </div>
                                            <Button
                                                className="w-full"
                                                onClick={handleCloseDay}
                                                disabled={closing || summary.total_sales_count === 0}
                                            >
                                                <Lock className="mr-2 h-4 w-4" />
                                                {closing ? 'Locking...' : 'Close Day & Lock Transactions'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>

                {/* Closing History */}
                <div>
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Closing History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {history.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">No closing history found.</p>
                                ) : (
                                    history.map((record: any) => (
                                        <div
                                            key={record.id}
                                            className="flex justify-between items-center p-3 border rounded hover:bg-muted/50 transition-colors"
                                        >
                                            <div>
                                                <p className="font-semibold">{new Date(record.closing_date).toLocaleDateString()}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {record.total_sales_count} sales
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-green-600">
                                                    GH₵ {record.total_revenue.toFixed(2)}
                                                </p>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(record.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
