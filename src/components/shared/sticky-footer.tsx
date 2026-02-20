import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StickyFooterProps {
    show?: boolean;
    loading?: boolean;
    isEdit?: boolean;
    entityName: string;
    onCancel: () => void;
    submitText?: string;
    submitIcon?: React.ReactNode;
}

export function StickyFooter({
    show = true,
    loading,
    isEdit,
    entityName,
    onCancel,
    submitText,
    submitIcon
}: StickyFooterProps) {
    if (!show) return null;

    return (
        <div className="sticky bottom-0 left-0 right-0 p-4 bg-background/95 supports-[backdrop-filter]:bg-background/80 backdrop-blur-xl border-t border-border/40 z-50 mt-8 -mx-4 md:-mx-8 -mb-24">
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
        </div>
    );
}
