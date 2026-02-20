"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowUpRight, Package } from "lucide-react";
import Link from "next/link";

interface LowStockWidgetProps {
    items: any[];
}

export function LowStockWidget({ items }: LowStockWidgetProps) {
    return (
        <Card className="glass-card h-full border-none shadow-sm rounded-sm overflow-hidden flex flex-col group relative">
            <div className="absolute top-0 right-0 w-[150px] h-[150px] blur-3xl opacity-20 bg-red-500/40 transition-all duration-500 group-hover:opacity-30 pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-5 border-none bg-transparent">
                <CardTitle className="text-[12px] font-bold uppercase tracking-widest opacity-80 font-heading flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Low Stock Alerts
                </CardTitle>
                <Link href="/inventory">
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-red-500 hover:bg-red-500/10 -mr-2">
                        Inventory <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto scrollbar-thin">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground font-medium">
                        <Package className="h-10 w-10 mb-2 opacity-20" />
                        <p className="text-sm">Stock levels are healthy</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5 relative z-10">
                        {items.map((item) => (
                            <div key={item.id} className="relative group/row">
                                <div className="flex items-center justify-between p-4 hover:bg-red-500/5 transition-colors group/item">
                                    <Link
                                        href={`/inventory/${item.id}`}
                                        className="absolute inset-0 z-10"
                                        aria-label={`View ${item.productName}`}
                                    />
                                    <div className="space-y-1 relative z-20 pointer-events-none">
                                        <p className="font-bold text-sm truncate max-w-[180px] group-hover/item:text-red-600 dark:group-hover/item:text-red-400 transition-colors uppercase tracking-tight">
                                            {item.productName}
                                        </p>
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold tracking-wider uppercase opacity-70">
                                            <span>Min: {item.minQuantity}</span>
                                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                            <span>Current: <span className="text-red-600">{item.quantity}</span></span>
                                        </div>
                                    </div>
                                    <div className="relative z-30">
                                        <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold uppercase tracking-wider rounded-sm border-red-200/50 text-red-600 hover:bg-red-500 hover:text-white dark:border-red-900/30 dark:hover:bg-red-900/50 bg-transparent transition-all shadow-sm" asChild>
                                            <Link href={`/inventory/${item.id}?action=restock`}>
                                                Restock
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
