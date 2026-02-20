"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, ArrowLeft, Loader2, Save, ShoppingBag, User, Calendar, CreditCard, FileText, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import { FormInput } from "@/components/shared/form-input";
import { FormSelect } from "@/components/shared/form-select";
import { FormMultiSelect } from "@/components/shared/form-multi-select";
import { FormSection } from "@/components/shared/form-section";
import { StickyFooter } from "@/components/shared/sticky-footer";
import { useToast } from "@/hooks/use-toast";
import { useOffline } from "@/hooks/use-offline";
import { useConnectivity } from "@/providers/connectivity-provider";
import { cn } from "@/lib/utils";

const orderItemSchema = z.object({
    furnitureTypeId: z.string().min(1, "Select furniture type"),
    fabricTypeIds: z.array(z.string()).min(1, "Select at least one fabric type"),
    quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
    price: z.coerce.number().min(0, "Price must be positive"),
    notes: z.string().optional(),
});

const orderSchema = z.object({
    clientId: z.string().min(1, "Select a client"),
    deliveryDate: z.date({
        message: "Select delivery date",
    }),
    advancePayment: z.coerce.number().min(0),
    notes: z.string().optional(),
    items: z.array(orderItemSchema).min(1, "Add at least one item"),
});

type OrderForm = z.infer<typeof orderSchema>;

interface Client {
    id: string;
    name: string;
    phone: string;
}

interface FurnitureType {
    id: string;
    name: string;
}

interface FabricType {
    id: string;
    name: string;
    imageUrl?: string | null;
}

