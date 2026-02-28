import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface CategoryPerformanceChartProps {
    data: any[];
}

export default function CategoryPerformanceChart({ data }: CategoryPerformanceChartProps) {
    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Sales by Category</CardTitle>
                <CardDescription>Performance and profitability across collections.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `GH₵${value}`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }}
                            itemStyle={{ color: 'hsl(var(--primary))' }}
                            cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                            formatter={(value: number | undefined) => [`GH₵ ${(value || 0).toLocaleString()}`]}
                        />
                        <Legend />
                        <Bar dataKey="total_sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total Sales" />
                        <Bar dataKey="total_profit" fill="#10b981" radius={[4, 4, 0, 0]} name="Net Profit" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
