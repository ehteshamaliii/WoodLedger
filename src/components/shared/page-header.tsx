"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    children?: ReactNode;
    className?: string;
}

export function PageHeader({
    title,
    subtitle,
    children,
    className
}: PageHeaderProps) {
    return (
        <div className={cn("flex md:items-center justify-between flex-col md:flex-row gap-2", className)}>
            <div>
                <h2 className="text-3xl font-bold tracking-tight font-heading uppercase">
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-muted-foreground">
                        {subtitle}
                    </p>
                )}
            </div>
            {children && (
                <div className="flex items-center gap-2">
                    {children}
                </div>
            )}
        </div>
    );
}
