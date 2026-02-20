"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Armchair, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TypeForm, TypeFormData } from "@/components/types/type-form";
import { useToast } from "@/hooks/use-toast";

export default function EditFurnitureTypePage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [itemData, setItemData] = useState<any>(null);

    useEffect(() => {
        const fetchItem = async () => {
            try {
                const response = await fetch(`/api/furniture-types/${params.id}`);
                const result = await response.json();
                if (result.success) {
                    setItemData(result.data);
                } else {
                    toast({ title: "Error", description: "Failed to fetch details", variant: "destructive" });
                    router.push("/types?tab=furniture");
                }
            } catch (error) {
                toast({ title: "Error", description: "Failed to fetch details", variant: "destructive" });
            } finally {
                setFetching(false);
            }
        };

        if (params.id) fetchItem();
    }, [params.id]);

    const onSubmit = async (data: TypeFormData) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/furniture-types/${params.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (result.success) {
                toast({ title: "Success", description: "Furniture type updated successfully" });
                router.push("/types?tab=furniture");
            } else {
                toast({ title: "Error", description: result.error || "Failed to update type", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to update type", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="h-[70vh] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6 px-4 md:px-8 pt-6 pb-24 page-enter">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-primary/10 hover:text-primary transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <Armchair className="h-6 w-6 text-primary/60" />
                            <h2 className="text-3xl font-bold tracking-tight font-heading uppercase">Edit Furniture Type</h2>
                        </div>
                        <p className="text-muted-foreground">Manage details for {itemData?.name}</p>
                    </div>
                </div>
            </div>

            <div className="mx-auto">
                <TypeForm type="furniture" initialData={itemData} onSubmit={onSubmit} isLoading={loading} isEdit={true} />
            </div>
        </div>
    );
}
