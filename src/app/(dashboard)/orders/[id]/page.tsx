"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    ArrowLeft,
    Pencil,
    Printer,
    Calendar,
    User,
    CreditCard,
    Package,
    Loader2,
    Download,
    ShoppingBag,
    Truck,
    Clock,
    Phone,
    MapPin,
    Building2,
    FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useConnectivity } from "@/providers/connectivity-provider";
import { db } from "@/lib/db";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PremiumCard } from "@/components/shared/premium-card";
import { DetailItem } from "@/components/shared/detail-item";

interface OrderItem {
    id: string;
    furnitureType: { name: string };
    fabricTypes: { name: string }[];
    quantity: number;
    price: number;
    notes: string | null;
}

interface Order {
    id: string;
    orderNumber: string;
    client: {
        id: string;
        name: string;
        phone: string;
        address: string | null;
    };
    deliveryDate: string;
    status: string;
    totalPrice: number;
    advancePayment: number;
    notes: string | null;
    items: OrderItem[];
    createdAt: string;
}

const statusStyles: Record<string, string> = {
    PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    CONFIRMED: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    IN_PRODUCTION: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    READY: "bg-green-500/10 text-green-500 border-green-500/20",
    DELIVERED: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    CANCELLED: "bg-red-500/10 text-red-500 border-red-500/20",
};

const statusLabels: Record<string, string> = {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    IN_PRODUCTION: "In Production",
    READY: "Ready",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
};

