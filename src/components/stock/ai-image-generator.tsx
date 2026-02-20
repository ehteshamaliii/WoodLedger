"use client";

import { useState } from "react";
import { Sparkles, Loader2, Image as ImageIcon, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

interface AIImageGeneratorProps {
    onImageGenerated: (url: string) => void;
    initialPrompt?: string;
    entityId?: string;
    entityType?: "STOCK" | "FABRIC";
}

export function AIImageGenerator({ onImageGenerated, initialPrompt = "", entityId, entityType }: AIImageGeneratorProps) {
    const [prompt, setPrompt] = useState(initialPrompt);
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [referenceImage, setReferenceImage] = useState<string | null>(null);
    const { toast } = useToast();

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReferenceImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast({
                title: "Error",
                description: "Please enter a prompt for the AI",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsGenerating(true);
            const response = await fetch("/api/ai/generate-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt,
                    entityId,
                    entityType,
                    referenceImage // Base64 string
                }),
            });

            const result = await response.json();

            if (result.success) {
                setPreviewUrl(result.data.url);
                toast({
                    title: "Success",
                    description: "AI image generated successfully!",
                });
            } else {
                throw new Error(result.error || "Generation failed");
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleConfirm = () => {
        if (previewUrl) {
            onImageGenerated(previewUrl);
            toast({
                title: "Applied",
                description: "Generated image applied to the item.",
            });
        }
    };

    return (
        <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI Image Generator
                </CardTitle>
                <CardDescription className="text-xs">
                    Generate high-quality product images using AI
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <div className="flex-1 space-y-2">
                        <Input
                            placeholder="e.g., A minimalist wooden dining chair with velvet cushion..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="text-sm bg-background"
                            disabled={isGenerating}
                        />
                        <div className="flex items-center gap-2">
                            <Label htmlFor="ref-image" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                Reference Image (Optional)
                            </Label>
                            <Input
                                id="ref-image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                            <Button
                                variant="outline"
                                size="xs"
                                onClick={() => document.getElementById("ref-image")?.click()}
                                className="h-6"
                            >
                                <ImageIcon className="h-3 w-3 mr-1" />
                                {referenceImage ? "Change Image" : "Upload Reference"}
                            </Button>
                            {referenceImage && (
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={() => setReferenceImage(null)}
                                    className="h-6 text-destructive"
                                >
                                    Remove
                                </Button>
                            )}
                        </div>
                    </div>
                    <Button
                        size="sm"
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt}
                        className="shrink-0 h-9"
                    >
                        {isGenerating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            "Generate"
                        )}
                    </Button>
                </div>

                {referenceImage && !previewUrl && (
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border bg-muted group mt-2">
                        <img
                            src={referenceImage}
                            alt="Reference"
                            className="object-contain w-full h-full opacity-50"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest bg-background/80 px-2 py-1 rounded">Reference Image Loaded</p>
                        </div>
                    </div>
                )}

                {previewUrl ? (
                    <div className="space-y-3">
                        <div className="relative aspect-square w-full rounded-lg overflow-hidden border bg-muted">
                            <img
                                src={previewUrl}
                                alt="AI Generated Preview"
                                className="object-cover w-full h-full"
                            />
                        </div>
                        <div className="flex gap-2 flex-col">
                            <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setPreviewUrl(null)}>
                                <RefreshCw className="h-4 w-4" />
                                Try Again
                            </Button>
                            <Button size="sm" className="w-full gap-2" onClick={handleConfirm}>
                                <Check className="h-4 w-4" />
                                Use This Image
                            </Button>
                        </div>
                    </div>
                ) : !referenceImage && (
                    <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg border-muted-foreground/20 text-muted-foreground">
                        <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-[10px] uppercase font-bold tracking-widest opacity-50">Preview</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
