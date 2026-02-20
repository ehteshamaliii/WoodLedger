"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, CreditCard, Wallet, ArrowUpRight, ArrowDownLeft, Trash2, ShoppingCart, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column, FilterConfig, RowAction, BulkAction } from "@/components/shared/data-table";
import { StatsCard } from "@/components/dashboard/widgets/stats-card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Payment {
    id: string;
    account: {
        id: string;
        name: string;
        type: string;
    };
    order?: {
        id: string;
        orderNumber: string;
    } | null;
    orderId: string | null;
    amount: number;
    type: "CREDIT" | "DEBIT";
    description: string | null;
    date: string;
    createdAt: string;
}

export default function PaymentsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const toastRef = useRef(toast);
    toastRef.current = toast;
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    // Stable fetch — never recreated; uses toastRef to always have the latest toast fn
    const fetchPayments = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/payments?pageSize=200`);
            const result = await response.json();
            if (result.success) {
                setPayments(result.data);
            } else {
                toastRef.current({ title: "Error", description: result.error || "Failed to fetch payments", variant: "destructive" });
            }
        } catch {
            toastRef.current({ title: "Error", description: "Failed to fetch payments", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, []); // empty deps — fetchPayments reference is stable for component lifetime

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    const handleDelete = async (payment: Payment) => {
        const response = await fetch(`/api/payments/${payment.id}`, { method: "DELETE" });
        const result = await response.json();
        if (result.success) {
            toast({ title: "Success", description: "Payment deleted and balance reversed successfully" });
            fetchPayments();
        } else {
            toast({ title: "Error", description: result.error || "Failed to delete payment", variant: "destructive" });
        }
    };

    const credit = payments.filter(p => p.type === "CREDIT").reduce((sum, p) => sum + p.amount, 0);
    const debit = payments.filter(p => p.type === "DEBIT").reduce((sum, p) => sum + p.amount, 0);
    const net = credit - debit;

    const columns: Column<Payment>[] = [
        {
            header: "Date",
            accessorKey: "date",
            sortable: true,
            render: (payment) => (
                <div className="text-sm font-medium text-muted-foreground">
                    {format(new Date(payment.date), "MMM dd, yyyy")}
                </div>
            )
        },
        {
            header: "Account",
            sortable: false,
            render: (payment) => (
                <div className="font-bold text-foreground">{payment.account.name}</div>
            )
        },
        {
            header: "Description",
            hideable: true,
            render: (payment) => (
                <div className="max-w-xs truncate text-sm text-muted-foreground italic">
                    {payment.description || "No description"}
                </div>
            )
        },
        {
            header: "Order",
            hideable: true,
            render: (payment) => (
                payment.orderId ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/orders/${payment.orderId}`); }}
                        className="group"
                    >
                        <Badge
                            variant="outline"
                            className="font-bold text-[10px] tracking-wider gap-1.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 hover:bg-sky-500/20 transition-colors cursor-pointer"
                        >
                            <ShoppingCart className="h-3 w-3 shrink-0" />
                            {payment.order?.orderNumber ?? "Linked"}
                        </Badge>
                    </button>
                ) : (
                    <span className="text-muted-foreground/30 text-xs font-bold tracking-widest flex items-center gap-1">
                        <Link2 className="h-3 w-3" />
                        —
                    </span>
                )
            )
        },
        {
            header: "Type",
            accessorKey: "type",
            sortable: true,
            render: (payment) => (
                <Badge
                    variant="outline"
                    className={cn(
                        "font-bold uppercase tracking-wider text-[10px] px-2",
                        payment.type === "CREDIT"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/30"
                            : "bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/30"
                    )}
                >
                    {payment.type === "CREDIT" ? (
                        <span className="flex items-center gap-1"><ArrowUpRight className="h-3 w-3" /> Credit</span>
                    ) : (
                        <span className="flex items-center gap-1"><ArrowDownLeft className="h-3 w-3" /> Debit</span>
                    )}
                </Badge>
            )
        },
        {
            header: "Amount",
            headerClassName: "text-right",
            className: "text-right font-mono font-bold",
            accessorKey: "amount",
            sortable: true,
            render: (payment) => (
                <span className={payment.type === "CREDIT" ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"}>
                    {payment.type === "CREDIT" ? "+" : "-"} Rs. {payment.amount.toLocaleString()}
                </span>
            )
        },
    ];

    const filterConfig: FilterConfig = {
        search: {
            enabled: true,
            placeholder: "Search by account or description...",
            searchFields: ["account.name", "description"],
        },
        selects: [
            {
                key: "type",
                label: "Type",
                options: [
                    { label: "Credit (In)", value: "CREDIT" },
                    { label: "Debit (Out)", value: "DEBIT" },
                ],
            },
        ],
        dateRange: {
            enabled: true,
            key: "date",
            label: "Payment Date",
        },
    };

    const rowActions: RowAction<Payment>[] = [
        {
            type: "view",
            label: "View Details",
            onClick: (payment) => router.push(`/payments/${payment.id}/view`),
        },
        {
            type: "edit",
            label: "Edit Payment",
            onClick: (payment) => router.push(`/payments/${payment.id}`),
        },
        {
            type: "delete",
            label: "Delete Payment",
            onClick: handleDelete,
            confirmation: {
                title: "Reverse Payment",
                description: (p) => `Delete this ${p.type === "CREDIT" ? "credit" : "debit"} of Rs. ${p.amount.toLocaleString()}? This will immediately reverse the associated account balance.`,
            },
        },
    ];

    const bulkActions: BulkAction<Payment>[] = [
        {
            label: "Delete Selected",
            icon: Trash2,
            variant: "destructive",
            confirmation: {
                title: "Delete Payments",
                description: "Are you sure you want to delete the selected payments? All balances will be reversed.",
            },
            onClick: async (selectedItems) => {
                try {
                    await Promise.all(selectedItems.map(p =>
                        fetch(`/api/payments/${p.id}`, { method: "DELETE" })
                    ));
                    toast({ title: "Success", description: "Payments deleted successfully" });
                    fetchPayments();
                } catch {
                    toast({ title: "Error", description: "Failed to delete some payments", variant: "destructive" });
                }
            },
        },
    ];

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 page-enter">
            <DataTable
                data={payments}
                columns={columns}
                isLoading={loading}
                rowIdKey="id"
                title="Payments"
                description="Track all financial transactions and bank accounts"
                headerActions={
                    <Button
                        variant="secondary"
                        onClick={() => router.push("/payments/new")}
                        className="shadow-lg shadow-secondary/20 hover:scale-105 transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        New Payment
                    </Button>
                }
                statsCards={
                    <div className="grid gap-4 md:grid-cols-3">
                        <StatsCard
                            title="Total Credits"
                            value={`Rs. ${credit.toLocaleString()}`}
                            icon={ArrowUpRight}
                            description="Incoming funds"
                            variant="secondary"
                        />
                        <StatsCard
                            title="Total Debits"
                            value={`Rs. ${debit.toLocaleString()}`}
                            icon={ArrowDownLeft}
                            description="Outgoing expenses"
                            variant="destructive"
                        />
                        <StatsCard
                            title="Net Cash Flow"
                            value={`Rs. ${net.toLocaleString()}`}
                            icon={Wallet}
                            description="Balance of money remaining"
                            variant={net >= 0 ? "secondary" : "destructive"}
                        />
                    </div>
                }
                sectionTitle="Recent Transactions"
                sectionDescription="Historical view of all payments"
                filterConfig={filterConfig}
                rowActions={rowActions}
                bulkActions={bulkActions}
                emptyTitle="No transactions found"
                emptyDescription="Start recording your financial flow"
                emptyIcon={<CreditCard className="h-16 w-16 text-muted-foreground/20" />}
            />
        </div>
    );
}
