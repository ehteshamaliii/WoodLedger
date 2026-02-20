"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Sparkles, Image as ImageIcon, Info, BadgeDollarSign, Trash2, CreditCard, ShoppingCart, Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/shared/form-input";
import { FormSelect } from "@/components/shared/form-select";
import { FormSection } from "@/components/shared/form-section";
import { PremiumCard } from "@/components/shared/premium-card";
import { StickyFooter } from "@/components/shared/sticky-footer";
import { StockImageManager } from "@/components/stock/stock-image-manager";
import { useToast } from "@/hooks/use-toast";
import { useOffline } from "@/hooks/use-offline";
import { useConnectivity } from "@/providers/connectivity-provider";
import { cn } from "@/lib/utils";

const stockSchema = z.object({
    productName: z.string().min(2, "Product name must be at least 2 characters"),
    furnitureTypeId: z.string().min(1, "Select furniture type"),
    fabricTypeId: z.string().min(1, "Select fabric type"),
    quantity: z.coerce.number().int().min(0, "Quantity cannot be negative"),
    createPrice: z.coerce.number().min(0, "Price must be positive"),
    sellingPrice: z.coerce.number().min(0, "Price must be positive"),
    minQuantity: z.coerce.number().int().min(0),
    images: z.array(z.string()).default([]),
});

type StockForm = z.infer<typeof stockSchema>;

interface FurnitureType {
    id: string;
    name: string;
}

interface FabricType {
    id: string;
    name: string;
}

