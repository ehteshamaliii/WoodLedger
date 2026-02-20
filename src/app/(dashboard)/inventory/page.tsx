"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Trash2,
    Package,
    CreditCard,
    ShoppingCart,
    AlertTriangle,
    ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { useToast } from "@/hooks/use-toast";
import { DataTable, Column, FilterConfig, BulkAction, RowAction } from "@/components/shared/data-table";
import { StatsCard } from "@/components/dashboard/widgets/stats-card";
import { useSyncData } from "@/hooks/use-sync-data";
import { db } from "@/lib/db";

export default function InventoryPage() {
    const router = useRouter();
    const { toast } = useToast();

    const { items: stockItems, isLoading: loading, refresh } = useSyncData({
        entity: 'STOCK',
        apiUrl: '/api/inventory',
        dexieTable: db.stock
    });

    const stats = {
        totalItems: stockItems.length,
        totalValue: stockItems.reduce((sum: number, item: any) => sum + (item.quantity * item.sellingPrice), 0),
        lowStockItems: stockItems.filter((item: any) => item.quantity <= item.minQuantity).length,
        totalStockValue: stockItems.reduce((sum: number, item: any) => sum + (item.quantity * item.createPrice), 0),
    };

    // Derive filter options from loaded data
    const furnitureTypeOptions = useMemo(() => {
        const names = new Set<string>();
        stockItems.forEach((item: any) => {
            if (item.furnitureType?.name) names.add(item.furnitureType.name);
        });
        return Array.from(names).sort().map(n => ({ label: n, value: n }));
    }, [stockItems]);

    const fabricTypeOptions = useMemo(() => {
        const names = new Set<string>();
        stockItems.forEach((item: any) => {
            if (item.fabricType?.name) names.add(item.fabricType.name);
        });
        return Array.from(names).sort().map(n => ({ label: n, value: n }));
    }, [stockItems]);

    const columns: Column<any>[] = [
        {
            header: "Product Name",
            accessorKey: "productName",
            sortable: true,
            render: (item) => (
                <div className="flex items-center gap-2">
                    <span className="text-foreground/90 font-bold">{item.productName}</span>
                    {item.isOffline && (
                        <StatusBadge variant="LINKED" label="OFFLINE" className="opacity-50 border-border/20 backdrop-blur-none" />
                    )}
                    {item.quantity === 0 ? (
                        <StatusBadge variant="CANCELLED" label="OUT OF STOCK" />
                    ) : item.quantity <= item.minQuantity ? (
                        <StatusBadge variant="LOW_STOCK" />
                    ) : null}
                </div>
            )
        },
        {
            header: "Furniture Type",
            accessorKey: "furnitureType.name",
            className: "text-muted-foreground text-sm",
            hideable: true,
            sortable: true
        },
        {
            header: "Fabric Type",
            accessorKey: "fabricType",
            className: "text-muted-foreground text-sm",
            hideable: true,
            sortable: true,
            render: (item) => (
                <div className="flex items-center gap-0">
                    {item.fabricType?.imageUrl ? (
                        <div className="relative h-8 w-8 shrink-0 rounded-md overflow-hidden border border-white/10 shadow-sm">
                            <img
                                src={item.fabricType.imageUrl}
                                alt={item.fabricType.name}
                                className="object-cover w-full h-full"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="h-full w-full bg-muted/20 flex flex-col items-center justify-center border border-dashed border-white/5"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground opacity-30"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
                                }}
                            />
                        </div>
                    ) : (
                        <div className="h-8 w-8 shrink-0 rounded-md bg-muted/20 flex items-center justify-center border border-dashed border-white/5">
                            <ImageIcon className="h-3 w-3 text-muted-foreground opacity-30" />
                        </div>
                    )}
                    <span className="truncate">{item.fabricType?.name || "-"}</span>
                </div>
            )
        },
        {
            header: "Quantity",
            accessorKey: "quantity",
            headerClassName: "text-center",
            className: "text-center font-bold text-foreground/90 font-mono",
            sortable: true,
            render: (item) => (
                <div className="flex flex-col items-center">
                    <span className={item.quantity <= item.minQuantity ? "text-red-600 dark:text-red-500" : ""}>
                        {item.quantity}
                    </span>
                    <span className="text-muted-foreground text-[10px] font-normal uppercase opacity-60">
                        {item.quantity === 0 ? "out of stock" : `min: ${item.minQuantity}`}
                    </span>
                </div>
            )
        },
        {
            header: "Cost",
            accessorKey: "createPrice",
            type: "currency",
            headerClassName: "text-center",
            className: "text-center text-muted-foreground font-mono text-sm",
            hideable: true,
            sortable: true
        },
        {
            header: "Selling Price",
            accessorKey: "sellingPrice",
            type: "currency",
            headerClassName: "text-center",
            className: "text-center font-bold text-foreground/90 font-mono",
            sortable: true
        }
    ];

    const rowActions: RowAction<any>[] = [
        {
            type: 'view',
            label: "View Details",
            onClick: (item) => router.push(`/inventory/${item.id}/view`)
        },
        {
            type: 'edit',
            label: "Edit Item",
            onClick: (item) => router.push(`/inventory/${item.id}`)
        },
        {
            type: 'delete',
            label: "Delete Item",
            confirmation: {
                title: () => `Delete Stock Item`,
                description: (item) => `Are you sure you want to delete "${item.productName}"? This action cannot be undone.`
            },
            onClick: async (item) => {
                try {
                    await fetch(`/api/inventory/${item.id}`, { method: "DELETE" });
                    toast({ title: "Success", description: "Item deleted successfully" });
                    refresh();
                } catch {
                    toast({ title: "Error", description: "Failed to delete item", variant: "destructive" });
                }
            }
        }
    ];

    const filterConfig: FilterConfig = {
        search: {
            enabled: true,
            placeholder: "Search by product, type...",
            searchFields: ["productName", "furnitureType.name", "fabricType.name"]
        },
        selects: [
            ...(furnitureTypeOptions.length > 0 ? [{
                key: "furnitureType.name",
                label: "Furniture Type",
                options: furnitureTypeOptions,
            }] : []),
            ...(fabricTypeOptions.length > 0 ? [{
                key: "fabricType.name",
                label: "Fabric Type",
                options: fabricTypeOptions,
            }] : []),
        ],
        toggles: [
            {
                key: "lowStock",
                label: "Low Stock Only",
                icon: AlertTriangle,
                filterFn: (item) => item.quantity <= item.minQuantity
            }
        ]
    };

    const bulkActions: BulkAction<any>[] = [
        {
            label: "Delete Selected",
            icon: Trash2,
            variant: "destructive",
            confirmation: {
                title: "Bulk Delete Items",
                description: "Are you sure you want to delete the selected items? This action cannot be undone."
            },
            onClick: async (selectedItems) => {
                try {
                    await Promise.all(selectedItems.map(item =>
                        fetch(`/api/inventory/${item.id}`, { method: "DELETE" })
                    ));
                    toast({ title: "Success", description: "Items deleted successfully" });
                    refresh();
                } catch {
                    toast({ title: "Error", description: "Failed to delete items", variant: "destructive" });
                }
            }
        }
    ];

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 page-enter">
            <DataTable
                title="Inventory"
                description="Manage stock levels and track inventory"
                headerActions={
                    <Button
                        variant="secondary"
                        onClick={() => router.push("/inventory/new")}
                        className="shadow-lg shadow-secondary/20 hover:scale-105 transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        Add Stock
                    </Button>
                }
                statsCards={
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatsCard
                            title="Total Items"
                            value={stats.totalItems}
                            icon={Package}
                            description="Unique products in stock"
                            variant="primary"
                        />
                        <StatsCard
                            title="Inventory Value"
                            value={`Rs. ${stats.totalValue.toLocaleString()}`}
                            icon={CreditCard}
                            description="Total potential revenue"
                            variant="secondary"
                        />
                        <StatsCard
                            title="Assets (Cost)"
                            value={`Rs. ${stats.totalStockValue.toLocaleString()}`}
                            icon={ShoppingCart}
                            description="Total cost of stock"
                            variant="primary"
                        />
                        <StatsCard
                            title="Low Stock Items"
                            value={stats.lowStockItems}
                            icon={AlertTriangle}
                            description="Needs restocking"
                            variant={stats.lowStockItems > 0 ? "destructive" : "secondary"}
                        />
                    </div>
                }
                sectionTitle="Stock Items"
                sectionDescription="All products currently tracked in inventory"
                data={stockItems}
                columns={columns}
                isLoading={loading}
                rowIdKey="id"
                filterConfig={filterConfig}
                bulkActions={bulkActions}
                rowActions={rowActions}
                onRowClick={(item) => router.push(`/inventory/${item.id}`)}
                emptyTitle="No stock items found"
                emptyDescription="Try adjusting your filters to see more results or add a new stock item."
                emptyIcon={<Package className="h-16 w-16 text-muted-foreground/20" />}
            />
        </div>
    );
}
