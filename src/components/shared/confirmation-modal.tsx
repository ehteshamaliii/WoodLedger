"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmationModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    onConfirm: () => void;
    isDeleting?: boolean;
    confirmText?: string;
    cancelText?: string;
    variant?: "destructive" | "default" | "info";
}

export function ConfirmationModal({
    isOpen,
    onOpenChange,
    title,
    description,
    onConfirm,
    isDeleting = false,
    confirmText = "Delete",
    cancelText = "Cancel",
    variant = "destructive"
}: ConfirmationModalProps) {
    const getIcon = () => {
        switch (variant) {
            case "destructive": return AlertTriangle;
            case "default": return CheckCircle2;
            case "info": return Info;
            default: return AlertTriangle;
        }
    };

    const Icon = getIcon();

    const variantConfig = {
        destructive: {
            iconColor: "text-red-500",
            iconBg: "bg-red-500/10 border-red-500/20",
            confirmBg: "bg-red-600 hover:bg-red-700 !text-white",
        },
        info: {
            iconColor: "text-blue-500",
            iconBg: "bg-blue-500/10 border-blue-500/20",
            confirmBg: "bg-blue-600 hover:bg-blue-700 !text-white",
        },
        default: {
            iconColor: "text-emerald-500",
            iconBg: "bg-emerald-500/10 border-emerald-500/20",
            confirmBg: "bg-emerald-600 hover:bg-emerald-700 !text-white",
        },
    };

    const config = variantConfig[variant] ?? variantConfig.destructive;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] bg-background/95 backdrop-blur-xl border-white/5 shadow-2xl p-0 gap-0 overflow-hidden outline-none duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] rounded-[var(--radius-xl)]">
                {/* Icon + Title + Description */}
                <div className="flex flex-col items-center justify-center text-center p-8 pb-6 space-y-5">
                    <div className={cn(
                        "h-16 w-16 rounded-2xl flex items-center justify-center border shadow-lg backdrop-blur-md",
                        config.iconBg
                    )}>
                        <Icon className={cn("h-8 w-8 drop-shadow-sm", config.iconColor)} />
                    </div>

                    <DialogHeader className="space-y-2 w-full items-center">
                        <DialogTitle className="text-2xl font-heading font-bold tracking-tight text-foreground text-center">
                            {title}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-sm max-w-[300px] mx-auto leading-relaxed text-center">
                            {description}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Split Action Footer */}
                <DialogFooter className="grid grid-cols-2 gap-px border-t border-white/5 bg-white/5 p-0">
                    {/* Cancel — visible in both light & dark */}
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="h-14 rounded-none bg-muted/20 hover:bg-muted/60 text-foreground/70 hover:text-foreground font-heading uppercase tracking-wider text-[11px] transition-colors"
                        disabled={isDeleting}
                    >
                        {cancelText}
                    </Button>

                    {/* Confirm — always solid */}
                    <Button
                        variant="ghost"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className={cn(
                            "h-14 rounded-none font-heading uppercase tracking-wider text-[11px] font-bold transition-all",
                            config.confirmBg
                        )}
                    >
                        {isDeleting ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Processing...</span>
                            </div>
                        ) : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
