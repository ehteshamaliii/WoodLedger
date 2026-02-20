"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientForm, ClientFormData } from "@/components/clients/client-form";
import { useToast } from "@/hooks/use-toast";

export default function NewClientPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data: ClientFormData) => {
        try {
            setLoading(true);
            const response = await fetch("/api/clients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Client created successfully",
                });
                router.push("/clients");
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to create client",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create client",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

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
                            <UserPlus className="h-6 w-6 text-primary/60" />
                            <h2 className="text-3xl font-bold tracking-tight font-heading uppercase">Add Client</h2>
                        </div>
                        <p className="text-muted-foreground">Register a new customer to the system</p>
                    </div>
                </div>
            </div>

            <div className="mx-auto">
                <ClientForm onSubmit={onSubmit} isLoading={loading} />
            </div>
        </div>
    );
}