export default function NewOrderPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { isOnline } = useConnectivity();
    const { queueAction } = useOffline();
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [furnitureTypes, setFurnitureTypes] = useState<FurnitureType[]>([]);
    const [fabricTypes, setFabricTypes] = useState<FabricType[]>([]);

    const form = useForm<OrderForm>({
        resolver: zodResolver(orderSchema) as any,
        defaultValues: {
            clientId: "",
            advancePayment: 0,
            notes: "",
            items: [
                {
                    furnitureTypeId: "",
                    fabricTypeIds: [],
                    quantity: 1,
                    price: 0,
                    notes: "",
                },
            ],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [clientsRes, furnitureRes, fabricRes] = await Promise.all([
                fetch("/api/clients?pageSize=100"),
                fetch("/api/furniture-types"),
                fetch("/api/fabric-types"),
            ]);

            const [clientsData, furnitureData, fabricData] = await Promise.all([
                clientsRes.json(),
                furnitureRes.json(),
                fabricRes.json(),
            ]);

            if (clientsData.success) setClients(clientsData.data);
            if (furnitureData.success) setFurnitureTypes(furnitureData.data);
            if (fabricData.success) setFabricTypes(fabricData.data);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load form data",
                variant: "destructive",
            });
        }
    };

    const calculateTotal = () => {
        const items = form.watch("items");
        return items.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0);
    };

    const totalPrice = calculateTotal();

    const onSubmit = async (data: OrderForm) => {
        // Client-side guard: advance cannot exceed invoice total
        const total = data.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0);
        if ((data.advancePayment || 0) > total) {
            toast({
                title: "Advance exceeds invoice",
                description: `Advance (Rs. ${data.advancePayment}) cannot be more than total (Rs. ${total})`,
                variant: "destructive",
            });
            return;
        }

        // ─── OFFLINE PATH ──────────────────────────────────────────────
        if (!isOnline) {
            const tempOrderId = `temp_${Date.now()}`;
            await queueAction({
                entity: 'ORDER',
                action: 'CREATE',
                data: {
                    id: tempOrderId,
                    ...data,
                    deliveryDate: data.deliveryDate.toISOString(),
                    totalPrice: total,
                    status: 'PENDING',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });

            // Queue advance payment linked to the temp order ID.
            // syncData will replace this with the real order ID when the order syncs first.
            const advance = data.advancePayment || 0;
            if (advance > 0) {
                await queueAction({
                    entity: 'PAYMENT',
                    action: 'CREATE',
                    data: {
                        id: `temp_pay_${Date.now()}`,
                        orderId: tempOrderId,      // will be resolved to real ID on sync
                        amount: advance,
                        type: 'CREDIT',
                        description: `Advance payment for offline order`,
                        date: new Date().toISOString(),
                        createdAt: new Date(),
                    },
                });
                toast({
                    title: "Saved offline",
                    description: `Order + Rs. ${advance.toLocaleString()} advance payment saved. Both will sync automatically when you're back online.`,
                });
            } else {
                toast({
                    title: "Saved offline",
                    description: "Order saved locally and will sync automatically when you're back online.",
                });
            }
            router.push("/orders");
            return;
        }

        // ─── ONLINE PATH ───────────────────────────────────────────────
        try {
            setLoading(true);
            const response = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    deliveryDate: data.deliveryDate.toISOString(),
                }),
            });

            const result = await response.json();

            if (result.success) {
                const advance = data.advancePayment || 0;
                if (advance > 0) {
                    const params = new URLSearchParams({
                        orderId: result.data.id,
                        amount: String(advance),
                        type: "CREDIT",
                        description: `Advance payment for order ${result.data.orderNumber}`,
                        from: "order",
                    });
                    toast({
                        title: "Order created!",
                        description: `Redirecting to record the Rs. ${advance.toLocaleString()} advance payment...`,
                    });
                    router.push(`/payments/new?${params.toString()}`);
                } else {
                    toast({ title: "Success", description: "Order created successfully" });
                    router.push("/orders");
                }
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to create order",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to create order", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 page-enter">
            <div className="flex items-center justify-between">
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
                        <h2 className="text-3xl font-bold tracking-tight font-heading uppercase">New Order</h2>
                        <p className="text-muted-foreground">Create a new customer order</p>
                    </div>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormSection
                        title="Order Details"
                        description="Basic information for this order"
                        icon={<FileText className="h-5 w-5" />}
                    >
                        <div className="grid gap-6 md:grid-cols-2">
                            <FormSelect
                                control={form.control}
                                name="clientId"
                                label="Client *"
                                icon={<User className="h-3.5 w-3.5" />}
                                placeholder="Select client"
                                options={clients.map(c => ({ label: `${c.name} - ${c.phone}`, value: c.id }))}
                                className="h-10"
                            />

                            <FormField
                                control={form.control}
                                name="deliveryDate"
                                render={({ field, fieldState }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">
                                            <Calendar className="h-3.5 w-3.5" /> Delivery Date *
                                        </FormLabel>
                                        <DatePicker
                                            date={field.value}
                                            setDate={field.onChange}
                                            placeholder="Pick a delivery date"
                                            className={cn(fieldState.error && "border-destructive focus-visible:ring-destructive/50")}
                                        />
                                        <FormMessage className="text-[10px] font-bold uppercase tracking-tight text-destructive ml-1" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormInput
                            control={form.control}
                            name="advancePayment"
                            label="Advance Payment (Rs.)"
                            icon={<CreditCard className="h-3.5 w-3.5" />}
                            type="number"
                            min="0"
                            className="h-10 font-mono text-lg"
                        />

                        <FormInput
                            control={form.control}
                            name="notes"
                            label="Notes"
                            placeholder="Add any special instructions or notes..."
                            className="min-h-[100px]"
                            type="textarea"
                        />
                    </FormSection>

                    {/* Order Items Section */}
                    <div className="glass-card p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">
                                    <ShoppingBag className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold font-heading uppercase tracking-wide">Order Items</h3>
                                    <p className="text-sm text-muted-foreground">Add items to this order</p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() =>
                                    append({
                                        furnitureTypeId: "",
                                        fabricTypeIds: [],
                                        quantity: 1,
                                        price: 0,
                                        notes: "",
                                    })
                                }
                                className="shadow-md hover:scale-105 transition-transform"
                            >
                                <Plus className="h-4 w-4" />
                                Add Item
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="relative bg-muted/5 rounded-lg border border-white/5 p-4 transition-all hover:bg-muted/10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Item #{index + 1}</h4>
                                        {fields.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => remove(index)}
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <FormSelect
                                                control={form.control}
                                                name={`items.${index}.furnitureTypeId`}
                                                label="Furniture Type *"
                                                placeholder="Select type"
                                                options={furnitureTypes.map(t => ({ label: t.name, value: t.id }))}
                                                className="h-10"
                                            />

                                            <FormMultiSelect
                                                control={form.control}
                                                name={`items.${index}.fabricTypeIds`}
                                                label="Fabric Types *"
                                                placeholder="Select fabrics"
                                                options={fabricTypes.map(t => ({ label: t.name, value: t.id, imageUrl: t.imageUrl }))}
                                                className="h-10"
                                            />
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <FormInput
                                                control={form.control}
                                                name={`items.${index}.quantity`}
                                                label="Quantity *"
                                                type="number"
                                                min="1"
                                                className="h-10"
                                            />

                                            <FormInput
                                                control={form.control}
                                                name={`items.${index}.price`}
                                                label="Price (Rs.) *"
                                                type="number"
                                                min="0"
                                                className="h-10 font-mono"
                                            />
                                        </div>

                                        <FormInput
                                            control={form.control}
                                            name={`items.${index}.notes`}
                                            label="Item Notes"
                                            placeholder="e.g., Color, dimensions..."
                                            className="h-10"
                                        />
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-end pt-4 border-t border-white/5">
                                <div className="text-right p-4 bg-primary/5 rounded-lg border border-primary/10 min-w-[200px]">
                                    <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                                    <p className="text-3xl font-bold font-heading text-primary">
                                        Rs. {calculateTotal().toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <StickyFooter
                        isEdit={false}
                        entityName="Order System"
                        loading={loading}
                        onCancel={() => router.back()}
                        submitText="Create Order"
                        submitIcon={<Save className="h-4 w-4" />}
                    />
                </form>
            </Form>
        </div>
    );
}
