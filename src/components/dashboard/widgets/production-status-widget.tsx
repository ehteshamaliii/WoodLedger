"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Factory, ArrowUpRight, CheckCircle2, Cog } from "lucide-react";
import Link from "next/link";

interface ProductionStatusWidgetProps {
    orders: any[];
}

export function ProductionStatusWidget({ orders }: ProductionStatusWidgetProps) {
    return (
        <Card className="glass-card h-full border-none shadow-sm rounded-sm overflow-hidden flex flex-col group relative">
            <div className="absolute top-0 right-0 w-[150px] h-[150px] blur-3xl opacity-20 bg-blue-500/40 transition-all duration-500 group-hover:opacity-30 pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-5 border-none bg-transparent">
                <CardTitle className="text-[12px] font-bold uppercase tracking-widest opacity-80 font-heading flex items-center gap-2">
                    <Factory className="h-4 w-4 text-blue-500" />
                    Production Status
                </CardTitle>
                <Link href="/orders?status=IN_PRODUCTION">
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 -mr-2">
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
                                <div className="p-4 hover:bg-blue-500/5 transition-colors group/item cursor-pointer relative z-30">
                                    <div className="flex items-center justify-between mb-3 pointer-events-none">
                                        <span className="font-bold text-sm tracking-tight group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors uppercase tracking-widest">#{order.orderNumber}</span>
                                        {order.status === 'READY' ? (
                                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 rounded-sm px-1.5 h-5 text-[10px] uppercase font-bold tracking-wider hover:bg-green-500/20 shadow-sm transition-all pointer-events-auto">
                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Ready
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 rounded-sm px-1.5 h-5 text-[10px] uppercase font-bold tracking-wider hover:bg-blue-500/20 shadow-sm transition-all pointer-events-auto">
                                                <Cog className="w-3 h-3 mr-1 animate-spin-slow" /> In Progress
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="space-y-1.5 pointer-events-none">
                                        <div className="flex justify-between items-end">
                                            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground opacity-70">{order.clientName}</p>
                                            <span className="text-[10px] font-bold opacity-60 font-mono tracking-tighter">{order.progress}%</span>
                                        </div>
                                        <div className="w-full bg-muted/30 h-1 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ease-out ${order.status === 'READY' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]'}`}
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
