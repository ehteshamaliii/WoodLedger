"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DetailItemProps {
    label: string;
    value: ReactNode;
    icon?: LucideIcon;
    className?: string;
    valueClassName?: string;
    labelClassName?: string;
}

export function DetailItem({
    label,
    value,
    icon: Icon,
    className,
    valueClassName,
    labelClassName,
}: DetailItemProps) {
    return (
        <div className={cn("space-y-1", className)}>
            <div className={cn("flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-50 mb-1 print:text-gray-600", labelClassName)}>
                {Icon && <Icon className="h-3 w-3 no-print" />}
                {label}
            </div>
            <div className={cn("text-base font-bold text-foreground print:text-black", valueClassName)}>
                {value}
            </div>
        </div>
    );
}
