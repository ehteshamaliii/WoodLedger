"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Trash2,
    CreditCard,
    Clock,
    ShoppingCart,
    Package,
    CheckCircle2,
    XCircle,
    Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DataTable, Column, FilterConfig, BulkAction, TabsConfig, RowAction } from "@/components/shared/data-table";
import { StatsCard } from "@/components/dashboard/widgets/stats-card";
import { useSyncData } from "@/hooks/use-sync-data";
import { db } from "@/lib/db";

const statusColors: Record<string, string> = {
    PENDING: "bg-amber-500/10 text-amber-600 border-amber-200/20 dark:text-amber-400",
    CONFIRMED: "bg-blue-500/10 text-blue-600 border-blue-200/20 dark:text-blue-400",
    IN_PRODUCTION: "bg-purple-500/10 text-purple-600 border-purple-200/20 dark:text-purple-400",
    READY: "bg-emerald-500/10 text-emerald-600 border-emerald-200/20 dark:text-emerald-400",
    DELIVERED: "bg-zinc-500/10 text-zinc-600 border-zinc-200/20 dark:text-zinc-400",
    CANCELLED: "bg-red-500/10 text-red-600 border-red-200/20 dark:text-red-400",
};

const statusBadgeConfig = {
    PENDING: { label: "Pending", className: statusColors.PENDING },
    CONFIRMED: { label: "Confirmed", className: statusColors.CONFIRMED },
    IN_PRODUCTION: { label: "In Production", className: statusColors.IN_PRODUCTION },
    READY: { label: "Ready", className: statusColors.READY },
    DELIVERED: { label: "Delivered", className: statusColors.DELIVERED },
    CANCELLED: { label: "Cancelled", className: statusColors.CANCELLED },
};

