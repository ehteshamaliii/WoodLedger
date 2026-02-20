import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Product {
    id: string;
    name: string;
    sold: number;
    revenue: number;
}

interface TopProductsWidgetProps {
    products?: Product[];
}

export function TopProductsWidget({ products = [] }: TopProductsWidgetProps) {
    const displayProducts = products;

    if (displayProducts.length === 0) {
        return (
            <Card className="glass-card w-full h-full border-none shadow-sm rounded-sm flex flex-col items-center justify-center p-6 text-center group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[150px] h-[150px] blur-3xl opacity-20 bg-emerald-500/10 pointer-events-none" />
                <Package className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">No Products Sold</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Sales data required to rank items</p>
            </Card>
        );
    }

    return (
        <Card className="glass-card w-full h-full !p-0 border-none shadow-sm rounded-sm overflow-hidden flex flex-col group relative">
            <div className="absolute top-0 right-0 w-[150px] h-[150px] blur-3xl opacity-20 bg-emerald-500/30 transition-all duration-500 group-hover:opacity-30 pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-5 pt-5 border-none bg-transparent">
                <CardTitle className="text-[12px] font-bold uppercase tracking-widest opacity-80 font-heading flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    Top Products
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 z-10">
                <div className="divide-y divide-white/5 relative">
                    {displayProducts.map((product, i) => (
                        <Link key={product.id} href={`/inventory`}>
                            <div className="flex items-center justify-between p-4 hover:bg-emerald-500/5 transition-colors group/item cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-[10px] ring-1 ring-emerald-500/20 shadow-sm transition-all group-hover/item:bg-emerald-500 group-hover/item:text-white">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold uppercase tracking-tight group-hover/item:text-emerald-600 dark:group-hover/item:text-emerald-400 transition-colors">{product.name}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1 opacity-70">{product.sold} units sold</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">Rs.{product.revenue.toLocaleString()}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
