"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Users, Phone, MapPin, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { useToast } from "@/hooks/use-toast";
import { DataTable, Column, FilterConfig, RowAction, BulkAction } from "@/components/shared/data-table";
import { StatsCard } from "@/components/dashboard/widgets/stats-card";

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
    const router = useRouter();
    const { toast } = useToast();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);

    const stats = useMemo(() => ({
        total: clients.length,
        withOrders: clients.filter(c => (c._count?.orders ?? 0) > 0).length,
        withoutOrders: clients.filter(c => (c._count?.orders ?? 0) === 0).length,
        totalOrders: clients.reduce((sum, c) => sum + (c._count?.orders ?? 0), 0),
    }), [clients]);

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
                <StatusBadge variant="LINKED" className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30">
                    {client._count ? client._count.orders : 0} Orders
                </StatusBadge>
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
            onClick: (client) => router.push(`/clients/${client.id}/edit`),
        },
        {
            type: "delete",
            label: "Delete Client",
            onClick: handleDeleteClient,
            confirmation: {
                title: "Delete Client",
                description: (c) => `Delete ${c.name}? This may affect associated orders.`,
            },
            disabled: (client) => (client._count?.orders ?? 0) > 0,
            disabledReason: "Cannot delete client with existing orders.",
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
                        onClick={() => router.push("/clients/new")}
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
        </div>
    );
}