export default function OrdersPage() {
    const router = useRouter();
    const { toast } = useToast();

    const { items: orders, isLoading: loading, refresh } = useSyncData({
        entity: 'ORDER',
        apiUrl: '/api/reports/orders',
        dexieTable: db.orders
    });

    // Calculate Stats
    const stats = {
        totalOrders: orders.length,
        pending: orders.filter((o: any) => o.status === 'PENDING').length,
        inProduction: orders.filter((o: any) => o.status === 'IN_PRODUCTION').length,
        delivered: orders.filter((o: any) => o.status === 'DELIVERED').length
    };

    const columns: Column<any>[] = [
        {
            header: "Order #",
            accessorKey: "orderNumber",
            render: (order) => (
                <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{order.orderNumber}</span>
                    {order.isOffline && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 opacity-50 border-white/20">OFFLINE</Badge>
                    )}
                </div>
            ),
            sortable: true
        },
        {
            header: "Client",
            accessorKey: "client.name",
            className: "font-medium text-foreground/90",
            sortable: true
        },
        {
            header: "Items",
            accessorKey: "items",
            render: (order) => {
                const items = order.items || [];
                const names = items.map((i: any) => i.furnitureType?.name).filter(Boolean);
                const uniqueNames = Array.from(new Set(names));
                const displayText = uniqueNames.length > 0 ? uniqueNames.join(", ") : `${order.itemCount || 0} items`;

                return (
                    <Badge
                        variant="outline"
                        className="bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/50 font-normal truncate max-w-[180px]"
                        title={displayText}
                    >
                        {displayText}
                    </Badge>
                );
            }
        },
        {
            header: "Delivery",
            accessorKey: "deliveryDate",
            type: "date",
            className: "text-muted-foreground text-sm",
            sortable: true
        },
        {
            header: "Status",
            accessorKey: "status",
            type: "badge",
            badgeConfig: statusBadgeConfig,
            sortable: true
        },
        {
            header: "Total",
            accessorKey: "totalPrice",
            type: "currency",
            headerClassName: "text-right",
            className: "text-right font-bold text-foreground/90 font-mono",
            sortable: true
        },
        {
            header: "Paid / Balance",
            accessorKey: "paidSoFar",
            headerClassName: "text-right",
            className: "text-right",
            render: (order) => {
                // Fallback to advancePayment if paidSoFar (aggregated) is missing or 0 
                // but advancePayment (static field) is set. This covers old data/cache.
                const paid = Number(order.paidSoFar ?? order.advancePayment ?? 0);
                const balance = Number(order.balance ?? (Number(order.totalPrice) - paid));
                return (
                    <div className="flex flex-col items-end gap-0.5" title={`Price: ${order.totalPrice}`}>
                        <span className="font-mono text-xs font-bold text-emerald-500">
                            Rs. {paid.toLocaleString()}
                        </span>
                        <span className={`font-mono text-[10px] ${balance > 0 ? 'text-amber-500' : 'text-muted-foreground/50'}`}>
                            {balance > 0 ? `Rs. ${balance.toLocaleString()} due` : '✓ Settled'}
                        </span>
                    </div>
                );
            }
        }
    ];

    const rowActions: RowAction<any>[] = [
        {
            type: 'view',
            label: "View Details",
            onClick: (order) => router.push(`/orders/${order.id}`)
        },
        {
            type: 'download',
            label: "Download Invoice",
            onClick: (order) => { window.open(`/api/orders/${order.id}/invoice`, '_blank'); }
        },
        {
            type: 'edit',
            label: "Edit Order",
            onClick: (order) => router.push(`/orders/${order.id}/edit`)
        },
        {
            type: 'delete',
            label: "Delete Order",
            disabled: (order) => (Number(order.paidSoFar ?? order.advancePayment) || 0) > 0,
            disabledReason: "Orders with recorded payments cannot be deleted",
            confirmation: {
                title: (order) => `Delete Order ${order.orderNumber}`,
                description: "Are you sure you want to delete this order? This action cannot be undone."
            },
            onClick: async (order) => {
                try {
                    await fetch(`/api/orders/${order.id}`, { method: 'DELETE' });
                    toast({ title: "Success", description: "Order deleted successfully" });
                    refresh();
                } catch (error) {
                    toast({ title: "Error", description: "Failed to delete order", variant: "destructive" });
                }
            }
        }
    ];

    const filterConfig: FilterConfig = {
        search: {
            enabled: true,
            placeholder: "Search orders...",
            searchFields: ["orderNumber", "client.name"]
        },
        dateRange: {
            enabled: true,
            key: "deliveryDate",
            label: "Delivery Date"
        },
        selects: [
            {
                key: "status",
                label: "Status",
                options: [
                    { label: "Pending", value: "PENDING" },
                    { label: "Confirmed", value: "CONFIRMED" },
                    { label: "In Production", value: "IN_PRODUCTION" },
                    { label: "Ready", value: "READY" },
                    { label: "Delivered", value: "DELIVERED" },
                    { label: "Cancelled", value: "CANCELLED" },
                ],
            },
        ],
    };

    const tabsConfig: TabsConfig = {
        valueKey: "status",
        defaultValue: "all",
        items: [
            { value: "all", label: "All Orders", icon: ShoppingCart },
            { value: "PENDING", label: "Pending", icon: Clock },
            { value: "CONFIRMED", label: "Confirmed", icon: CheckCircle2 },
            { value: "IN_PRODUCTION", label: "Production", icon: Package },
            { value: "READY", label: "Ready", icon: CheckCircle2 },
            { value: "DELIVERED", label: "Delivered", icon: Truck },
            { value: "CANCELLED", label: "Cancelled", icon: XCircle },
        ]
    };

    const bulkActions: BulkAction<any>[] = [
        {
            label: "Delete",
            icon: Trash2,
            variant: "destructive",
            confirmation: {
                title: "Bulk Delete Orders",
                description: "Are you sure you want to delete the selected orders? This action cannot be undone."
            },
            onClick: async (selectedItems) => {
                try {
                    await Promise.all(selectedItems.map(item =>
                        fetch(`/api/orders/${item.id}`, { method: 'DELETE' })
                    ));
                    toast({ title: "Success", description: "Orders deleted successfully" });
                    refresh();
                } catch (error) {
                    toast({ title: "Error", description: "Failed to delete orders", variant: "destructive" });
                }
            }
        }
    ];

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 page-enter">
            <DataTable
                title="Orders"
                description="Manage customer orders and track their status"
                headerActions={
                    <Button
                        variant="secondary"
                        onClick={() => router.push("/orders/new")}
                        className="shadow-lg shadow-secondary/20 hover:scale-105 transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        New Order
                    </Button>
                }
                statsCards={
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatsCard
                            title="Total Orders"
                            value={stats.totalOrders}
                            icon={ShoppingCart}
                            description="All tracked orders"
                            variant="primary"
                        />
                        <StatsCard
                            title="Pending"
                            value={stats.pending}
                            icon={Clock}
                            description="Awaiting action"
                            variant="secondary"

                        />
                        <StatsCard
                            title="In Production"
                            value={stats.inProduction}
                            icon={Package}
                            description="Manufacturing phase"
                            variant="primary"

                        />
                        <StatsCard
                            title="Delivered"
                            value={stats.delivered}
                            icon={CheckCircle2}
                            description="Successfully completed"
                            variant="secondary"
                        />
                    </div>
                }
                sectionTitle="Recent Orders"
                sectionDescription="Track and manage all customer orders"
                data={orders}
                columns={columns}
                isLoading={loading}
                rowIdKey="id"
                filterConfig={filterConfig}
                tabsConfig={tabsConfig}
                bulkActions={bulkActions}
                rowActions={rowActions}
                onRowClick={(order) => router.push(`/orders/${order.id}`)}
                emptyTitle="No orders found"
                emptyDescription="Try adjusting your filters to see more results or create a new order."
            />
        </div>
    );
}
