import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: LucideIcon;
    trend?: string | number;
    inverseTrend?: boolean;
    variant?: "primary" | "secondary" | "destructive";
    className?: string;
}

export function StatsCard({ title, value, description, icon: Icon, trend, inverseTrend, variant = "primary", className }: StatsCardProps) {
    const trendValue = typeof trend === "string" ? parseFloat(trend) : (trend || 0);
    const isPositive = trendValue > 0;
    const isZero = trendValue === 0;

    return (
        <Card className="glass-card h-full !p-0 border-none group relative overflow-hidden">
            <div className={cn(
                "absolute top-0 right-0 w-32 h-32 blur-3xl opacity-15 transition-all duration-500 group-hover:opacity-25 pointer-events-none",
                variant === "primary" ? "bg-primary" : variant === "secondary" ? "bg-secondary" : "bg-destructive"
            )} />

            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground px-5 pt-5">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest opacity-60 font-heading">{title}</CardTitle>
                <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300 border",
                    variant === "primary"
                        ? "bg-primary/10 text-primary border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground group-hover:glow-primary"
                        : variant === "secondary"
                            ? "bg-secondary/10 text-secondary border-secondary/20 group-hover:bg-secondary group-hover:text-secondary-foreground group-hover:glow-secondary"
                            : "bg-destructive/10 text-destructive border-destructive/20 group-hover:bg-destructive group-hover:text-white group-hover:glow-destructive"
                )}>
                    <Icon className="h-5 w-5" />
                </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
                <div className={cn("text-3xl font-bold tracking-tight font-heading", className)}>{value}</div>
                {(trend !== undefined || description) && (
                    <div className="flex items-center mt-2.5">
                        {trend !== undefined && !isZero && (
                            <div className={cn(
                                "flex items-center text-xs font-bold px-2 py-0.5 rounded-full mr-2",
                                isPositive
                                    ? (inverseTrend ? "bg-accent/10 text-accent dark:text-amber-400" : "bg-secondary/20 text-secondary-foreground dark:text-emerald-400 shadow-sm")
                                    : (inverseTrend ? "bg-secondary/20 text-secondary-foreground dark:text-emerald-400 shadow-sm" : "bg-accent/10 text-accent dark:text-amber-400")
                            )}>
                                {isNaN(trendValue) ? (
                                    <span>{trend}</span>
                                ) : (
                                    <>
                                        {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                        {Math.abs(trendValue)}%
                                    </>
                                )}
                            </div>
                        )}
                        <p className="text-[10px] text-muted-foreground font-medium opacity-70">
                            {description || (isZero ? "Steady performance" : "vs previous period")}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
