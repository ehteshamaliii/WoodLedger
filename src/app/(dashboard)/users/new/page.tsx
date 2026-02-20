"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shield, Save, X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/shared/page-header";
import { PremiumCard } from "@/components/shared/premium-card";
import { FormSection } from "@/components/shared/form-section";
import { FormInput } from "@/components/shared/form-input";
import { FormSelect } from "@/components/shared/form-select";
import { StickyFooter } from "@/components/shared/sticky-footer";

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    roleId: z.string().min(1, "Role is required"),
    isActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface Role {
    id: string;
    name: string;
}

export default function NewUserPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [roles, setRoles] = useState<Role[]>([]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            roleId: "",
            isActive: true,
        },
    });

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await fetch("/api/roles");
                const data = await response.json();
                if (data.success) {
                    setRoles(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch roles:", error);
                toast({
                    title: "Error",
                    description: "Failed to load roles",
                    variant: "destructive",
                });
            }
        };

        fetchRoles();
    }, [toast]);

    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (result.success) {
                toast({
                    title: "Success",
                    description: "User created successfully",
                });
                router.push("/users");
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to create user",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error creating user:", error);
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 page-enter pb-32">
            <PageHeader
                title="Create New User"
                subtitle="Add a new user to the system"
            />

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
               
                        <FormSection
                            title="User Information"
                            description="Basic details for the new user account."
                            icon={Shield}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormInput<FormValues>
                                    control={form.control}
                                    name="name"
                                    label="Name"
                                    placeholder="Enter user name"
                                    required
                                />
                                <FormInput<FormValues>
                                    control={form.control}
                                    name="email"
                                    label="Email"
                                    type="email"
                                    placeholder="Enter email address"
                                    required
                                />
                                <FormInput<FormValues>
                                    control={form.control}
                                    name="password"
                                    label="Password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                />
                                <FormSelect<FormValues>
                                    control={form.control}
                                    name="roleId"
                                    label="Role"
                                    options={roles.map(r => ({ label: r.name, value: r.id }))}
                                    placeholder="Select a role"
                                />
                            </div>
                        </FormSection>
                    
                    <StickyFooter entityName="User" isEdit={false} onCancel={() => router.push("/users")} />
                </form>
            </Form>
        </div>
    );
}
