"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Armchair, FileText, Save, ImageIcon, Upload, Sparkles } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { FormInput } from "@/components/shared/form-input";
import { FormSection } from "@/components/shared/form-section";
import { StickyFooter } from "@/components/shared/sticky-footer";
import { useRouter } from "next/navigation";
import { AIImageGenerator } from "@/components/stock/ai-image-generator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRef } from "react";

const typeSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
});

export type TypeFormData = z.infer<typeof typeSchema>;

interface TypeFormProps {
    initialData?: Partial<TypeFormData>;
    onSubmit: (data: TypeFormData) => Promise<void>;
    isLoading?: boolean;
    isEdit?: boolean;
    type: "furniture" | "fabric";
    id?: string;
}

export function TypeForm({ initialData, onSubmit, isLoading, isEdit, type, id }: TypeFormProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const form = useForm<TypeFormData>({
        resolver: zodResolver(typeSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            imageUrl: initialData?.imageUrl || "",
        },
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            form.setValue("imageUrl", reader.result as string, { shouldDirty: true });
        };
        reader.readAsDataURL(file);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Form {...form}>
            <form id="type-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className={cn(
                    "grid gap-8",
                    type === "fabric" ? "lg:grid-cols-3" : "grid-cols-1"
                )}>
                    <div className={cn(type === "fabric" ? "lg:col-span-2" : "")}>
                        <FormSection
                            title="Basic Information"
                            description={`${type === "furniture" ? "Furniture" : "Fabric"} category details`}
                            icon={type === "furniture" ? <Armchair className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                        >
                            <FormInput
                                control={form.control}
                                name="name"
                                label="Category Name *"
                                placeholder={type === "furniture" ? "e.g., Sofa, Bed" : "e.g., Velvet, Leather"}
                                className="h-10"
                            />
                            <FormInput
                                control={form.control}
                                name="description"
                                label="Description"
                                icon={<FileText className="h-3.5 w-3.5" />}
                                placeholder="Optional description..."
                                type="textarea"
                                className="min-h-[120px]"
                            />
                        </FormSection>
                    </div>

                    {type === "fabric" && (
                        <div className="space-y-4 pt-1">
                            <FormSection
                                title="Visual Reference"
                                description="Reference image for this fabric"
                                icon={<ImageIcon className="h-5 w-5" />}
                            >

                                {!form.watch("imageUrl") && (
                                    <div className="flex flex-col gap-4">
                                        <Card className="border-primary/20 bg-primary/5">
                                            <CardHeader className="pb-3 text-center">
                                                <CardTitle className="text-sm flex items-center justify-center gap-2">
                                                    <ImageIcon className="h-4 w-4 text-primary" />
                                                    Visual Reference
                                                </CardTitle>
                                                <CardDescription className="text-xs">
                                                    Upload a photo or generate one with AI
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    ref={fileInputRef}
                                                    onChange={handleFileUpload}
                                                />
                                                <div
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg border-primary/30 bg-background/50 text-muted-foreground hover:bg-primary/5 hover:border-primary/50 cursor-pointer transition-colors"
                                                >
                                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                                        <Upload className="h-6 w-6 text-primary" />
                                                    </div>
                                                    <p className="text-sm font-bold uppercase tracking-widest text-primary/70">
                                                        Click to Browse
                                                    </p>
                                                    <p className="text-[10px] mt-1 opacity-60">PNG, JPG up to 5MB</p>
                                                </div>

                                                <div className="relative py-2">
                                                    <div className="absolute inset-0 flex items-center">
                                                        <span className="w-full border-t border-primary/10" />
                                                    </div>
                                                    <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
                                                        <span className="bg-[#f6f6f1] dark:bg-zinc-900 px-2 text-muted-foreground opacity-50">
                                                            Or
                                                        </span>
                                                    </div>
                                                </div>

                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="w-full h-11 border-primary/30 hover:bg-primary/10 text-dark hover:text-primary font-bold tracking-wide"
                                                        >
                                                            <Sparkles className="h-4 w-4" />
                                                            Generate with AI
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-xl border-primary/20 bg-card p-0 overflow-hidden">
                                                        <AIImageGenerator
                                                            entityId={id}
                                                            entityType="FABRIC"
                                                            initialPrompt={form.watch("name")}
                                                            onImageGenerated={(url) => form.setValue("imageUrl", url, { shouldDirty: true })}
                                                        />
                                                    </DialogContent>
                                                </Dialog>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {form.watch("imageUrl") && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Current Selection</p>
                                        <div className="relative rounded-sm overflow-hidden border border-white/10 shadow-inner group">
                                            <img src={form.watch("imageUrl")} className="object-cover w-full h-full" alt="Preview" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => form.setValue("imageUrl", "")}
                                                    className="h-8"
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </FormSection>
                        </div>
                    )}
                </div>

                <StickyFooter
                    isEdit={isEdit || false}
                    entityName={`${type === "furniture" ? "Furniture" : "Fabric"} Type`}
                    loading={isLoading}
                    onCancel={() => router.push(`/types?tab=${type}`)}
                    submitText={isEdit ? "Update Type" : "Create Type"}
                    submitIcon={<Save className="h-4 w-4" />}
                    formId="type-form"
                />
            </form>
        </Form>
    );
}
