"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface PremiumCardProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    badge?: string;
    children: ReactNode;
    className?: string;
    iconClassName?: string;
    headerClassName?: string;
    delay?: number;
    noPrint?: boolean;
}

export function PremiumCard({
    title,
    description,
    icon: Icon,
    badge,
    children,
    className,
    iconClassName,
    headerClassName,
    delay = 100,
    noPrint = false,
}: PremiumCardProps) {
    return (
        <div
            className={cn(
                "glass-card border shadow-xl shadow-black/5 animate-in fade-in slide-in-from-right-4 duration-500 overflow-hidden",
                className,
                noPrint && "no-print"
            )}
            style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
        >
            <div className={cn("p-8 border-b border-white/5 bg-muted/5 print:border-black print:p-0 print:border-none print:shadow-none print:bg-transparent", headerClassName)}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {Icon && (
                            <div className={cn("h-10 w-10 rounded-sm bg-primary/10 flex items-center justify-center border border-primary/20 no-print text-primary", iconClassName)}>
                                <Icon className="h-5 w-5" />
                            </div>
                        )}
                        <div>
                            <h3 className="font-black font-heading uppercase tracking-[0.2em] text-xs print:text-black opacity-70">{title}</h3>
                            {description && (
                                <p className="text-xs text-muted-foreground font-bold no-print uppercase tracking-tighter opacity-40">{description}</p>
                            )}
                        </div>
                    </div>
                    {badge && (
                        <Badge variant="outline" className="rounded-sm font-bold uppercase tracking-widest text-[10px] bg-background/50 no-print">
                            {badge}
                        </Badge>
                    )}
                </div>
            </div>
            <div className="p-8 print:p-0">
                {children}
            </div>
        </div>
    );
}
