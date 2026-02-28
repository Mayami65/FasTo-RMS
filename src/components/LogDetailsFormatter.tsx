import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

interface LogDetailsFormatterProps {
    action: string;
    details: string;
}

export const LogDetailsFormatter: React.FC<LogDetailsFormatterProps> = ({ action, details }) => {
    try {
        const data = JSON.parse(details);

        if (action === 'ADJUST_STOCK') {
            return (
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">Stock Adjustment</span>
                        <Badge variant={data.quantityChange > 0 ? "default" : "destructive"}>
                            {data.quantityChange > 0 ? '+' : ''}{data.quantityChange}
                        </Badge>
                    </div>
                    <div className="text-sm font-medium">
                        {data.productName ? (
                            <span>{data.productName} <span className="text-muted-foreground font-normal text-xs">(ID: {data.productId})</span></span>
                        ) : (
                            <span className="text-muted-foreground">Product ID: <span className="font-mono text-xs">{data.productId}</span></span>
                        )}
                    </div>
                    {data.reason && (
                        <div className="text-sm text-muted-foreground">
                            Reason: <span className="italic">{data.reason}</span>
                        </div>
                    )}
                    {data.notes && (
                        <div className="text-xs text-muted-foreground bg-muted p-1 rounded">
                            "{data.notes}"
                        </div>
                    )}
                </div>
            );
        }

        if (action === 'UPDATE_PRODUCT') {
            return (
                <div className="space-y-2">
                    <div className="font-medium text-sm">Updated Product: {data.name}</div>
                    <div className="grid gap-1">
                        {data.changes && Object.entries(data.changes).map(([key, value]: [string, any]) => (
                            <div key={key} className="text-sm flex items-center gap-2 bg-muted/50 p-1 rounded">
                                <span className="font-semibold capitalize text-muted-foreground w-24">{key.replace('_', ' ')}:</span>
                                <span className="line-through text-red-400 text-xs">{String(value.from)}</span>
                                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                <span className="text-green-600 dark:text-green-400 font-medium">{String(value.to)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (action === 'PROCESS_SALE') {
            return (
                <div className="space-y-1">
                    <div className="font-medium text-sm">Sale Processed</div>
                    <div className="text-sm text-muted-foreground">
                        Sale ID: <span className="font-mono text-xs">#{data.saleId}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Items: {data.items}
                    </div>
                    <div className="font-bold text-sm text-green-600 dark:text-green-400">
                        Total: GH₵ {data.total?.toFixed(2)}
                    </div>
                </div>
            );
        }

        if (action === 'DELETE_PRODUCT') {
            return (
                <div className="text-sm text-red-500">
                    Deleted Product: <span className="font-medium">{data.productName || 'Unknown'}</span> <span className="text-xs opacity-70">(ID: {data.productId})</span>
                </div>
            );
        }

        // Fallback for unknown actions but valid JSON
        return (
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-muted p-2 rounded-md max-w-sm overflow-x-auto">
                {JSON.stringify(data, null, 2)}
            </pre>
        );

    } catch (e) {
        // Fallback for non-JSON strings
        return <span className="text-sm text-muted-foreground">{details}</span>;
    }
};
