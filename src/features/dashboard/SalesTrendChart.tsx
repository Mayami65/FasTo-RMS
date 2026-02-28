import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

interface SalesTrendChartProps {
    data: {
        date: string;
        amount: number;
    }[];
}

export function SalesTrendChart({ data }: SalesTrendChartProps) {

    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-2 overflow-hidden border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold">Weekly Revenue</CardTitle>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>Last 7 Days</span>
                </div>
            </CardHeader>
            <CardContent className="pl-0">
                <div className="w-full min-w-[100px]">
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={data}>
                            <XAxis
                                dataKey="date"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => value.split('-').slice(1).join('/')}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `₵${value}`}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                            Revenue
                                                        </span>
                                                        <span className="font-bold text-muted-foreground">
                                                            GH₵ {Number(payload[0].value).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Bar
                                dataKey="amount"
                                fill="currentColor"
                                radius={[4, 4, 0, 0]}
                                className="fill-blue-600 dark:fill-blue-500"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-green-600 dark:text-green-500">+12.5%</span>
                    <span>vs previous period (mock)</span>
                </div>
            </CardContent>
        </Card>
    )
}
