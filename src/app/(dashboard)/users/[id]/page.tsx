"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Shield, User, Mail, Clock, CheckCircle2, XCircle, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PremiumCard } from "@/components/shared/premium-card";
import { PageHeader } from "@/components/shared/page-header";
import { DetailItem } from "@/components/shared/detail-item";
import { StatusBadge } from "@/components/shared/status-badge";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationModal } from "@/components/shared/confirmation-modal";
import { useAuthStore } from "@/stores/authStore";

interface UserDetails {
    id: string;
    name: string;
    email: string;
    role: string;
    roleId: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function UserDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { user: currentUser } = useAuthStore();
    const [user, setUser] = useState<UserDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const userId = params?.id as string;

    useEffect(() => {
        const fetchUser = async () => {
            if (!userId) return;
            try {
                const response = await fetch(`/api/users/${userId}`);
                const data = await response.json();
                if (data.success) {
                    setUser(data.data);
                } else {
                    toast({
                        title: "Error",
                        description: "Failed to load user details",
                        variant: "destructive",
                    });
                    router.push("/users");
                }
            } catch (error) {
                console.error("Failed to fetch user:", error);
                toast({
                    title: "Error",
                    description: "An unexpected error occurred",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, [userId, toast, router]);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/users/${userId}`, { method: "DELETE" });
            const result = await response.json();
            if (result.success) {
                toast({ title: "Success", description: "User deleted successfully" });
                router.push("/users");
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to delete user",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Failed to delete user:", error);
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    if (isLoading) {
        return <div className="p-8">Loading user details...</div>;
    }

    if (!user) {
        return <div className="p-8">User not found</div>;
    }

    const isCurrentUser = currentUser?.id === user.id;

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 page-enter">
            <PageHeader
                title={user.name}
                subtitle="User Details"
            >
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/users/${user.id}/edit`)}
                        className="shadow-sm transition-all"
                    >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit User
                    </Button>
                    {!isCurrentUser && (
                        <Button
                            variant="destructive"
                            onClick={() => setShowDeleteModal(true)}
                            className="shadow-sm shadow-destructive/20 transition-all"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                    )}
                </div>
            </PageHeader>

            <div className="grid gap-6 md:grid-cols-1">
                <PremiumCard title="User Information" icon={Shield} className="h-full">
                    <div className="space-y-4">
                        <DetailItem icon={User} label="Name" value={user.name} />
                        <DetailItem icon={Mail} label="Email" value={user.email} />
                        <DetailItem
                            icon={Shield}
                            label="Role"
                            value={
                                <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-wider">
                                    {user.role}
                                </Badge>
                            }
                        />
                        <DetailItem
                            icon={user.isActive ? CheckCircle2 : XCircle}
                            label="Status"
                            value={
                                <StatusBadge
                                    variant={user.isActive ? "ACTIVE" : "INACTIVE"}
                                    label={user.isActive ? "Active" : "Inactive"}
                                    className={user.isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-red-500/10 text-red-600 border-red-500/30"}
                                    icon={user.isActive ? CheckCircle2 : XCircle}
                                />
                            }
                        />

                        <div className="pt-4 mt-4 border-t border-border grid grid-cols-2 gap-4">
                            <DetailItem
                                icon={Clock}
                                label="Created Date"
                                value={format(new Date(user.createdAt), "MMM dd, yyyy")}
                                labelClassName="opacity-50"
                            />
                            <DetailItem
                                icon={Clock}
                                label="Last Updated"
                                value={format(new Date(user.updatedAt), "MMM dd, yyyy")}
                                labelClassName="opacity-50"
                            />
                        </div>
                    </div>
                </PremiumCard>
            </div>

            <ConfirmationModal
                isOpen={showDeleteModal}
                onOpenChange={setShowDeleteModal}
                onConfirm={handleDelete}
                title="Delete User"
                description={`Are you sure you want to delete ${user.name}? This action cannot be undone.`}
                confirmText="Delete User"
                isDeleting={isDeleting}
            />
        </div>
    );
}
