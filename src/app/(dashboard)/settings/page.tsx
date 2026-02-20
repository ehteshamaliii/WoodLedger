"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun, Laptop, Paintbrush, Bell, Mail, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { PremiumCard } from "@/components/shared/premium-card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const { user, setUser } = useAuthStore();
    const { toast } = useToast();
    const { isSubscribed, subscribeToPush, unsubscribeFromPush } = useNotifications(user?.id);

    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const themes = [
        { name: "Light", value: "light", icon: Sun },
        { name: "Dark", value: "dark", icon: Moon },
        { name: "System", value: "system", icon: Laptop },
    ];

    const handleToggleNotification = async (type: "pushNotifications" | "emailNotifications", value: boolean) => {
        if (!user) return;

        setIsUpdating(true);
        try {
            // First update backend
            const response = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: user.name,
                    email: user.email,
                    [type]: value
                }),
            });

            const result = await response.json();

            if (result.success && result.data) {
                // Update local auth store
                setUser(result.data);

                // Handle push subscription side-effects if toggling push notifications
                if (type === "pushNotifications") {
                    if (value && !isSubscribed) {
                        await subscribeToPush();
                    } else if (!value && isSubscribed) {
                        await unsubscribeFromPush();
                    }
                }

                toast({
                    title: "Preferences Updated",
                    description: `${type === "pushNotifications" ? "Push" : "Email"} notifications are now ${value ? "enabled" : "disabled"}.`,
                });
            } else {
                throw new Error(result.error || "Failed to update preferences");
            }
        } catch (error) {
            console.error("Failed to update notification preferences:", error);
            toast({
                title: "Error",
                description: "Failed to update your notification settings.",
                variant: "destructive",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 page-enter pb-32">
            <PageHeader
                title="System Settings"
                subtitle="Manage your application preferences and appearance"
            />

            <div className="grid gap-6 md:grid-cols-2">
                <PremiumCard
                    title="Appearance"
                    icon={Paintbrush}
                    description="Customize how WoodLedger looks on your device."
                >
                    <div className="space-y-4 pt-4 mt-4 border-t border-border/50">
                        <div className="flex flex-col space-y-3">
                            <span className="text-sm font-bold text-foreground">Theme Preference</span>
                            <div className="grid grid-cols-3 gap-3">
                                {mounted && themes.map((t) => (
                                    <Button
                                        key={t.value}
                                        variant={theme === t.value ? "default" : "outline"}
                                        className={cn(
                                            "h-24 flex flex-col gap-3 justify-center items-center transition-all duration-300",
                                            theme === t.value
                                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                                                : "hover:bg-primary/5 hover:border-primary/30 text-muted-foreground hover:text-foreground"
                                        )}
                                        onClick={() => setTheme(t.value)}
                                    >
                                        <t.icon className={cn("h-6 w-6", theme === t.value ? "animate-pulse" : "")} />
                                        <span className="font-bold text-sm tracking-tight">{t.name}</span>
                                    </Button>
                                ))}
                                {!mounted && Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="h-24 rounded-lg bg-muted/20 animate-pulse border border-border/50"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </PremiumCard>

                <PremiumCard
                    title="Notification Preferences"
                    icon={Bell}
                    description="Control how and when you receive system alerts."
                >
                    <div className="space-y-4 pt-4 mt-4 border-t border-border/50 relative">
                        {isUpdating && (
                            <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        )}

                        <div className="flex flex-row justify-between items-center p-4 rounded-lg bg-muted/20 border border-muted/50 transition-colors hover:bg-muted/30">
                            <div className="flex flex-row gap-4 items-center">
                                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <Bell className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-foreground">Push Notifications</span>
                                    <span className="text-xs text-muted-foreground">Receive browser-level alerts for critical updates.</span>
                                </div>
                            </div>
                            <Switch
                                checked={user?.pushNotifications || false}
                                onCheckedChange={(checked) => handleToggleNotification("pushNotifications", checked)}
                                disabled={isUpdating}
                            />
                        </div>

                        <div className="flex flex-row justify-between items-center p-4 rounded-lg bg-muted/20 border border-muted/50 transition-colors hover:bg-muted/30">
                            <div className="flex flex-row gap-4 items-center">
                                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary/10 text-secondary">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-foreground">Email Notifications</span>
                                    <span className="text-xs text-muted-foreground">Receive daily summaries and receipts via email.</span>
                                </div>
                            </div>
                            <Switch
                                checked={user?.emailNotifications !== false} // Default to true if undefined
                                onCheckedChange={(checked) => handleToggleNotification("emailNotifications", checked)}
                                disabled={isUpdating}
                            />
                        </div>
                    </div>
                </PremiumCard>

                <div className="md:col-span-2">
                    <PremiumCard
                        title="System Details"
                        icon={Monitor}
                        description="Information about your current session and connection."
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 mt-4 border-t border-border/50">
                            <div className="flex flex-row justify-between items-center p-3 rounded-lg bg-muted/20 border border-muted/50">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-foreground">Version</span>
                                    <span className="text-xs text-muted-foreground">WoodLedger Enterprise</span>
                                </div>
                                <span className="text-sm font-black bg-primary/10 text-primary px-2 py-1 rounded-sm">v2.0.0</span>
                            </div>
                            <div className="flex flex-row justify-between items-center p-3 rounded-lg bg-muted/20 border border-muted/50">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-foreground">Database Status</span>
                                    <span className="text-xs text-muted-foreground">Prisma Driver Adapter</span>
                                </div>
                                <span className="text-sm font-black bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-sm flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Connected</span>
                            </div>
                        </div>
                    </PremiumCard>
                </div>
            </div>
        </div>
    );
}
