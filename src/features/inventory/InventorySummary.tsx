import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, DollarSign, TrendingDown } from "lucide-react";

interface InventorySummaryData {
    totalProducts: number;
    totalStock: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
}

interface InventorySummaryProps {
    data: InventorySummaryData | null;
}

export function InventorySummary({ data }: InventorySummaryProps) {
    if (!data) return null;

    const stats = [
        {
            title: "Total Stock Items",
            value: data.totalStock,
            icon: Package,
            description: `Across ${data.totalProducts} unique products`,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-900/20"
        },
        {
            title: "Inventory Value",
            value: `GH₵ ${data.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: DollarSign,
            description: "Total cost of current stock",
            color: "text-emerald-600",
            bg: "bg-emerald-50 dark:bg-emerald-900/20"
        },
        {
            title: "Low Stock Alerts",
            value: data.lowStockCount,
            icon: TrendingDown,
            description: "Items below reorder level",
            color: "text-amber-600",
            bg: "bg-amber-50 dark:bg-amber-900/20"
        },
        {
            title: "Out of Stock",
            value: data.outOfStockCount,
            icon: AlertTriangle,
            description: "Items needing immediate restock",
            color: "text-red-600",
            bg: "bg-red-50 dark:bg-red-900/20"
        }
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <Card key={stat.title} className="overflow-hidden border border-slate-200/50 dark:border-slate-800/50 bg-white/5 dark:bg-slate-900/40 shadow-sm backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            {stat.title}
                        </CardTitle>
                        <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                            <stat.icon className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            {stat.description}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
