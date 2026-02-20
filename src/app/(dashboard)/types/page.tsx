"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { Plus, Armchair, ImageIcon, Trash2, Layers, Palette } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DataTable, Column, RowAction, FilterConfig, TabsConfig, BulkAction } from "@/components/shared/data-table";
import { StatsCard } from "@/components/dashboard/widgets/stats-card";

interface TypeItem {
    id: string;
    name: string;
    description: string | null;
    imageUrl?: string | null;
    _count?: {
        stocks: number;
        orderItems: number;
    };
}

function TypesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [furnitureTypes, setFurnitureTypes] = useState<TypeItem[]>([]);
    const [fabricTypes, setFabricTypes] = useState<TypeItem[]>([]);
    const [loading, setLoading] = useState(true);

    const tabParam = searchParams.get("tab");
    const initialTab = (tabParam === "furniture" || tabParam === "fabric") ? tabParam : "furniture";
    const [currentTab, setCurrentTab] = useState<"furniture" | "fabric">(initialTab);

    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        try {
            setLoading(true);
            const [furnitureRes, fabricRes] = await Promise.all([
                fetch("/api/furniture-types"),
                fetch("/api/fabric-types"),
            ]);
            const [furnitureData, fabricData] = await Promise.all([
                furnitureRes.json(),
                fabricRes.json(),
            ]);
            if (furnitureData.success) setFurnitureTypes(furnitureData.data);
            if (fabricData.success) setFabricTypes(fabricData.data);
        } catch {
            toast({ title: "Error", description: "Failed to fetch types", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (type: "furniture" | "fabric", id: string) => {
        const endpoint = type === "furniture" ? "/api/furniture-types" : "/api/fabric-types";
        const response = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
        const result = await response.json();
        if (result.success) {
            toast({ title: "Success", description: "Type deleted successfully" });
            fetchTypes();
        } else {
            toast({ title: "Error", description: result.error || "Failed to delete type", variant: "destructive" });
        }
    };

    // Combined data with a synthetic discriminator field for tab filtering
    const allTypes = useMemo(() => [
        ...furnitureTypes.map(t => ({ ...t, _type: "furniture" })),
        ...fabricTypes.map(t => ({ ...t, _type: "fabric" })),
    ], [furnitureTypes, fabricTypes]);

    const tabCounts = {
        furniture: furnitureTypes.length,
        fabric: fabricTypes.length,
    };

    const columns: Column<TypeItem & { _type: string }>[] = [
        ...(currentTab === "fabric" ? [{
            header: "Image",
            render: (item: TypeItem & { _type: string }) => item.imageUrl ? (
                <div className="relative h-10 w-10 rounded-md overflow-hidden border border-white/10 shadow-sm">
                    <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="h-full w-full bg-muted/20 flex flex-col items-center justify-center border border-dashed border-white/5"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground opacity-30"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
                        }}
                    />
                </div>
            ) : (
                <div className="h-10 w-10 rounded-md bg-muted/20 flex items-center justify-center border border-dashed border-white/5">
                    <ImageIcon className="h-4 w-4 text-muted-foreground opacity-30" />
                </div>
            )
        }] as Column<TypeItem & { _type: string }>[] : []),
        {
            header: "Name",
            accessorKey: "name",
            sortable: true,
            render: (item) => <div className="font-bold text-foreground">{item.name}</div>,
        },
        {
            header: "Description",
            hideable: true,
            render: (item) => <div className="text-sm text-muted-foreground">{item.description || "-"}</div>,
        },
        {
            header: "Category",
            render: (item) => (
                <div className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border font-bold uppercase tracking-wider text-[10px] backdrop-blur-sm transition-all whitespace-nowrap",
                    item._type === "furniture"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                        : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
                )}>
                    {item._type === "furniture" ? <Armchair className="h-3 w-3 shrink-0" /> : <Layers className="h-3 w-3 shrink-0" />}
                    {item._type}
                </div>
            ),
        },
        {
            header: "Usage",
            render: (item) => {
                const inventoryCount = item._count?.stocks || 0;
                const ordersCount = item._count?.orderItems || 0;
                return (
                    <div className="flex gap-2">
                        <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded border border-blue-500/20" title="Inventory">Inventory: {inventoryCount}</span>
                        <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded border border-green-500/20" title="Orders">Orders: {ordersCount}</span>
                    </div>
                );
            },
        },
    ];

    const tabsConfig: TabsConfig = {
        valueKey: "_type",
        defaultValue: currentTab,
        items: [
            { value: "furniture", label: "Furniture", icon: Armchair },
            { value: "fabric", label: "Fabric", icon: ImageIcon },
        ],
    };

    const onFilterChange = (filters: any) => {
        if (filters.tab && (filters.tab === "furniture" || filters.tab === "fabric")) {
            setCurrentTab(filters.tab);
        }
    };

    const filterConfig: FilterConfig = {
        search: {
            enabled: true,
            placeholder: "Search types...",
            searchFields: ["name", "description"],
        },
    };

    const rowActions: RowAction<TypeItem & { _type: string }>[] = [
        {
            type: "edit",
            label: "Edit Type",
            onClick: (item) => router.push(`/types/${item._type}/${item.id}/edit`),
            disabled: (item) => (item._count?.stocks || 0) > 0 || (item._count?.orderItems || 0) > 0,
            disabledReason: "Cannot edit an in-use type",
        },
        {
            type: "delete",
            label: "Delete Type",
            confirmation: {
                title: "Delete Category",
                description: (item) => `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
            },
            onClick: (item) => handleDelete(item._type as "furniture" | "fabric", item.id),
            disabled: (item) => (item._count?.stocks || 0) > 0 || (item._count?.orderItems || 0) > 0,
            disabledReason: "Cannot delete an in-use type",
        },
    ];

    const bulkActions: BulkAction<TypeItem & { _type: string }>[] = [
        {
            label: "Delete Selected",
            icon: Trash2,
            variant: "destructive",
            confirmation: {
                title: "Delete Types",
                description: "Delete the selected type categories? (In-use types will be skipped). This cannot be undone.",
            },
            onClick: async (selectedItems) => {
                try {
                    const itemsToDelete = selectedItems.filter(item => (item._count?.stocks || 0) === 0 && (item._count?.orderItems || 0) === 0);
                    if (itemsToDelete.length === 0) {
                        toast({ title: "Info", description: "No deletable items selected (all are in use)." });
                        return;
                    }
                    if (itemsToDelete.length < selectedItems.length) {
                        toast({ title: "Info", description: `Skipping ${selectedItems.length - itemsToDelete.length} in-use items.` });
                    }
                    await Promise.all(itemsToDelete.map(item => {
                        const endpoint = item._type === "furniture" ? "/api/furniture-types" : "/api/fabric-types";
                        return fetch(`${endpoint}/${item.id}`, { method: "DELETE" });
                    }));
                    fetchTypes();
                } catch {
                    toast({ title: "Error", description: "Failed to delete some types", variant: "destructive" });
                }
            },
        },
    ];

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 page-enter">
            <DataTable
                title="Fabric & Furniture Types"
                description="Manage furniture and fabric categories for orders and inventory"
                headerActions={
                    <Button
                        onClick={() => router.push(`/types/${currentTab}/new`)}
                        className="shadow-lg shadow-secondary/20 hover:scale-105 transition-all"
                        variant="secondary"
                    >
                        <Plus className="h-4 w-4" />
                        Add {currentTab === "furniture" ? "Furniture" : "Fabric"} Type
                    </Button>
                }
                sectionTitle="Type Categories"
                statsCards={
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatsCard title="Furniture Types" value={furnitureTypes.length} icon={Armchair} description="Furniture categories defined" variant="primary" />
                        <StatsCard title="Fabric Types" value={fabricTypes.length} icon={Layers} description="Fabric categories defined" variant="secondary" />
                        <StatsCard title="With Images" value={fabricTypes.filter(f => f.imageUrl).length} icon={ImageIcon} description="Fabric types with reference image" variant="primary" />
                        <StatsCard title="Total Types" value={furnitureTypes.length + fabricTypes.length} icon={Palette} description="All categories combined" variant="secondary" />
                    </div>
                }
                data={allTypes}
                columns={columns}
                isLoading={loading}
                rowIdKey="id"
                tabsConfig={tabsConfig}
                tabCounts={tabCounts}
                onFilterChange={onFilterChange}
                filterConfig={filterConfig}
                rowActions={rowActions}
                bulkActions={bulkActions}
                emptyTitle="No types found"
                emptyDescription="Add furniture or fabric categories to get started"
                emptyIcon={<Armchair className="h-16 w-16 text-muted-foreground/20" />}
            />
        </div>
    );
}

export default function TypesPage() {
    return (
        <Suspense fallback={<div className="flex-1 flex items-center justify-center p-8 text-muted-foreground">Loading...</div>}>
            <TypesContent />
        </Suspense>
    );
}
