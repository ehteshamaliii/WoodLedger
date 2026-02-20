import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface StickyFooterProps {
    show?: boolean;
    loading?: boolean;
    isEdit?: boolean;
    entityName: string;
    onCancel: () => void;
    submitText?: string;
    submitIcon?: React.ReactNode;
    formId?: string;
}

export function StickyFooter({
    show = true,
    loading,
    isEdit,
    entityName,
    onCancel,
    submitText,
    submitIcon,
    formId
}: StickyFooterProps) {
    const { state, isMobile } = useSidebar();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!show || !mounted) return null;

    return createPortal(
        <div
            className={cn(
                "fixed bottom-0 right-0 p-4 bg-background/95 supports-[backdrop-filter]:bg-background/80 backdrop-blur-xl border-t border-border/40 z-50 transition-all duration-300 ease-in-out",
                isMobile ? "left-0" : (state === "collapsed" ? "left-16" : "left-64")
            )}
        >
            <div className="mx-auto flex items-center justify-between">
                <div className="hidden md:block">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/40">
                        {entityName} • {isEdit ? "Update Mode" : "Creation Mode"}
                    </p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onCancel}
                        className="flex-1 md:flex-none font-bold uppercase tracking-widest text-[10px] h-11 px-8 hover:bg-muted hover:text-dark"
                    >
                        Discard Changes
                    </Button>
                    <Button
                        type="submit"
                        variant="default"
                        form={formId}
                        disabled={loading}
                        className="flex-1 md:flex-none h-11 px-12 hover:scale-[1.02] transition-all font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <div className="flex items-center gap-2">
                                {submitIcon}
                                <span>{submitText || (isEdit ? "Save Changes" : "Create")}</span>
                            </div>
                        )}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
}
