"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    ArrowLeft, Loader2, CreditCard, ArrowUpRight, ArrowDownLeft,
    Calendar, FileText, Wallet, BadgeDollarSign, Plus, ShoppingCart, AlertTriangle, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/shared/form-input";
import { FormSelect } from "@/components/shared/form-select";
import { FormSection } from "@/components/shared/form-section";
import { PremiumCard } from "@/components/shared/premium-card";
import { StickyFooter } from "@/components/shared/sticky-footer";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/ui/date-picker";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { useOffline } from "@/hooks/use-offline";
import { useConnectivity } from "@/providers/connectivity-provider";

const paymentSchema = z.object({
    accountId: z.string().min(1, "Select an account"),
    orderId: z.string().optional().nullable(),
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
    type: z.enum(["CREDIT", "DEBIT"]),
    description: z.string().optional(),
    date: z.string().min(1, "Select a date"),
});

type PaymentForm = z.infer<typeof paymentSchema>;

interface Account {
    id: string;
    name: string;
    type: string;
    balance: number;
}

interface PendingOrder {
    id: string;
    orderNumber: string;
    client: { id: string; name: string };
    status: string;
    totalPrice: number;
    paidSoFar: number;
    remaining: number;
}

export default function NewPaymentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { isOnline } = useConnectivity();
    const { queueAction } = useOffline();
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(true);

    // Read prefilled data from query params (set by order creation redirect)
    const fromOrder = searchParams.get("from") === "order";
    const preOrderId = searchParams.get("orderId") || null;
    const preAmount = parseFloat(searchParams.get("amount") || "0") || 0;
    const preType = (searchParams.get("type") || "CREDIT") as "CREDIT" | "DEBIT";
    const preDescription = searchParams.get("description") || "";

    const form = useForm<PaymentForm>({
        resolver: zodResolver(paymentSchema) as any,
        defaultValues: {
            accountId: "",
            orderId: preOrderId || null,
            amount: preAmount,
            type: preType,
            description: preDescription,
            date: new Date().toISOString(),
        },
    });

    useEffect(() => {
        fetchAccounts();
        fetchPendingOrders();
    }, []);

    // Once pendingOrders are loaded, set the orderId to the preselected one
    useEffect(() => {
        if (preOrderId && pendingOrders.length > 0) {
            form.setValue("orderId", preOrderId);
        }
    }, [pendingOrders, preOrderId]);

    const fetchAccounts = async () => {
        try {
            const res = await fetch("/api/accounts");
            const result = await res.json();
            if (result.success) setAccounts(result.data);
        } catch {
            toast({ title: "Error", description: "Failed to load accounts", variant: "destructive" });
        } finally {
            setLoadingAccounts(false);
        }
    };

    const fetchPendingOrders = async () => {
        try {
            const res = await fetch("/api/orders/pending-payments");
            const result = await res.json();
            if (result.success) setPendingOrders(result.data);
        } catch {
            // non-blocking, orders linking is optional
        }
    };

    const onSubmit = async (data: PaymentForm) => {
        const orderId = data.orderId === "__none__" ? null : data.orderId;
        // Guard: balance cap
        const linked = pendingOrders.find(o => o.id === orderId);
        if (linked && data.type === "CREDIT" && Number(data.amount) > linked.remaining) {
            toast({ title: "Amount exceeds balance", description: `Max payment for ${linked.orderNumber} is Rs. ${linked.remaining.toLocaleString()}`, variant: "destructive" });
            return;
        }

        // ─── OFFLINE PATH ──────────────────────────────────────────────
        if (!isOnline) {
            await queueAction({
                entity: 'PAYMENT',
                action: 'CREATE',
                data: {
                    id: `temp_${Date.now()}`,
                    ...data,
                    orderId,          // may be a temp_ order ID — syncData handles chaining
                    createdAt: new Date(),
                    date: data.date || new Date().toISOString(),
                },
            });
            toast({ title: "Saved offline", description: "Payment will sync when you're back online." });
            router.push("/payments");
            return;
        }

        // ─── ONLINE PATH ───────────────────────────────────────────────
        try {
            setLoading(true);
            const res = await fetch("/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, orderId }),
            });
            const result = await res.json();
            if (result.success) {
                toast({ title: "Success", description: "Payment recorded successfully" });
                router.push("/payments");
            } else {
                toast({ title: "Error", description: result.error || "Failed to record payment", variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Failed to record payment", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const selectedType = form.watch("type");
    const selectedAmount = form.watch("amount");
    const selectedAccountId = form.watch("accountId");
    const selectedOrderId = form.watch("orderId");
    const selectedAccount = accounts.find(a => a.id === selectedAccountId);
    const selectedOrder = pendingOrders.find(o => o.id === selectedOrderId);
    const overAmount = selectedOrder && selectedType === "CREDIT" && Number(selectedAmount) > selectedOrder.remaining;

    if (loadingAccounts) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 pb-24 page-enter">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/40 pb-6 mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-primary/10 hover:text-primary transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60 mb-1">
                            <CreditCard className="h-3 w-3" />
                            <span>Financial Transactions</span>
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter font-heading uppercase">Record Payment</h2>
                    </div>
                </div>
            </div>

            {/* Advance redirect banner */}
            {fromOrder && (
                <div className="flex items-start gap-3 p-4 rounded-sm border border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300 mb-2">
                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-bold text-sm">Advance Payment Recording</p>
                        <p className="text-xs opacity-80 mt-0.5">Your order was created successfully. Select an account below and click "Record Payment" to log the advance.</p>
                    </div>
                </div>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Left column */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Transaction Type */}
                            <FormSection title="Transaction Type" description="Choose the direction of funds" icon={ArrowUpRight}>
                                <FormField
                                    control={form.control as any}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => field.onChange("CREDIT")}
                                                    className={cn(
                                                        "flex items-center gap-3 p-4 rounded-sm border-2 transition-all text-left",
                                                        field.value === "CREDIT"
                                                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                            : "border-border/50 hover:border-emerald-500/30 hover:bg-emerald-500/5 text-muted-foreground"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-sm flex items-center justify-center shrink-0",
                                                        field.value === "CREDIT" ? "bg-emerald-500/20" : "bg-muted/50"
                                                    )}>
                                                        <ArrowUpRight className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm uppercase tracking-widest">Credit</p>
                                                        <p className="text-[11px] opacity-60 font-medium">Money coming in</p>
                                                    </div>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => field.onChange("DEBIT")}
                                                    className={cn(
                                                        "flex items-center gap-3 p-4 rounded-sm border-2 transition-all text-left",
                                                        field.value === "DEBIT"
                                                            ? "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400"
                                                            : "border-border/50 hover:border-red-500/30 hover:bg-red-500/5 text-muted-foreground"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-sm flex items-center justify-center shrink-0",
                                                        field.value === "DEBIT" ? "bg-red-500/20" : "bg-muted/50"
                                                    )}>
                                                        <ArrowDownLeft className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm uppercase tracking-widest">Debit</p>
                                                        <p className="text-[11px] opacity-60 font-medium">Money going out</p>
                                                    </div>
                                                </button>
                                            </div>
                                            <FormMessage className="text-[10px] font-bold uppercase tracking-tight text-destructive ml-1 mt-1" />
                                        </FormItem>
                                    )}
                                />
                            </FormSection>

                            {/* Payment Details */}
                            <FormSection title="Payment Details" description="Amount and scheduling" icon={BadgeDollarSign}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormInput
                                        control={form.control as any}
                                        name="amount"
                                        label="Amount (Rs.)"
                                        type="number"
                                        placeholder="0.00"
                                        min={0}
                                        step={0.01}
                                    />
                                    <FormField
                                        control={form.control as any}
                                        name="date"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1 flex items-center gap-2">
                                                    <Calendar className="h-3 w-3" />
                                                    Payment Date
                                                </FormLabel>
                                                <FormControl>
                                                    <DatePicker
                                                        date={field.value ? new Date(field.value) : undefined}
                                                        setDate={(date) => field.onChange(date ? date.toISOString() : "")}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[10px] font-bold uppercase tracking-tight text-destructive ml-1" />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormInput
                                    control={form.control as any}
                                    name="description"
                                    label="Description"
                                    placeholder="e.g. Invoice payment for Order #1234, Salary disbursement..."
                                    icon={<FileText className="h-3.5 w-3.5" />}
                                />
                            </FormSection>

                            {/* Account & Order */}
                            <FormSection title="Account & Order Link" description="Select account and optionally link to an order with pending balance" icon={Wallet}>
                                <FormSelect
                                    control={form.control as any}
                                    name="accountId"
                                    label="Account"
                                    placeholder="Select account..."
                                    options={accounts.map(a => ({
                                        label: `${a.name} — Rs. ${Number(a.balance).toLocaleString()}`,
                                        value: a.id,
                                    }))}
                                />

                                {/* Smart order select — only shows orders with remaining balance */}
                                <div className="space-y-2">
                                    <FormSelect
                                        control={form.control as any}
                                        name="orderId"
                                        label="Link to Order (optional)"
                                        placeholder={pendingOrders.length === 0 ? "No orders with pending balance" : "Select an order..."}
                                        disabled={pendingOrders.length === 0}
                                        options={[
                                            { label: "No order link", value: "__none__" },
                                            ...pendingOrders.map(o => ({
                                                label: `${o.orderNumber} — ${o.client.name} · Rs. ${o.remaining.toLocaleString()} remaining`,
                                                value: o.id,
                                            }))
                                        ]}
                                    />
                                    {/* Remaining balance panel */}
                                    {selectedOrder && (
                                        <div className={cn(
                                            "p-3 rounded-sm border text-sm flex items-start gap-2",
                                            overAmount
                                                ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                                                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                                        )}>
                                            {overAmount
                                                ? <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                                : <ShoppingCart className="h-4 w-4 mt-0.5 shrink-0" />
                                            }
                                            <div>
                                                <p className="font-bold text-xs uppercase tracking-wider">
                                                    {overAmount ? "Amount exceeds remaining balance" : "Invoice Breakdown"}
                                                </p>
                                                <p className="text-xs mt-0.5 opacity-80">
                                                    Total: Rs. {selectedOrder.totalPrice.toLocaleString()} · Paid: Rs. {selectedOrder.paidSoFar.toLocaleString()} · <strong>Remaining: Rs. {selectedOrder.remaining.toLocaleString()}</strong>
                                                </p>
                                                {overAmount && (
                                                    <button
                                                        type="button"
                                                        onClick={() => form.setValue("amount", selectedOrder.remaining)}
                                                        className="text-[10px] font-bold uppercase tracking-wider mt-1 underline underline-offset-2 hover:opacity-70"
                                                    >
                                                        Set to Rs. {selectedOrder.remaining.toLocaleString()}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </FormSection>
                        </div>

                        {/* Right column — live summary */}
                        <div>
                            <PremiumCard title="Transaction Summary" description="Live preview" icon={CreditCard} delay={100}>
                                <div className="space-y-4">
                                    <div className="p-4 rounded-sm border border-border/40 bg-muted/5 space-y-3">
                                        <div className={cn(
                                            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                                            selectedType === "CREDIT"
                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                                : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                                        )}>
                                            {selectedType === "CREDIT"
                                                ? <><ArrowUpRight className="h-3 w-3" /> Credit — Incoming</>
                                                : <><ArrowDownLeft className="h-3 w-3" /> Debit — Outgoing</>
                                            }
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Amount</p>
                                            <p className={cn(
                                                "text-3xl font-black font-heading tracking-tight",
                                                selectedType === "CREDIT" ? "text-emerald-500" : "text-red-500"
                                            )}>
                                                {selectedType === "CREDIT" ? "+" : "−"} Rs. {(Number(selectedAmount) || 0).toLocaleString()}
                                            </p>
                                        </div>
                                        {selectedAccount && (
                                            <div className="pt-3 border-t border-border/40">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Account</p>
                                                <p className="font-bold text-sm">{selectedAccount.name}</p>
                                                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                                                    Current: Rs. {Number(selectedAccount.balance).toLocaleString()}
                                                </p>
                                                <p className={cn("text-xs font-bold mt-1", selectedType === "CREDIT" ? "text-emerald-500" : "text-red-400")}>
                                                    After: Rs. {(
                                                        Number(selectedAccount.balance) + (selectedType === "CREDIT" ? 1 : -1) * (Number(selectedAmount) || 0)
                                                    ).toLocaleString()}
                                                </p>
                                            </div>
                                        )}
                                        {selectedOrder && (
                                            <div className="pt-3 border-t border-border/40">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Linked Order</p>
                                                <p className="font-bold text-sm">{selectedOrder.orderNumber}</p>
                                                <p className="text-xs text-muted-foreground">{selectedOrder.client.name}</p>
                                                <p className={cn("text-xs font-bold mt-1", overAmount ? "text-red-500" : "text-emerald-500")}>
                                                    {overAmount ? "⚠ Exceeds remaining" : `Rs. ${selectedOrder.remaining.toLocaleString()} remaining`}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </PremiumCard>
                        </div>
                    </div>

                    <StickyFooter
                        isEdit={false}
                        entityName="Payment"
                        loading={loading}
                        onCancel={() => router.back()}
                        submitText="Record Payment"
                        submitIcon={<Plus className="h-4 w-4" />}
                    />
                </form>
            </Form>
        </div>
    );
}
