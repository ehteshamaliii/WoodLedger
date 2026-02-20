import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Package } from "lucide-react";

interface StockValueWidgetProps {
    totalValue?: number;
    itemCount?: number;
}

export function StockValueWidget({ totalValue = 0, itemCount = 0 }: StockValueWidgetProps) {
    if (totalValue === 0 && itemCount === 0) {
        return (
            <Card className="glass-card w-full h-full border-none shadow-sm rounded-sm flex flex-col items-center justify-center p-6 text-center group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[150px] h-[150px] blur-3xl opacity-20 bg-cyan-500/10 pointer-events-none" />
                <DollarSign className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">No Stock Found</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Add items to inventory to track value</p>
            </Card>
        );
    }

    return (
        <Card className="glass-card w-full h-full !p-0 border-none shadow-sm rounded-sm overflow-hidden flex flex-col group relative">
            <div className="absolute top-0 right-0 w-[150px] h-[150px] blur-3xl opacity-20 bg-cyan-500/30 transition-all duration-500 group-hover:opacity-30 pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-5 pt-5 border-none bg-transparent">
                <CardTitle className="text-[12px] font-bold uppercase tracking-widest opacity-80 font-heading flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-cyan-500" />
                    Inventory Value
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col justify-center flex-1 gap-4 z-10">
                <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Asset Value</p>
                    <h3 className="text-3xl font-bold font-heading text-foreground">
                        Rs. {totalValue.toLocaleString()}
                    </h3>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-cyan-500/10 px-3 py-1.5 rounded-full border border-cyan-500/20">
                        <Package className="h-4 w-4 text-cyan-500" />
                        <span className="text-sm font-bold text-cyan-700 dark:text-cyan-300">{itemCount} items</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-sm">
                        <TrendingUp className="h-3 w-3" />
                        <span>+12% vs last month</span>
                    </div>
                </div>

                <div className="text-xs text-muted-foreground mt-2">
                    *Estimated retail value of current stock holding.
                </div>
            </CardContent>
        </Card>
    );
}
