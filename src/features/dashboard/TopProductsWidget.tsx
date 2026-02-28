import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ProductStats {
    id: number;
    name: string;
    total_quantity: number;
    total_revenue: number;
    image?: string;
}

interface TopProductsWidgetProps {
    products: ProductStats[];
}

export function TopProductsWidget({ products }: TopProductsWidgetProps) {
    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-2 overflow-hidden border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader>
                <CardTitle className="text-base font-semibold">Top Products</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {products.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No data available.</p>
                    ) : (
                        products.map((product, index) => (
                            <div key={product.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold text-xs">
                                        #{index + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm leading-none">{product.name}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{product.total_quantity} units sold</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-sm">GH₵ {(product.total_revenue || 0).toFixed(2)}</p>
                                    {index === 0 && <Badge variant="secondary" className="text-[10px] h-5 px-1.5 ml-auto block w-fit mt-0.5">Best Seller</Badge>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
