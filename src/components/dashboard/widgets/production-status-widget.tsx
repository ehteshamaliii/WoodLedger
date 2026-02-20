"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Factory, ArrowUpRight, CheckCircle2, Cog } from "lucide-react";
import Link from "next/link";

interface ProductionStatusWidgetProps {
    orders: any[];
}

export function ProductionStatusWidget({ orders }: ProductionStatusWidgetProps) {
    return (
        <Card className="glass-card h-full border-none shadow-sm rounded-sm overflow-hidden flex flex-col group relative">
            <div className="absolute top-0 right-0 w-[150px] h-[150px] blur-3xl opacity-20 bg-purple-500/40 transition-all duration-500 group-hover:opacity-30 pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-5 border-none bg-transparent">
                <CardTitle className="text-[12px] font-bold uppercase tracking-widest opacity-80 font-heading flex items-center gap-2">
                    <Factory className="h-4 w-4 text-purple-500" />
                    Production Status
                </CardTitle>
                <Link href="/orders?status=IN_PRODUCTION">
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-purple-500 hover:bg-purple-500/10 -mr-2">
                        Manage <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto scrollbar-thin z-10">
                {orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground font-medium">
                        <Factory className="h-10 w-10 mb-2 opacity-20" />
                        <p className="text-sm">Production queue is empty</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5 relative z-20">
                        {orders.map((order) => (
                            <Link key={order.id} href={`/orders/${order.id}`} className="block">
                                <div className="p-4 hover:bg-purple-500/5 transition-colors group/item cursor-pointer relative z-30">
                                    <div className="flex items-center justify-between mb-3 pointer-events-none">
                                        <span className="font-bold text-sm tracking-tight group-hover/item:text-purple-600 dark:group-hover/item:text-purple-400 transition-colors uppercase tracking-widest">#{order.orderNumber}</span>
                                        <StatusBadge
                                            variant={order.status === 'READY' ? 'READY' : 'IN_PRODUCTION'}
                                            label={order.status === 'READY' ? 'Ready' : 'In Progress'}
                                        />
                                    </div>
                                    <div className="space-y-1.5 pointer-events-none">
                                        <div className="flex justify-between items-end">
                                            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground opacity-70">{order.clientName}</p>
                                            <span className="text-[10px] font-bold opacity-60 font-mono tracking-tighter">{order.progress}%</span>
                                        </div>
                                        <div className="w-full bg-muted/30 h-1 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ease-out ${order.status === 'READY' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]'}`}
                                                style={{ width: `${order.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
