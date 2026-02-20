"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientForm, ClientFormData } from "@/components/clients/client-form";
import { useToast } from "@/hooks/use-toast";

export default function EditClientPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [clientData, setClientData] = useState<any>(null);

    useEffect(() => {
        const fetchClient = async () => {
            try {
                const response = await fetch(`/api/clients/${params.id}`);
                const result = await response.json();
                if (result.success) {
                    setClientData(result.data);
                } else {
                    toast({
                        title: "Error",
                        description: "Failed to fetch client details",
                        variant: "destructive",
                    });
                    router.push("/clients");
                }
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to fetch client details",
                    variant: "destructive",
                });
            } finally {
                setFetching(false);
            }
        };

        if (params.id) {
            fetchClient();
        }
    }, [params.id]);

    const onSubmit = async (data: ClientFormData) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/clients/${params.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Client updated successfully",
                });
                router.push("/clients");
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to update client",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update client",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="h-[70vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse">Loading client details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6 px-4 md:px-8 pt-6 pb-24 page-enter">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <User className="h-6 w-6 text-primary/60" />
                            <h2 className="text-3xl font-bold tracking-tight font-heading uppercase">Edit Client</h2>
                        </div>
                        <p className="text-muted-foreground">Manage details for {clientData?.name}</p>
                    </div>
                </div>
            </div>

            <div className="mx-auto">
                <ClientForm
                    initialData={clientData}
                    onSubmit={onSubmit}
                    isLoading={loading}
                    isEdit={true}
                />
            </div>
        </div>
    );
}
