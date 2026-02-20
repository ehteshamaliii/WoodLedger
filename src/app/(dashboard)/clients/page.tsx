"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Users, Phone, MapPin, Loader2, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { DataTable, Column, FilterConfig, RowAction, BulkAction } from "@/components/shared/data-table";
import { StatsCard } from "@/components/dashboard/widgets/stats-card";
import { FormInput } from "@/components/shared/form-input";
import { Form } from "@/components/ui/form";

const clientSchema = z.object({
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(1, "Phone is required"),
    address: z.string().optional(),
    notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface Client {
    id: string;
    name: string;
    phone: string;
    address: string | null;
    notes: string | null;
    _count?: {
        orders: number;
    };
}

export default function ClientsPage() {
    const { toast } = useToast();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const stats = useMemo(() => ({
        total: clients.length,
        withOrders: clients.filter(c => (c._count?.orders ?? 0) > 0).length,
        withoutOrders: clients.filter(c => (c._count?.orders ?? 0) === 0).length,
        totalOrders: clients.reduce((sum, c) => sum + (c._count?.orders ?? 0), 0),
    }), [clients]);

    const form = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
        defaultValues: { name: "", phone: "", address: "", notes: "" },
    });

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/clients?pageSize=200`);
            const result = await response.json();
            if (result.success) {
                setClients(result.data);
            } else {
                toast({ title: "Error", description: result.error || "Failed to fetch clients", variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Failed to fetch clients", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const openDialog = (client?: Client) => {
        setEditingClient(client || null);
        form.reset({
            name: client?.name || "",
            phone: client?.phone || "",
            address: client?.address || "",
            notes: client?.notes || "",
        });
        setDialogOpen(true);
    };

    const onSubmit = async (data: ClientFormValues) => {
        try {
            setSubmitting(true);
            const url = editingClient ? `/api/clients/${editingClient.id}` : "/api/clients";
            const method = editingClient ? "PUT" : "POST";
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (result.success) {
                toast({ title: "Success", description: `Client ${editingClient ? "updated" : "created"} successfully` });
                setDialogOpen(false);
                fetchClients();
            } else {
                toast({ title: "Error", description: result.error || "Failed to save client", variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Failed to save client", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClient = async (client: Client) => {
        try {
            const response = await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
            const result = await response.json();
            if (result.success) {
                toast({ title: "Success", description: "Client deleted" });
                fetchClients();
            } else {
                toast({ title: "Error", description: result.error || "Failed to delete client", variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Failed to delete client", variant: "destructive" });
        }
    };

    const columns: Column<Client>[] = [
        {
            header: "Name",
            accessorKey: "name",
            sortable: true,
            render: (client) => (
                <div className="font-bold text-foreground">{client.name}</div>
            ),
        },
        {
            header: "Phone",
            hideable: true,
            render: (client) => (
                <div className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {client.phone}
                </div>
            ),
        },
        {
            header: "Address",
            hideable: true,
            render: (client) => (
                <div className="max-w-[250px] truncate text-sm text-muted-foreground">
                    {client.address ? (
                        <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>{client.address}</span>
                        </div>
                    ) : "-"}
                </div>
            ),
        },
        {
            header: "Orders",
            className: "text-center",
            headerClassName: "text-center",
            render: (client) => (
                <div className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-400 text-[10px] font-bold uppercase tracking-wider border border-violet-500/30">
                    {client._count ? client._count.orders : 0} Orders
                </div>
            ),
        },
    ];

    const filterConfig: FilterConfig = {
        search: {
            enabled: true,
            placeholder: "Search by name, phone, or address...",
            searchFields: ["name", "phone", "address"],
        },
        toggles: [
            {
                key: "hasOrders",
                label: "Has Orders",
                filterFn: (client) => (client._count?.orders ?? 0) > 0,
            },
        ],
    };

    const rowActions: RowAction<Client>[] = [
        {
            type: "edit",
            label: "Edit Client",
            onClick: (client) => openDialog(client),
        },
        {
            type: "delete",
            label: "Delete Client",
            onClick: handleDeleteClient,
            confirmation: {
                title: "Delete Client",
                description: (c) => `Delete ${c.name}? This may affect associated orders.`,
            },
        },
    ];

    const bulkActions: BulkAction<Client>[] = [
        {
            label: "Delete Selected",
            icon: Trash2,
            variant: "destructive",
            confirmation: {
                title: "Delete Clients",
                description: "Delete the selected clients? This may affect associated orders.",
            },
            onClick: async (selectedItems) => {
                try {
                    await Promise.all(selectedItems.map(c =>
                        fetch(`/api/clients/${c.id}`, { method: "DELETE" })
                    ));
                    toast({ title: "Success", description: "Clients deleted" });
                    fetchClients();
                } catch {
                    toast({ title: "Error", description: "Failed to delete some clients", variant: "destructive" });
                }
            },
        },
    ];

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 page-enter">
            <DataTable
                data={clients}
                columns={columns}
                isLoading={loading}
                rowIdKey="id"
                title="Clients"
                description="Manage your customer information and contact details"
                headerActions={
                    <Button
                        onClick={() => openDialog()}
                        variant="secondary"
                        className="shadow-lg shadow-secondary/20 hover:scale-105 transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        Add Client
                    </Button>
                }
                statsCards={
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatsCard title="Total Clients" value={stats.total} icon={Users} description="Registered clients" variant="primary" />
                        <StatsCard title="With Orders" value={stats.withOrders} icon={Phone} description="Have placed at least one order" variant="secondary" />
                        <StatsCard title="No Orders Yet" value={stats.withoutOrders} icon={MapPin} description="Not yet converted" variant="primary" />
                        <StatsCard title="Total Orders" value={stats.totalOrders} icon={Users} description="Orders across all clients" variant="secondary" />
                    </div>
                }
                sectionTitle="Client Directory"
                filterConfig={filterConfig}
                rowActions={rowActions}
                bulkActions={bulkActions}
                emptyTitle="No clients found"
                emptyDescription="Start by adding your first client"
                emptyIcon={<Users className="h-16 w-16 text-muted-foreground/20" />}
            />

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md glass-card border-none border-white/5 pb-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold font-heading uppercase tracking-wide">
                            {editingClient ? "Edit Client" : "Add New Client"}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            {"Enter the client's contact information below"}
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-4">
                            <FormInput control={form.control} name="name" label="Full Name *" placeholder="e.g., Ahmad Khan" className="h-11" />
                            <FormInput control={form.control} name="phone" label="Phone Number *" placeholder="e.g., 0300-1234567" className="h-11 font-mono" />
                            <FormInput control={form.control} name="address" label="Address" placeholder="e.g., Gulberg, Lahore" className="h-11" />
                            <FormInput control={form.control} name="notes" label="Additional Notes" placeholder="Any special instructions..." type="textarea" className="min-h-[100px]" />

                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDialogOpen(false)}
                                    className="border-white/10 hover:bg-white/5"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="min-w-[100px] shadow-lg shadow-primary/20"
                                >
                                    {submitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        editingClient ? "Update Client" : "Create Client"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
