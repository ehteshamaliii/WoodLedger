"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Users,
    Shield,
    UserCheck,
    UserX,
    Loader2,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    const { user: currentUser } = useAuthStore();
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Dialog states
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        roleId: "",
        isActive: true,
    });

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

    const resetForm = () => setFormData({ name: "", email: "", password: "", roleId: "", isActive: true });

    const handleCreate = async () => {
        if (!formData.name || !formData.email || !formData.password || !formData.roleId) {
            toast.error("Please fill in all required fields");
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const result = await response.json();
            if (result.success) {
                setUsers([result.data, ...users]);
                setShowCreateDialog(false);
                resetForm();
                toast.success("User created successfully");
            } else {
                toast.error(result.error || "Failed to create user");
            }
        } catch {
            toast.error("Failed to create user");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedUser) return;
        setIsSubmitting(true);
        try {
            const updateData: Record<string, unknown> = {};
            if (formData.name) updateData.name = formData.name;
            if (formData.email) updateData.email = formData.email;
            if (formData.password) updateData.password = formData.password;
            if (formData.roleId) updateData.roleId = formData.roleId;
            updateData.isActive = formData.isActive;

            const response = await fetch(`/api/users/${selectedUser.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData),
            });
            const result = await response.json();
            if (result.success) {
                setUsers(users.map(u => u.id === selectedUser.id ? result.data : u));
                setShowEditDialog(false);
                setSelectedUser(null);
                resetForm();
                toast.success("User updated successfully");
            } else {
                toast.error(result.error || "Failed to update user");
            }
        } catch {
            toast.error("Failed to update user");
        } finally {
            setIsSubmitting(false);
        }
    };

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

    const openEditDialog = (user: User) => {
        setSelectedUser(user);
        setFormData({ name: user.name, email: user.email, password: "", roleId: user.roleId, isActive: user.isActive });
        setShowEditDialog(true);
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
            type: "edit",
            label: "Edit User",
            onClick: (user) => openEditDialog(user),
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
                        onClick={() => setShowCreateDialog(true)}
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
            />

            {/* Create User Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="glass-card border-none">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold font-heading uppercase tracking-wide">Create New User</DialogTitle>
                        <DialogDescription>Add a new user to the system</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="create-name">Name</Label>
                            <Input id="create-name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" className="h-11 bg-black/20 border-white/10" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-email">Email</Label>
                            <Input id="create-email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" className="h-11 bg-black/20 border-white/10" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-password">Password</Label>
                            <Input id="create-password" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" className="h-11 bg-black/20 border-white/10" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-role">Role</Label>
                            <Select value={formData.roleId} onValueChange={value => setFormData({ ...formData, roleId: value })}>
                                <SelectTrigger className="h-11 bg-black/20 border-white/10">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map(role => <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-white/10 hover:bg-white/5">Cancel</Button>
                        <Button onClick={handleCreate} disabled={isSubmitting} className="shadow-lg shadow-primary/20">
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Create User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="glass-card border-none">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold font-heading uppercase tracking-wide">Edit User</DialogTitle>
                        <DialogDescription>Update user information</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input id="edit-name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="h-11 bg-black/20 border-white/10" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input id="edit-email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="h-11 bg-black/20 border-white/10" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-password">New Password <span className="text-muted-foreground text-xs">(leave empty to keep current)</span></Label>
                            <Input id="edit-password" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" className="h-11 bg-black/20 border-white/10" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-role">Role</Label>
                            <Select value={formData.roleId} onValueChange={value => setFormData({ ...formData, roleId: value })}>
                                <SelectTrigger className="h-11 bg-black/20 border-white/10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map(role => <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditDialog(false)} className="border-white/10 hover:bg-white/5">Cancel</Button>
                        <Button onClick={handleUpdate} disabled={isSubmitting} className="shadow-lg shadow-primary/20">
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
