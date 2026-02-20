"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TypeForm, TypeFormData } from "@/components/types/type-form";
import { useToast } from "@/hooks/use-toast";

export default function NewFabricTypePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data: TypeFormData) => {
        try {
            setLoading(true);
            const response = await fetch("/api/fabric-types", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (result.success) {
                toast({ title: "Success", description: "Fabric type created successfully" });
                router.push("/types?tab=fabric");
            } else {
                toast({ title: "Error", description: result.error || "Failed to create type", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to create type", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 space-y-6 px-4 md:px-8 pt-6 pb-24 page-enter">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-primary/10 hover:text-primary transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <ImageIcon className="h-6 w-6 text-primary/60" />
                            <h2 className="text-3xl font-bold tracking-tight font-heading uppercase">Add Fabric Type</h2>
                        </div>
                        <p className="text-muted-foreground">Define a new fabric category</p>
                    </div>
                </div>
            </div>

            <div className="mx-auto">
                <TypeForm type="fabric" onSubmit={onSubmit} isLoading={loading} />
            </div>
        </div>
    );
}