export default function OrderDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const { isOnline } = useConnectivity();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchOrder();
        }
    }, [params.id]);

    const fetchOrder = async () => {
        try {
            if (!isOnline) throw new Error('offline');
            const response = await fetch(`/api/orders/${params.id}`);
            const result = await response.json();
            if (result.success) {
                setOrder(result.data);
            } else {
                throw new Error(result.error || 'not found');
            }
        } catch {
            // Offline fallback: try local IndexedDB cache
            const local = await db.orders.get(params.id as string);
            if (local) {
                // Map local shape to Order interface as best we can
                setOrder(local as any);
            } else {
                toast({ title: "Error", description: "Order not found (offline)", variant: "destructive" });
                router.push("/orders");
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="flex-1 space-y-10 p-4 md:p-8 pt-6 page-enter print:p-0 print:space-y-4">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 no-print">
                <div className="flex items-center gap-5">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="hover:bg-primary/10 hover:text-primary transition-all h-11 w-11 rounded-sm border hover:border-primary/20"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-bold tracking-tight font-heading bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent uppercase">
                                Order #{order.orderNumber}
                            </h1>
                            <Badge className={cn("px-3 py-1 rounded-sm font-bold uppercase tracking-wider shadow-sm", statusStyles[order.status])}>
                                {statusLabels[order.status]}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm sm:text-base">
                            <Clock className="h-4 w-4 opacity-70" />
                            <span className="font-medium">
                                Created {format(new Date(order.createdAt), "MMM dd, yyyy")}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30 mx-1" />
                            <span className="text-xs uppercase tracking-widest font-bold opacity-60">System Verified</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-500">
                    <Button variant="outline" onClick={() => window.open(`/api/orders/${order.id}/invoice`, '_blank')} className="h-11 px-5 rounded-sm font-bold bg-background/50 backdrop-blur shadow-sm hover-scale gap-2">
                        <Download className="h-4 w-4 opacity-60" />
                        Invoice
                    </Button>
                    <Button variant="outline" onClick={() => window.open(`/print/orders/${order.id}`, '_blank')} className="h-11 px-5 rounded-sm font-bold bg-background/50 backdrop-blur shadow-sm hover-scale gap-2">
                        <Printer className="h-4 w-4 opacity-60" />
                        Print
                    </Button>
                    <Button onClick={() => router.push(`/orders/${order.id}/edit`)} className="h-11 px-6 rounded-sm font-bold shadow-lg shadow-primary/20 hover-scale bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                        <Pencil className="h-4 w-4" />
                        Edit Order
                    </Button>
                </div>
            </div>

            {/* Print Only Header */}
            <div className="hidden print:flex flex-col items-center justify-center mb-8 pb-6 border-b border-black">
                <h1 className="text-4xl font-bold uppercase mb-2">WoodLedger</h1>
                <h2 className="text-2xl font-bold uppercase">Order Invoice #{order.orderNumber}</h2>
                <p className="text-sm mt-2">{format(new Date(order.createdAt), "PPP")}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3 print:grid-cols-2">
                {/* Main Content - Items */}
                <div className="glass-card md:col-span-2 flex flex-col overflow-hidden border print:border-none shadow-xl shadow-black/5">
                    <div className="p-6 border-b border-white/5 bg-muted/10 print:bg-transparent print:border-black print:border-b-2 print:p-0 print:mb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-sm bg-primary/10 flex items-center justify-center text-primary border border-primary/20 no-print">
                                    <ShoppingBag className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold font-heading uppercase tracking-widest bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Order Items</h3>
                                    <p className="text-sm text-muted-foreground no-print font-medium opacity-70 italic">Detailed manifest of furniture selections</p>
                                </div>
                            </div>
                            <div className="no-print hidden sm:block">
                                <Badge variant="outline" className="rounded-sm font-mono text-xs py-1.5 px-3 bg-background/50">{order.items.length} Selections</Badge>
                            </div>
                        </div>
                    </div>

                    <div className="p-0">
                        <Table className="print:border-collapse">
                            <TableHeader className="bg-muted/5 print:bg-transparent">
                                <TableRow className="hover:bg-transparent border-white/5 print:border-black print:border-b">
                                    <TableHead className="font-heading uppercase text-[10px] font-black tracking-widest text-muted-foreground/60 pl-8 print:pl-0 print:text-black">Item Manifest</TableHead>
                                    <TableHead className="font-heading uppercase text-[10px] font-black tracking-widest text-muted-foreground/60 print:text-black">Material</TableHead>
                                    <TableHead className="font-heading uppercase text-[10px] font-black tracking-widest text-muted-foreground/60 text-right print:text-black">Qty</TableHead>
                                    <TableHead className="font-heading uppercase text-[10px] font-black tracking-widest text-muted-foreground/60 text-right print:text-black">Unit Rate</TableHead>
                                    <TableHead className="font-heading uppercase text-[10px] font-black tracking-widest text-muted-foreground/60 text-right pr-8 print:pr-0 print:text-black">Net Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {order.items.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-primary/[0.02] border-white/5 transition-all print:border-black print:border-b group">
                                        <TableCell className="pl-8 py-6 print:pl-0">
                                            <div className="text-foreground print:text-black font-bold text-lg tracking-tight group-hover:text-primary transition-colors">{item.furnitureType.name}</div>
                                            {item.notes && (
                                                <div className="flex items-center gap-2 mt-1.5 no-print">
                                                    <div className="w-1 h-3 bg-primary/30 rounded-full" />
                                                    <p className="text-xs text-muted-foreground italic font-medium">
                                                        {item.notes}
                                                    </p>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground print:text-black font-medium text-sm">
                                            {item.fabricTypes.map(f => f.name).join(", ")}
                                        </TableCell>
                                        <TableCell className="text-right font-bold print:text-black tabular-nums font-heading">x{item.quantity}</TableCell>
                                        <TableCell className="text-right font-heading text-muted-foreground print:text-black text-sm">
                                            Rs. {item.price.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right font-black pr-8 font-heading text-foreground print:text-black print:pr-0 text-lg">
                                            Rs. {(item.price * item.quantity).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="bg-primary/[0.02] hover:bg-primary/[0.04] border-white/5 print:bg-transparent print:border-t-2 print:border-black">
                                    <TableCell colSpan={4} className="text-right font-black font-heading uppercase text-xs tracking-[0.2em] pl-8 py-6 print:text-black opacity-60">
                                        Order Subtotal
                                    </TableCell>
                                    <TableCell className="text-right font-black text-2xl font-heading pr-8 text-primary print:text-black print:pr-0">
                                        Rs. {order.totalPrice.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Sidebar - Details */}
                <div className="space-y-6 print:grid print:grid-cols-2 print:gap-8 print:space-y-0 print:col-span-2 print:mt-4">
                    {/* Client Details */}
                    <PremiumCard
                        title="Client Profile"
                        description="Verified Customer"
                        icon={User}
                        delay={100}
                    >
                        <div className="space-y-6">
                            <DetailItem
                                label="Full Name"
                                value={order.client.name}
                                valueClassName="font-bold text-xl tracking-tight print:font-black"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <DetailItem
                                    label="Primary Contact"
                                    value={order.client.phone}
                                    valueClassName="font-bold text-primary font-heading"
                                />
                            </div>
                            {order.client.address && (
                                <DetailItem
                                    label="Shipping Address"
                                    value={order.client.address}
                                    valueClassName="text-sm leading-relaxed text-foreground/80 font-medium"
                                    className="pt-2 border-t border-white/5"
                                />
                            )}
                        </div>
                    </PremiumCard>

                    {/* Delivery & Payment Group for Print Layout */}
                    <div className="space-y-6 print:space-y-8">
                        {/* Delivery Info */}
                        <PremiumCard
                            title="Logistics"
                            description="Delivery Schedule"
                            icon={Truck}
                            iconClassName="bg-orange-500/10 border-orange-500/20 text-orange-500"
                            delay={200}
                        >
                            <div className="space-y-6">
                                <DetailItem
                                    label="Expected Delivery"
                                    value={
                                        <div>
                                            {format(new Date(order.deliveryDate), "PPP")}
                                            <div className="text-xs text-orange-500 font-bold uppercase tracking-widest bg-orange-500/10 w-fit px-2 py-0.5 rounded-sm mt-1 no-print">Confirmed Slot</div>
                                        </div>
                                    }
                                    valueClassName="font-bold text-lg print:font-black font-heading"
                                />
                                {order.notes && (
                                    <DetailItem
                                        label="Specific Requirements"
                                        value={order.notes}
                                        valueClassName="text-xs bg-muted/20 p-4 rounded-sm border border-white/5 italic text-muted-foreground/80 leading-relaxed print:bg-transparent print:border-black print:text-black print:p-0"
                                        className="pt-4 border-t border-white/5"
                                    />
                                )}
                            </div>
                        </PremiumCard>

                        {/* Payment Info */}
                        <PremiumCard
                            title="Financials"
                            description="Settlement Overview"
                            icon={CreditCard}
                            iconClassName="bg-green-500/10 border-green-500/20 text-green-500"
                            className="ring-1 ring-primary/10"
                            delay={300}
                        >
                            <div className="space-y-5">
                                <div className="flex justify-between items-center text-foreground print:text-black group">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-50 print:text-gray-600">Order Value</span>
                                    <span className="font-black font-heading text-base">
                                        Rs. {order.totalPrice.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center bg-green-500/[0.03] p-3 rounded-sm border border-green-500/10 print:bg-transparent print:border-none print:p-0">
                                    <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.2em] print:text-gray-600">Advance Paid</span>
                                    <span className="text-green-500 font-black font-heading text-base">
                                        - Rs. {order.advancePayment.toLocaleString()}
                                    </span>
                                </div>
                                <Separator className="bg-white/5 print:bg-black" />
                                <div className="flex flex-col gap-1.5 pt-2">
                                    <div className="flex justify-between items-end text-foreground print:text-black">
                                        <span className="text-xs font-black font-heading uppercase tracking-[0.3em] opacity-40">Outstanding Balance</span>
                                        <span className="text-3xl font-black font-heading text-accent print:text-black">
                                            Rs. {(order.totalPrice - order.advancePayment).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </PremiumCard>
                    </div>
                </div>
            </div>
        </div>
    );
}
