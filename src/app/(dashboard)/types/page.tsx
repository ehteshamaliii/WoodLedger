"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Loader2, Armchair, ImageIcon, Trash2, Layers, Palette } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AIImageGenerator } from "@/components/stock/ai-image-generator";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DataTable, Column, RowAction, FilterConfig, TabsConfig, BulkAction } from "@/components/shared/data-table";
import { StatsCard } from "@/components/dashboard/widgets/stats-card";
import { FormInput } from "@/components/shared/form-input";
import { Form } from "@/components/ui/form";

const typeSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
});

type TypeFormValues = z.infer<typeof typeSchema>;

interface TypeItem {
    id: string;
    name: string;
    description: string | null;
    imageUrl?: string | null;
}

export default function TypesPage() {
    const { toast } = useToast();
    const [furnitureTypes, setFurnitureTypes] = useState<TypeItem[]>([]);
    const [fabricTypes, setFabricTypes] = useState<TypeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [currentTab, setCurrentTab] = useState<"furniture" | "fabric">("furniture");
    const [editingItem, setEditingItem] = useState<TypeItem | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<TypeFormValues>({
        resolver: zodResolver(typeSchema),
        defaultValues: { name: "", description: "", imageUrl: "" },
    });

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

    const openDialog = (type: "furniture" | "fabric", item?: TypeItem) => {
        setCurrentTab(type);
        setEditingItem(item || null);
        form.reset({
            name: item?.name || "",
            description: item?.description || "",
            imageUrl: item?.imageUrl || "",
        });
        setDialogOpen(true);
    };

    const onSubmit = async (data: TypeFormValues) => {
        try {
            setSubmitting(true);
            const endpoint = currentTab === "furniture" ? "/api/furniture-types" : "/api/fabric-types";
            const url = editingItem ? `${endpoint}/${editingItem.id}` : endpoint;
            const method = editingItem ? "PUT" : "POST";
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (result.success) {
                toast({
                    title: "Success",
                    description: `${currentTab === "furniture" ? "Furniture" : "Fabric"} type ${editingItem ? "updated" : "created"} successfully`,
                });
                setDialogOpen(false);
                fetchTypes();
            } else {
                toast({ title: "Error", description: result.error || "Failed to save type", variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Failed to save type", variant: "destructive" });
        } finally {
            setSubmitting(false);
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
        all: allTypes.length,
        furniture: furnitureTypes.length,
        fabric: fabricTypes.length,
    };

    const columns: Column<TypeItem & { _type: string }>[] = [
        {
            header: "Image",
            render: (item) => item._type === "fabric" ? (
                item.imageUrl ? (
                    <div className="relative h-10 w-10 rounded-md overflow-hidden border border-white/10 shadow-sm">
                        <img src={item.imageUrl} alt={item.name} className="object-cover w-full h-full" />
                    </div>
                ) : (
                    <div className="h-10 w-10 rounded-md bg-muted/20 flex items-center justify-center border border-dashed border-white/5">
                        <ImageIcon className="h-4 w-4 text-muted-foreground opacity-30" />
                    </div>
                )
            ) : (
                <div className="h-10 w-10 rounded-md bg-muted/10 flex items-center justify-center border border-dashed border-white/5">
                    <Armchair className="h-4 w-4 text-muted-foreground opacity-30" />
                </div>
            ),
        },
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
                <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                    item._type === "furniture"
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        : "bg-purple-500/10 text-purple-500 border-purple-500/20"
                )}>
                    {item._type}
                </span>
            ),
        },
    ];

    const tabsConfig: TabsConfig = {
        valueKey: "_type",
        defaultValue: "all",
        items: [
            { value: "all", label: "All Types", icon: Armchair },
            { value: "furniture", label: "Furniture", icon: Armchair },
            { value: "fabric", label: "Fabric", icon: ImageIcon },
        ],
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
            onClick: (item) => openDialog(item._type as "furniture" | "fabric", item),
        },
        {
            type: "delete",
            label: "Delete Type",
            confirmation: {
                title: "Delete Category",
                description: (item) => `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
            },
            onClick: (item) => handleDelete(item._type as "furniture" | "fabric", item.id),
        },
    ];

    const bulkActions: BulkAction<TypeItem & { _type: string }>[] = [
        {
            label: "Delete Selected",
            icon: Trash2,
            variant: "destructive",
            confirmation: {
                title: "Delete Types",
                description: "Delete the selected type categories? This cannot be undone.",
            },
            onClick: async (selectedItems) => {
                try {
                    await Promise.all(selectedItems.map(item => {
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
                        onClick={() => openDialog(currentTab)}
                        className="shadow-lg shadow-secondary/20 hover:scale-105 transition-all"
                        variant="secondary"
                    >
                        <Plus className="h-4 w-4" />
                        Add Type
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
                filterConfig={filterConfig}
                rowActions={rowActions}
                bulkActions={bulkActions}
                emptyTitle="No types found"
                emptyDescription="Add furniture or fabric categories to get started"
                emptyIcon={<Armchair className="h-16 w-16 text-muted-foreground/20" />}
            />

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className={cn(
                    "glass-card border-none transition-all duration-300 overflow-hidden",
                    currentTab === "furniture" ? "max-w-md" : "max-w-4xl"
                )}>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold font-heading uppercase tracking-wide">
                            {editingItem ? "Edit" : "Add"} {currentTab === "furniture" ? "Furniture" : "Fabric"} Type
                        </DialogTitle>
                        <DialogDescription>
                            Enter the details for this {currentTab} category below
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                            <div className={cn(
                                "grid gap-6",
                                currentTab === "fabric" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                            )}>
                                <div className="space-y-5">
                                    <FormInput
                                        control={form.control}
                                        name="name"
                                        label="Category Name *"
                                        placeholder={currentTab === "furniture" ? "e.g., Sofa, Bed" : "e.g., Velvet, Leather"}
                                        className="h-11"
                                    />
                                    <FormInput
                                        control={form.control}
                                        name="description"
                                        label="Description"
                                        placeholder="Optional description..."
                                        type="textarea"
                                        className="min-h-[150px]"
                                    />
                                </div>

                                {currentTab === "fabric" && (
                                    <div className="space-y-4 pt-1 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="p-4 rounded-lg bg-black/20 border border-white/5 space-y-4">
                                            <p className="text-xs font-bold uppercase tracking-widest text-primary">Fabric Visuals</p>
                                            <AIImageGenerator
                                                entityId={editingItem?.id}
                                                entityType="FABRIC"
                                                initialPrompt={form.watch("name")}
                                                onImageGenerated={(url) => form.setValue("imageUrl", url)}
                                            />
                                            {form.watch("imageUrl") && (
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Current Selection</p>
                                                    <div className="relative aspect-video rounded-sm overflow-hidden border border-white/10 shadow-inner group">
                                                        <img src={form.watch("imageUrl")} className="object-cover w-full h-full" alt="Preview" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => form.setValue("imageUrl", "")}
                                                                className="h-8"
                                                            >
                                                                Remove
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-white/10 hover:bg-white/5">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submitting} className="min-w-[120px] shadow-lg shadow-primary/20">
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingItem ? "Update Type" : "Create Type")}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
