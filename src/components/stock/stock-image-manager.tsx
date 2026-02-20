"use client";

import { useState, useRef } from "react";
import { Sparkles, Loader2, Image as ImageIcon, Trash2, Plus, Upload, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

const AIImageGenerator = dynamic(() => import("./ai-image-generator").then(mod => mod.AIImageGenerator), {
    ssr: false,
    loading: () => <div className="h-[200px] w-full animate-pulse bg-muted/20 border border-white/5 rounded-sm" />
});

interface StockImageManagerProps {
    images: string[];
    onImagesChange: (images: string[]) => void;
    productName: string;
    entityId?: string;
}

export function StockImageManager({ images, onImagesChange, productName, entityId }: StockImageManagerProps) {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const base64Promises = files.map(file => {
            return new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve(reader.result as string);
                };
                reader.readAsDataURL(file);
            });
        });

        const newImages = await Promise.all(base64Promises);
        onImagesChange([...images, ...newImages]);

        toast({
            title: "Success",
            description: `Added ${files.length} photo(s)`,
        });

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        onImagesChange(newImages);
    };

    const handleAIGenerated = (url: string) => {
        onImagesChange([...images, url]);
        setIsDialogOpen(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                        Product Gallery ({images.length}/10)
                    </h3>
                </div>
                <div className="flex gap-2">
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-8 text-[10px] font-bold uppercase tracking-wider"
                    >
                        <Plus className="h-3 w-3 mr-2" />
                        Add more photos
                    </Button>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="h-8 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                            >
                                <Wand2 className="h-3 w-3 mr-2" />
                                AI Gen
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-card border-border/40 shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="font-heading uppercase tracking-wider text-xl">AI Product Visualizer</DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                    Generate professional catalog photos using your product as a reference.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="pt-4">
                                <AIImageGenerator
                                    onImageGenerated={handleAIGenerated}
                                    initialPrompt={productName}
                                    entityId={entityId}
                                    entityType="STOCK"
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="relative group">
                <div className={cn(
                    "flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x pointer-events-auto",
                    images.length === 0 && "justify-center"
                )}>
                    {images.map((img, index) => (
                        <div
                            key={index}
                            className="relative flex-none w-48 aspect-square rounded-sm overflow-hidden border border-border/40 bg-card snap-start group/img"
                        >
                            <img
                                src={typeof img === 'string' ? img : (img as any).base64}
                                alt={`Product image ${index + 1}`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity" />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 h-7 w-7 rounded-sm opacity-0 group-hover/img:opacity-100 transition-all hover:scale-110"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    ))}

                    {images.length === 0 && (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-48 rounded-sm border-2 border-dashed border-border/40 bg-muted/20 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/40 transition-colors"
                        >
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
                                <Plus className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">
                                Add Product Images
                            </p>
                        </div>
                    )}
                </div>

                {images.length > 0 && (
                    <div className="absolute -left-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity inset-y-0 flex items-center">
                        <div className="h-20 w-8 bg-gradient-to-r from-background to-transparent" />
                    </div>
                )}
                {images.length > 0 && (
                    <div className="absolute -right-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity inset-y-0 flex items-center">
                        <div className="h-20 w-8 bg-gradient-to-l from-background to-transparent" />
                    </div>
                )}
            </div>
        </div>
    );
}
