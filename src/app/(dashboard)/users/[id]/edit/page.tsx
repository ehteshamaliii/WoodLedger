"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shield, Save, X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/shared/page-header";
import { PremiumCard } from "@/components/shared/premium-card";
import { FormSection } from "@/components/shared/form-section";
import { FormInput } from "@/components/shared/form-input";
import { FormSelect } from "@/components/shared/form-select";
import { StickyFooter } from "@/components/shared/sticky-footer";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().optional().refine(val => !val || val.length >= 8, "Password must be at least 8 characters if provided"),
    roleId: z.string().min(1, "Role is required"),
    isActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface Role {
    id: string;
    name: string;
}

export default function EditUserPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [roles, setRoles] = useState<Role[]>([]);

    const userId = params?.id as string;

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
        const fetchData = async () => {
            if (!userId) return;

            try {
                const [userRes, rolesRes] = await Promise.all([
                    fetch(`/api/users/${userId}`),
                    fetch("/api/roles")
                ]);

                const userData = await userRes.json();
                const rolesData = await rolesRes.json();

                if (rolesData.success) {
                    setRoles(rolesData.data);
                }

                if (userData.success) {
                    const user = userData.data;
                    form.reset({
                        name: user.name,
                        email: user.email,
                        password: "", // Don't populate password
                        roleId: user.roleId,
                        isActive: user.isActive,
                    });
                } else {
                    toast({
                        title: "Error",
                        description: "Failed to load user data",
                        variant: "destructive",
                    });
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
                toast({
                    title: "Error",
                    description: "An unexpected error occurred",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [userId, form, toast]);

    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        try {
            // Remove password from payload if it's empty to preserve the existing one
            const payload = { ...data };
            if (!payload.password) {
                delete payload.password;
            }

            const response = await fetch(`/api/users/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (result.success) {
                toast({
                    title: "Success",
                    description: "User updated successfully",
                });
                router.push("/users");
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to update user",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error updating user:", error);
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const isActive = form.watch("isActive");

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 page-enter pb-32">
            <PageHeader
                title="Edit User"
                subtitle="Modify user information and access rights"
            />

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
                   
                        <FormSection
                            title="User Information"
                            description="Basic details and role assignment for the user."
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
                                    label="New Password"
                                    type="password"
                                    placeholder="•••••••• (Leave empty to keep current)"
                                />
                                <FormSelect<FormValues>
                                    control={form.control}
                                    name="roleId"
                                    label="Role"
                                    options={roles.map(r => ({ label: r.name, value: r.id }))}
                                    placeholder="Select a role"
                                />

                                <div className="md:col-span-2 mt-4 p-4 border rounded-lg bg-muted/20">
                                    <FormField
                                        control={form.control}
                                        name="isActive"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base font-bold">Active Status</FormLabel>
                                                    <p className="text-sm text-muted-foreground">
                                                        {isActive
                                                            ? "User can log in and access the system."
                                                            : "User is disabled and cannot log in. Active sessions will be revoked."}
                                                    </p>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </FormSection>
                    
                    <StickyFooter entityName="User" isEdit={true} onCancel={() => router.push("/users")} />
                </form>
            </Form>
        </div>
    );
}