export default function StockFormPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const { isOnline } = useConnectivity();
    const { queueAction } = useOffline();
    const [loading, setLoading] = useState(false);
    const [furnitureTypes, setFurnitureTypes] = useState<FurnitureType[]>([]);
    const [fabricTypes, setFabricTypes] = useState<FabricType[]>([]);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const isEdit = !!params?.id;

    const form = useForm<StockForm>({
        resolver: zodResolver(stockSchema) as any,
        defaultValues: {
            productName: "",
            furnitureTypeId: "",
            fabricTypeId: "",
            quantity: 0,
            createPrice: 0,
            sellingPrice: 0,
            minQuantity: 5,
            images: [],
        },
    });

    useEffect(() => {
        fetchTypes();
        if (isEdit) {
            fetchStockItem();
        }
    }, [isEdit]);

    const fetchTypes = async () => {
        try {
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
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load types",
                variant: "destructive",
            });
        }
    };

    const fetchStockItem = async () => {
        try {
            const response = await fetch(`/api/inventory/${params.id}`);
            const result = await response.json();

            if (result.success) {
                const data = result.data;
                setImageUrl(data.imageUrl);
                form.reset({
                    productName: data.productName,
                    furnitureTypeId: data.furnitureType.id,
                    fabricTypeId: data.fabricType.id,
                    quantity: data.quantity,
                    createPrice: data.createPrice,
                    sellingPrice: data.sellingPrice,
                    minQuantity: data.minQuantity,
                    images: data.images?.map((img: any) => img.base64) || [],
                });
            } else {
                toast({
                    title: "Error",
                    description: "Stock item not found",
                    variant: "destructive",
                });
                router.push("/inventory");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load stock item",
                variant: "destructive",
            });
        }
    };

    const onSubmit = async (data: StockForm) => {
        // ─── OFFLINE PATH ──────────────────────────────────────────────
        if (!isOnline) {
            if (isEdit) {
                // UPDATE: queue with existing ID
                await queueAction({
                    entity: 'STOCK',
                    action: 'UPDATE',
                    data: { id: params.id, ...data, updatedAt: new Date() },
                });
            } else {
                // CREATE: queue with temp ID
                await queueAction({
                    entity: 'STOCK',
                    action: 'CREATE',
                    data: { id: `temp_${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() },
                });
            }
            toast({
                title: "Saved offline",
                description: `Stock item ${isEdit ? 'update' : 'addition'} will sync when you're back online.`,
            });
            router.push("/inventory");
            return;
        }

        // ─── ONLINE PATH ───────────────────────────────────────────────
        try {
            setLoading(true);
            const url = isEdit ? `/api/inventory/${params.id}` : "/api/inventory";
            const method = isEdit ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (result.success) {
                toast({ title: "Success", description: `Stock item ${isEdit ? "updated" : "added"} successfully` });
                router.push("/inventory");
            } else {
                toast({ title: "Error", description: result.error || `Failed to ${isEdit ? "update" : "add"} stock item`, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: `Failed to ${isEdit ? "update" : "add"} stock item`, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const profitMargin = form.watch("sellingPrice") - form.watch("createPrice");
    const profitPercentage = form.watch("createPrice") > 0
        ? ((profitMargin / form.watch("createPrice")) * 100).toFixed(2)
        : "0";

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 pb-24 page-enter">
            {/* Premium Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/40 pb-6 mb-8">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60 mb-1">
                            <Package className="h-3 w-3" />
                            <span>Inventory Management</span>
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter font-heading uppercase">
                            {isEdit ? "Edit Stock Item" : "New Inventory Item"}
                        </h2>
                    </div>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-8">
                            {/* Visual Asset Management */}
                            <FormSection
                                title="Product Visuals"
                                icon={<ImageIcon className="h-5 w-5" />}
                                description="Upload product photos or use AI to generate catalog images"
                                className="bg-card/50 backdrop-blur-sm border-border/40"
                            >
                                <StockImageManager
                                    images={form.watch("images") || []}
                                    onImagesChange={(newImages) => form.setValue("images", newImages)}
                                    productName={form.watch("productName")}
                                    entityId={isEdit ? (params.id as string) : undefined}
                                />
                            </FormSection>

                            <FormSection
                                title="Basic Information"
                                icon={<Info className="h-5 w-5" />}
                                description="Essential product details and classification"
                                className="bg-card/50 backdrop-blur-sm border-border/40"
                            >
                                <FormInput
                                    control={form.control}
                                    name="productName"
                                    label="Product Name"
                                    placeholder="e.g., Luxury Velvet Wingback Chair"
                                    className="h-11"
                                />

                                <div className="grid gap-6 md:grid-cols-2">
                                    <FormSelect
                                        control={form.control}
                                        name="furnitureTypeId"
                                        label="Furniture Type"
                                        placeholder="Choose category"
                                        options={furnitureTypes.map(t => ({ label: t.name, value: t.id }))}
                                        className="h-11"
                                    />

                                    <FormSelect
                                        control={form.control}
                                        name="fabricTypeId"
                                        label="Primary Fabric"
                                        placeholder="Choose material"
                                        options={fabricTypes.map(t => ({ label: t.name, value: t.id }))}
                                        className="h-11"
                                    />
                                </div>
                            </FormSection>

                            <FormSection
                                title="Inventory Levels"
                                icon={<ShoppingCart className="h-5 w-5" />}
                                description="Manage stock quantity and reorder thresholds"
                                className="bg-card/50 backdrop-blur-sm border-border/40"
                            >
                                <div className="grid gap-6 md:grid-cols-2">
                                    <FormInput
                                        control={form.control}
                                        name="quantity"
                                        label="Current Stock Quantity"
                                        type="number"
                                        className="h-11 font-mono"
                                    />

                                    <FormInput
                                        control={form.control}
                                        name="minQuantity"
                                        label="Low Stock Threshold"
                                        type="number"
                                        className="h-11 font-mono"
                                        description="Automatic alerts triggered when stock hits this level"
                                    />
                                </div>
                            </FormSection>
                        </div>

                        <div className="space-y-8">
                            <FormSection
                                title="Pricing Strategy"
                                icon={<BadgeDollarSign className="h-5 w-5" />}
                                description="Calculate margins and set retail prices"
                                className="bg-card/50 backdrop-blur-sm border-border/40 mt-6 lg:mt-0 lg:sticky lg:top-24"
                            >
                                <FormInput
                                    control={form.control}
                                    name="createPrice"
                                    label="Unit Cost (Rs.)"
                                    type="number"
                                    icon={<CreditCard className="h-4 w-4" />}
                                    className="h-11 font-mono"
                                />

                                <FormInput
                                    control={form.control}
                                    name="sellingPrice"
                                    label="Selling Price (Rs.)"
                                    type="number"
                                    icon={<BadgeDollarSign className="h-4 w-4" />}
                                    className="h-11 font-mono border-primary/20"
                                />

                                <PremiumCard
                                    title="Financial Analysis"
                                    description="Estimated per-unit performance"
                                    icon={Sparkles}
                                    className="mt-4 border-border/40 bg-muted/50"
                                    headerClassName="p-4"
                                >
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end border-b border-border/40 pb-4">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Profit Per Unit</p>
                                                <p className="text-3xl font-black font-heading tracking-tight">
                                                    Rs. {profitMargin.toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">ROI</p>
                                                <p className={cn(
                                                    "text-2xl font-black font-heading tracking-tight",
                                                    Number(profitPercentage) > 20 ? "text-emerald-500" : "text-amber-500"
                                                )}>
                                                    {profitPercentage}%
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground/60 leading-relaxed italic">
                                            Pricing reflects a {Number(profitPercentage) > 30 ? "healthy" : "moderate"} margin based on current production costs.
                                        </p>
                                    </div>
                                </PremiumCard>
                            </FormSection>
                        </div>
                    </div>

                    <StickyFooter
                        isEdit={isEdit}
                        entityName="Inventory System"
                        loading={loading}
                        onCancel={() => router.back()}
                        submitText={isEdit ? "Update Stock" : "Create Product"}
                        submitIcon={<Plus className="h-4 w-4" />}
                    />
                </form>
            </Form>
        </div >
    );
}
