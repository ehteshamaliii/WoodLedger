"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    ArrowLeft, Pencil, CreditCard, ArrowUpRight, ArrowDownLeft,
    Calendar, FileText, Wallet, Loader2, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PremiumCard } from "@/components/shared/premium-card";
import { DetailItem } from "@/components/shared/detail-item";

interface Payment {
    id: string;
    account: { id: string; name: string; type: string; balance: number };
    orderId: string | null;
    order: { id: string; orderNumber: string } | null;
    amount: number;
    type: "CREDIT" | "DEBIT";
    description: string | null;
    date: string;
    createdAt: string;
}

export default function PaymentViewPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const [payment, setPayment] = useState<Payment | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (params.id) fetchPayment();
    }, [params.id]);

    const fetchPayment = async () => {
        try {
            const res = await fetch(`/api/payments/${params.id}`);
            const result = await res.json();
            if (result.success) {
                setPayment(result.data);
            } else {
                toast({ title: "Error", description: "Payment not found", variant: "destructive" });
                router.push("/payments");
            }
        } catch {
            toast({ title: "Error", description: "Failed to fetch payment", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Delete this payment? The account balance will be reversed.")) return;
        try {
            setDeleting(true);
            const res = await fetch(`/api/payments/${params.id}`, { method: "DELETE" });
            const result = await res.json();
            if (result.success) {
                toast({ title: "Success", description: "Payment deleted and balance reversed" });
                router.push("/payments");
            } else {
                toast({ title: "Error", description: result.error || "Failed to delete", variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Failed to delete payment", variant: "destructive" });
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!payment) return null;

    const isCredit = payment.type === "CREDIT";

    return (
        <div className="flex-1 space-y-10 p-4 md:p-8 pt-6 page-enter pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
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
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className={cn(
                                "text-4xl font-bold tracking-tight font-heading bg-clip-text text-transparent uppercase",
                                isCredit
                                    ? "bg-gradient-to-r from-emerald-500 to-emerald-400/60"
                                    : "bg-gradient-to-r from-red-500 to-red-400/60"
                            )}>
                                {isCredit ? "+" : "−"} Rs. {payment.amount.toLocaleString()}
                            </h1>
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-xs px-3 py-1 rounded-sm font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5",
                                    isCredit
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                        : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                                )}
                            >
                                {isCredit ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                                {isCredit ? "Credit" : "Debit"}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm sm:text-base">
                            <Calendar className="h-4 w-4 opacity-70" />
                            <span className="font-medium">{format(new Date(payment.date), "MMM dd, yyyy")}</span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30 mx-1" />
                            <span className="text-xs uppercase tracking-widest font-bold opacity-60">Transaction Record</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="h-11 px-5 rounded-sm font-bold gap-2 text-red-600 hover:bg-red-500/10 hover:border-red-500/30 border-red-200/50 dark:border-red-900/30 hover:text-red-600"
                    >
                        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Delete
                    </Button>
                    <Button
                        onClick={() => router.push(`/payments/${payment.id}/edit`)}
                        className="h-11 px-6 rounded-sm font-bold shadow-lg shadow-primary/20 hover-scale bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                    >
                        <Pencil className="h-4 w-4" />
                        Edit Payment
                    </Button>
                </div>
            </div>

            {/* Main grid */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Main card — transaction visual */}
                <div className="glass-card md:col-span-2 flex flex-col overflow-hidden border shadow-xl shadow-black/5">
                    <div className="p-6 border-b border-white/5 bg-muted/10">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "h-12 w-12 rounded-sm flex items-center justify-center border",
                                isCredit
                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                    : "bg-red-500/10 text-red-500 border-red-500/20"
                            )}>
                                {isCredit ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownLeft className="h-6 w-6" />}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold font-heading uppercase tracking-widest bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                    {isCredit ? "Incoming Credit" : "Outgoing Debit"}
                                </h3>
                                <p className="text-sm text-muted-foreground font-medium opacity-70 italic">
                                    {payment.description || "No description provided"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Big amount display area */}
                    <div className="flex-1 flex flex-col items-center justify-center p-12 gap-4">
                        <div className={cn(
                            "text-7xl font-black font-heading tracking-tight",
                            isCredit ? "text-emerald-500" : "text-red-500"
                        )}>
                            {isCredit ? "+" : "−"} Rs. {payment.amount.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground text-sm">
                            <Wallet className="h-4 w-4 opacity-60" />
                            <span className="font-medium">via <strong className="text-foreground">{payment.account.name}</strong></span>
                            {payment.orderId && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                    <span>linked to order</span>
                                    <button
                                        onClick={() => router.push(`/orders/${payment.orderId}`)}
                                        className="text-primary font-bold hover:underline"
                                    >
                                        #{payment.order?.orderNumber || payment.orderId.slice(-8).toUpperCase()}
                                    </button>
                                </>
                            )}
                        </div>
                        <p className="text-muted-foreground text-xs font-medium opacity-50 uppercase tracking-widest">
                            Recorded {format(new Date(payment.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                        </p>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <PremiumCard title="Transaction Details" description="Payment breakdown" icon={CreditCard} delay={100}>
                        <div className="space-y-5">
                            <DetailItem
                                label="Amount"
                                value={`Rs. ${payment.amount.toLocaleString()}`}
                                valueClassName={cn("font-black text-2xl font-heading", isCredit ? "text-emerald-500" : "text-red-500")}
                            />
                            <DetailItem
                                label="Type"
                                value={isCredit ? "Credit (Inflow)" : "Debit (Outflow)"}
                                valueClassName="font-bold text-lg"
                            />
                            <DetailItem
                                label="Payment Date"
                                value={format(new Date(payment.date), "MMMM dd, yyyy")}
                                valueClassName="font-medium"
                            />
                            {payment.description && (
                                <DetailItem
                                    label="Description"
                                    value={payment.description}
                                    valueClassName="text-sm font-medium italic text-muted-foreground"
                                />
                            )}
                        </div>
                    </PremiumCard>

                    <PremiumCard title="Account Details" description="Associated account" icon={Wallet} delay={200}>
                        <div className="space-y-4">
                            <DetailItem
                                label="Account Name"
                                value={payment.account.name}
                                valueClassName="font-bold text-lg tracking-tight"
                            />
                            <DetailItem
                                label="Account Type"
                                value={payment.account.type}
                                valueClassName="font-medium text-muted-foreground uppercase tracking-wider text-sm"
                            />
                            <div className="pt-3 border-t border-border/40">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Current Balance</p>
                                <p className={cn(
                                    "text-2xl font-black font-heading tracking-tight",
                                    Number(payment.account.balance) >= 0 ? "text-emerald-500" : "text-red-500"
                                )}>
                                    Rs. {Number(payment.account.balance).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </PremiumCard>

                    {payment.orderId && (
                        <PremiumCard title="Linked Order" description="Associated order" icon={FileText} delay={300}>
                            <div className="space-y-3">
                                <DetailItem
                                    label="Order Reference"
                                    value={`#${payment.order?.orderNumber || payment.orderId.slice(-8).toUpperCase()}`}
                                    valueClassName="font-mono font-bold text-primary text-lg"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full rounded-sm font-bold gap-2"
                                    onClick={() => router.push(`/orders/${payment.orderId}`)}
                                >
                                    View Order <ArrowUpRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </PremiumCard>
                    )}
                </div>
            </div>
        </div>
    );
}
