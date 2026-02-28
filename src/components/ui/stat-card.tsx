import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, className }: StatCardProps) {
    return (
        <Card className={cn(
            'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-default',
            className
        )}>
            <CardContent className="p-5">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
                        <p className="text-3xl font-bold mt-2 tracking-tight">{value}</p>
                        {trend && (
                            <p className={cn(
                                'text-sm mt-2 flex items-center gap-1 font-medium',
                                trend.isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
                            )}>
                                <span>{trend.isPositive ? '↑' : '↓'}</span>
                                <span>{Math.abs(trend.value)}%</span>
                            </p>
                        )}
                    </div>
                    <div className={cn(
                        'p-3.5 rounded-xl',
                        'bg-gradient-to-br from-primary/10 to-primary/5 text-primary',
                        'ring-1 ring-primary/10'
                    )}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
