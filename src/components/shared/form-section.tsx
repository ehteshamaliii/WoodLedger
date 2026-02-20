"use client";

import { ReactNode, ElementType } from "react";
import { cn } from "@/lib/utils";

interface FormSectionProps {
    title?: string;
    description?: string;
    icon?: ReactNode | ElementType;
    children: ReactNode;
    className?: string;
}

export function FormSection({
    title,
    description,
    icon: Icon,
    children,
    className
}: FormSectionProps) {
    const renderIcon = () => {
        if (!Icon) return null;

        // If it's a component (function or forwardRef object)
        if (typeof Icon === 'function' || (typeof Icon === 'object' && 'render' in Icon)) {
            const IconComp = Icon as ElementType;
            return <IconComp className="h-5 w-5 text-primary" />;
        }

        // If it's already a React element (e.g. <Icon />)
        return Icon;
    };

    return (
        <div className={cn("glass-card p-6 space-y-6", className)}>
            {(title || description || Icon) && (
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    {Icon && (
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            {renderIcon()}
                        </div>
                    )}
                    <div className="space-y-0.5">
                        {title && (
                            <h3 className="text-lg font-bold font-heading uppercase tracking-wide">
                                {title}
                            </h3>
                        )}
                        {description && (
                            <p className="text-sm text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
            )}
            <div className="space-y-4">
                {children}
            </div>
        </div>
    );
}
