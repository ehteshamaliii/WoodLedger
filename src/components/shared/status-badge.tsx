"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
    Clock,
    CheckCircle2,
    Factory,
    RotateCcw,
    Truck,
    XCircle,
    ArrowUpRight,
    ArrowDownLeft,
    AlertTriangle,
    ShoppingCart,
    LucideIcon
} from "lucide-react";

export type StatusType =
    | "PENDING"
    | "CONFIRMED"
    | "IN_PRODUCTION"
    | "READY"
    | "DELIVERED"
    | "CANCELLED"
    | "CREDIT"
    | "DEBIT"
    | "LOW_STOCK"
    | "LINKED";

interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant: StatusType | string;
    icon?: LucideIcon;
    label?: string;
    showIcon?: boolean;
}

const statusConfig: Record<string, {
    label: string,
    icon: LucideIcon,
    className: string
}> = {
    PENDING: {
        label: "Pending",
        icon: Clock,
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
    },
    CONFIRMED: {
        label: "Confirmed",
        icon: ShoppingCart,
        className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
    },
    IN_PRODUCTION: {
        label: "In Production",
        icon: Factory,
        className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
    },
    READY: {
        label: "Ready",
        icon: CheckCircle2,
        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
    },
    DELIVERED: {
        label: "Delivered",
        icon: Truck,
        className: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30"
    },
    CANCELLED: {
        label: "Cancelled",
        icon: XCircle,
        className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
    },
    CREDIT: {
        label: "Credit",
        icon: ArrowUpRight,
        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/30"
    },
    DEBIT: {
        label: "Debit",
        icon: ArrowDownLeft,
        className: "bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/30"
    },
    LOW_STOCK: {
        label: "Low Stock",
        icon: AlertTriangle,
        className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30"
    },
    LINKED: {
        label: "Linked",
        icon: ShoppingCart,
        className: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30"
    }
};

export function StatusBadge({
    variant,
    icon: IconOverride,
    label: LabelOverride,
    showIcon = true,
    className,
    children,
    ...props
}: StatusBadgeProps) {
    const upperVariant = variant.toUpperCase();
    const config = statusConfig[upperVariant] || {
        label: variant,
        icon: RotateCcw,
        className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30"
    };

    const StatusIcon = IconOverride || config.icon;
    const label = LabelOverride || children || config.label;

    return (
        <div
            className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border font-bold uppercase tracking-wider text-[10px] backdrop-blur-sm transition-all whitespace-nowrap",
                config.className,
                className
            )}
            {...props}
        >
            {showIcon && <StatusIcon className="h-3 w-3 shrink-0" />}
            {label}
        </div>
    );
}
