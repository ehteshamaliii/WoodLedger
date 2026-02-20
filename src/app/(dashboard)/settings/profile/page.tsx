"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserCircle, Shield, Loader2 } from "lucide-react";

import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/shared/page-header";
import { FormSection } from "@/components/shared/form-section";
import { FormInput } from "@/components/shared/form-input";
import { StickyFooter } from "@/components/shared/sticky-footer";
import { useAuthStore } from "@/stores/authStore";

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    currentPassword: z.string().optional(),
    newPassword: z.string()
        .optional()
        .refine(val => !val || val.length >= 6, "Password must be at least 6 characters if provided"),
});

type FormValues = z.infer<typeof formSchema>;

export default function ProfilePage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, setUser } = useAuthStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            currentPassword: "",
            newPassword: "",
        },
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch("/api/auth/me");
                const result = await response.json();

                if (result.success && result.data) {
                    form.reset({
                        name: result.data.name,
                        email: result.data.email,
                        currentPassword: "",
                        newPassword: "",
                    });
                } else {
                    toast({
                        title: "Error",
                        description: "Failed to load profile data",
                        variant: "destructive",
                    });
                }
            } catch (error) {
                console.error("Failed to fetch profile:", error);
                toast({
                    title: "Error",
                    description: "An unexpected error occurred while fetching your profile",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [form, toast]);

    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        try {
            const payload = { ...data };
            if (!payload.currentPassword) delete payload.currentPassword;
            if (!payload.newPassword) delete payload.newPassword;

            const response = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Profile updated successfully.",
                });

                // Update local auth state and reset password fields
                if (result.data) {
                    setUser(result.data);
                }

                form.setValue("currentPassword", "");
                form.setValue("newPassword", "");
            } else {
                toast({
                    title: "Update Failed",
                    description: result.error || "Failed to update profile",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error updating profile:", error);
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

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 page-enter pb-32">
            <PageHeader
                title="Profile Details"
                subtitle="Manage your personal information and security settings"
            />

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormSection
                        title="Personal Information"
                        description="Update your contact details and how you appear to others."
                        icon={UserCircle}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormInput<FormValues>
                                control={form.control}
                                name="name"
                                label="Full Name"
                                placeholder="Enter your full name"
                                required
                            />
                            <FormInput<FormValues>
                                control={form.control}
                                name="email"
                                label="Email Address"
                                type="email"
                                placeholder="Enter your email address"
                                required
                            />
                        </div>
                    </FormSection>

                    <FormSection
                        title="Security"
                        description="Change your password to keep your account secure."
                        icon={Shield}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormInput<FormValues>
                                control={form.control}
                                name="currentPassword"
                                label="Current Password"
                                type="password"
                                placeholder="Enter current password"
                            />
                            <FormInput<FormValues>
                                control={form.control}
                                name="newPassword"
                                label="New Password"
                                type="password"
                                placeholder="Enter new password"
                            />
                        </div>
                    </FormSection>

                    <StickyFooter entityName="Profile Details" isEdit={true} onCancel={() => router.push("/dashboard")} />
                </form>
            </Form>
        </div>
    );
}
