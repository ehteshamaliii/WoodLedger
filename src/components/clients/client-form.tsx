"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Phone, MapPin, FileText, Save, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/shared/form-input";
import { FormSection } from "@/components/shared/form-section";
import { StickyFooter } from "@/components/shared/sticky-footer";
import { useRouter } from "next/navigation";

const clientSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    address: z.string().optional(),
    notes: z.string().optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
    initialData?: Partial<ClientFormData>;
    onSubmit: (data: ClientFormData) => Promise<void>;
    isLoading?: boolean;
    isEdit?: boolean;
}

export function ClientForm({ initialData, onSubmit, isLoading, isEdit }: ClientFormProps) {
    const router = useRouter();
    const form = useForm<ClientFormData>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: initialData?.name || "",
            phone: initialData?.phone || "",
            email: initialData?.email || "",
            address: initialData?.address || "",
            notes: initialData?.notes || "",
        },
    });

    return (
        <Form {...form}>
            <form id="client-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormSection
                    title="Basic Information"
                    description="Client's primary contact details"
                    icon={<User className="h-5 w-5" />}
                >
                    <div className="grid gap-6 md:grid-cols-2">
                        <FormInput
                            control={form.control}
                            name="name"
                            label="Full Name *"
                            icon={<User className="h-3.5 w-3.5" />}
                            placeholder="e.g., Mohammad Ahmad"
                            className="h-10"
                        />
                        <FormInput
                            control={form.control}
                            name="phone"
                            label="Phone Number *"
                            icon={<Phone className="h-3.5 w-3.5" />}
                            placeholder="e.g., 0300-1234567"
                            className="h-10 font-mono"
                        />
                    </div>
                    <FormInput
                        control={form.control}
                        name="email"
                        label="Email Address"
                        icon={<FileText className="h-3.5 w-3.5" />}
                        placeholder="e.g., client@example.com"
                        className="h-10"
                    />
                </FormSection>

                <FormSection
                    title="Location & Extra Details"
                    description="Additional information for this client"
                    icon={<MapPin className="h-5 w-5" />}
                >
                    <FormInput
                        control={form.control}
                        name="address"
                        label="Shipping/Billing Address"
                        icon={<MapPin className="h-3.5 w-3.5" />}
                        placeholder="e.g., House #123, Block A, Gulberg III, Lahore"
                        type="textarea"
                        className="min-h-[100px]"
                    />
                    <FormInput
                        control={form.control}
                        name="notes"
                        label="Additional Notes"
                        icon={<FileText className="h-3.5 w-3.5" />}
                        placeholder="Any special instructions or preferences..."
                        type="textarea"
                        className="min-h-[100px]"
                    />
                </FormSection>

                <StickyFooter
                    isEdit={isEdit || false}
                    entityName="Client"
                    loading={isLoading}
                    onCancel={() => router.back()}
                    submitText={isEdit ? "Update Client" : "Create Client"}
                    submitIcon={<Save className="h-4 w-4" />}
                    formId="client-form"
                />
            </form>
        </Form>
    );
}
