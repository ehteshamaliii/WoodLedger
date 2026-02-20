import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, Settings2, Scaling } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WidgetWrapperProps {
    id: string;
    isEditing: boolean;
    onRemove?: (id: string) => void;
    onSettings?: (id: string) => void;
    onResize?: (id: string) => void;
    children: React.ReactNode;
    className?: string;
    item: any; // The widget config item
}

export function WidgetWrapper({ id, isEditing, onRemove, onSettings, onResize, children, className, item }: WidgetWrapperProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        opacity: isDragging ? 0.3 : 1,
    };

    // Calculate column and row spans based on widget type/config
    const colSpan = item.w === 4 ? "lg:col-span-4" : item.w === 3 ? "lg:col-span-3" : item.w === 2 ? "lg:col-span-2" : "lg:col-span-1";
    const rowSpan = item.h === 3 ? "lg:row-span-3" : item.h === 2 ? "lg:row-span-2" : "lg:row-span-1";

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative group h-full",
                colSpan,
                rowSpan,
                className
            )}
        >
            {isEditing && (
                <div className="absolute top-2 right-2 z-50 flex gap-1 animate-in fade-in zoom-in duration-200">
                    {onResize && (
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-sm bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 shadow-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100"
                            onClick={() => onResize(id)}
                            title="Resize Widget"
                        >
                            <Scaling className="h-4 w-4" />
                        </Button>
                    )}
                    {onSettings && (
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-sm bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 shadow-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100"
                            onClick={() => onSettings(id)}
                        >
                            <Settings2 className="h-4 w-4" />
                        </Button>
                    )}
                    {onRemove && (
                        <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 rounded-sm shadow-sm opacity-90 hover:opacity-100"
                            onClick={() => onRemove(id)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            )}

            {isEditing && (
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute top-2 left-2 z-50 cursor-grab active:cursor-grabbing p-1.5 rounded-sm bg-background/80 backdrop-blur border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
            )}

            <div className={cn(
                "h-full w-full transition-all duration-300",
                isEditing && "ring-2 ring-primary/20 ring-offset-2 ring-offset-background rounded-sm"
            )}>
                {children}
            </div>

            {isEditing && (
                <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-primary/20 rounded-sm" />
            )}
        </div>
    );
}
