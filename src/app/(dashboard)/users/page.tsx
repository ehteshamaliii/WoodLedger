"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Users,
    Shield,
    UserCheck,
    UserX,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { DataTable, Column, FilterConfig, RowAction, BulkAction } from "@/components/shared/data-table";
import { StatsCard } from "@/components/dashboard/widgets/stats-card";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    roleId: string;
    isActive: boolean;
    createdAt: string;
}

interface Role {
    id: string;
    name: string;
    description: string | null;
}

export default function UsersPage() {
    const router = useRouter();
    const { user: currentUser } = useAuthStore();
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, rolesRes] = await Promise.all([
                    fetch("/api/users"),
                    fetch("/api/roles"),
                ]);
                const usersData = await usersRes.json();
                const rolesData = await rolesRes.json();
                if (usersData.success) setUsers(usersData.data);
                if (rolesData.success) setRoles(rolesData.data);
            } catch {
                toast.error("Failed to fetch data");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleDelete = async (user: User) => {
        const response = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
        const result = await response.json();
        if (result.success) {
            setUsers(users.filter(u => u.id !== user.id));
            toast.success("User deleted successfully");
        } else {
            toast.error(result.error || "Failed to delete user");
        }
    };

    const handleToggleActive = async (user: User) => {
        try {
            const response = await fetch(`/api/users/${user.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !user.isActive }),
            });
            const result = await response.json();
            if (result.success) {
                setUsers(users.map(u => u.id === user.id ? result.data : u));
                toast.success(`User ${result.data.isActive ? "activated" : "deactivated"}`);
            } else {
                toast.error(result.error || "Failed to update user");
            }
        } catch {
            toast.error("Failed to update user");
        }
    };

    const stats = {
        total: users.length,
        active: users.filter(u => u.isActive).length,
        inactive: users.filter(u => !u.isActive).length,
        roles: new Set(users.map(u => u.role)).size,
    };

    const columns: Column<User>[] = [
        {
            header: "Name",
            accessorKey: "name",
            sortable: true,
            render: (user) => <span className="font-bold text-foreground">{user.name}</span>,
        },
        {
            header: "Email",
            accessorKey: "email",
            hideable: true,
            sortable: true,
            render: (user) => <span className="text-muted-foreground text-sm">{user.email}</span>,
        },
        {
            header: "Role",
            accessorKey: "role",
            sortable: true,
            render: (user) => (
                <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-wider">
                    {user.role}
                </Badge>
            ),
        },
        {
            header: "Status",
            accessorKey: "isActive",
            render: (user) => (
                <Badge variant={user.isActive ? "default" : "outline"} className={user.isActive ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" : "text-muted-foreground"}>
                    {user.isActive ? "Active" : "Inactive"}
                </Badge>
            ),
        },
    ];

    const filterConfig: FilterConfig = {
        search: {
            enabled: true,
            placeholder: "Search users by name or email...",
            searchFields: ["name", "email", "role"],
        },
        selects: [
            {
                key: "role",
                label: "Role",
                options: roles.map(r => ({ label: r.name, value: r.name })),
            },
        ],
        toggles: [
            {
                key: "activeOnly",
                label: "Active Only",
                filterFn: (user) => user.isActive,
            },
        ],
    };

    const rowActions: RowAction<User>[] = [
        {
            type: "view",
            label: "View Details",
            onClick: (user) => router.push(`/users/${user.id}`),
        },
        {
            type: "edit",
            label: "Edit User",
            onClick: (user) => router.push(`/users/${user.id}/edit`),
        },
        {
            type: "custom",
            label: "Toggle Active",
            icon: UserCheck,
            className: "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10",
            show: (user) => user.id !== currentUser?.id,
            onClick: (user) => handleToggleActive(user),
        },
        {
            type: "delete",
            label: "Delete User",
            show: (user) => user.id !== currentUser?.id,
            confirmation: {
                title: "Delete User",
                description: (user) => `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
            },
            onClick: (user) => handleDelete(user),
        },
    ];

    const bulkActions: BulkAction<User>[] = [
        {
            label: "Delete Selected",
            icon: Trash2,
            variant: "destructive",
            confirmation: {
                title: "Delete Users",
                description: "Delete the selected users? They will lose access immediately.",
            },
            onClick: async (selectedItems) => {
                try {
                    await Promise.all(
                        selectedItems
                            .filter(u => u.id !== currentUser?.id)
                            .map(u => fetch(`/api/users/${u.id}`, { method: "DELETE" }))
                    );
                    const [usersRes] = await Promise.all([fetch("/api/users")]);
                    const usersData = await usersRes.json();
                    if (usersData.success) setUsers(usersData.data);
                    toast("Users deleted successfully");
                } catch {
                    toast("Failed to delete some users");
                }
            },
        },
    ];

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 page-enter">
            <DataTable
                title="User Management"
                description="Manage system users and their access roles"
                headerActions={
                    <Button
                        onClick={() => router.push('/users/new')}
                        variant="secondary"
                        className="shadow-lg shadow-secondary/20 hover:scale-105 transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        Add User
                    </Button>
                }
                statsCards={
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatsCard title="Total Users" value={stats.total} icon={Users} description="All registered accounts" variant="primary" />
                        <StatsCard title="Active Users" value={stats.active} icon={UserCheck} description="Currently enabled" variant="secondary" />
                        <StatsCard title="Inactive Users" value={stats.inactive} icon={UserX} description="Disabled accounts" variant="primary" />
                        <StatsCard title="Roles" value={stats.roles} icon={Shield} description="Unique role types" variant="secondary" />
                    </div>
                }
                sectionTitle="Users"
                data={users}
                columns={columns}
                isLoading={isLoading}
                rowIdKey="id"
                filterConfig={filterConfig}
                rowActions={rowActions}
                bulkActions={bulkActions}
                emptyTitle="No users found"
                emptyDescription="Add a new user to get started"
                emptyIcon={<Users className="h-16 w-16 text-muted-foreground/20" />}
                onRowClick={(user) => router.push(`/users/${user.id}`)}
            />
        </div>
    );
}
