"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { ArrowUpRight, ShoppingCart, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface RecentOrdersWidgetProps {
    orders: any[];
}

export function RecentOrdersWidget({ orders }: RecentOrdersWidgetProps) {
    return (
        <Card className="glass-card h-full border-none shadow-sm rounded-sm overflow-hidden flex flex-col group relative">
            <div className="absolute top-0 right-0 w-[150px] h-[150px] blur-3xl opacity-20 bg-primary/40 transition-all duration-500 group-hover:opacity-30 pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-5 border-none bg-transparent">
                <CardTitle className="text-[12px] font-bold uppercase tracking-widest opacity-80 font-heading flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                    Recent Orders
                </CardTitle>
                <Link href="/orders">
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/5 -mr-2">
                        View All <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto scrollbar-thin">
                {orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground font-medium">
                        <ShoppingCart className="h-10 w-10 mb-2 opacity-20" />
                        <p className="text-sm">No recent orders</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/40">
                        {orders.map((order) => (
                            <Link key={order.id} href={`/orders/${order.id}`}>
                                <div className="flex items-center justify-between p-4 hover:bg-primary/5 transition-colors group/item cursor-pointer">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm tracking-tight group-hover/item:text-primary transition-colors">#{order.orderNumber}</span>
                                            <StatusBadge
                                                variant={order.status}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium">{order.client.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm">Rs. {Number(order.totalPrice).toLocaleString()}</p>
                                        <p className="text-[10px] text-muted-foreground flex items-center justify-end gap-1 opacity-70">
                                            <Clock className="h-3 w-3" />
                                            {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                                        </p>
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
