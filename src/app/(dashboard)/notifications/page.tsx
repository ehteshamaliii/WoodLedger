"use client";

import { useNotifications } from "@/hooks/use-notifications";
import { PageHeader } from "@/components/shared/page-header";
import { PremiumCard } from "@/components/shared/premium-card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCircle, Package, AlertTriangle, CreditCard, Info, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function NotificationsPage() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");

    const filteredNotifications = notifications?.filter(n => filter === "ALL" || n.status === "UNREAD") || [];

    const getIcon = (type: string) => {
        switch (type) {
            case "ORDER": return <Package className="h-5 w-5 text-primary" />;
            case "PAYMENT": return <CreditCard className="h-5 w-5 text-secondary" />;
            case "STOCK": return <AlertTriangle className="h-5 w-5 text-accent" />;
            case "DELIVERY": return <Info className="h-5 w-5 text-secondary" />;
            case "SYSTEM": return <CheckCircle className="h-5 w-5 text-secondary" />;
            default: return <Bell className="h-5 w-5 text-muted-foreground" />;
        }
    };

    if (!notifications) {
        return (
            <div className="flex-1 flex items-center justify-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 page-enter pb-32">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <PageHeader
                    title="All Notifications"
                    subtitle="View and manage your system alerts and updates"
                />
                <div className="flex gap-3">
                    {unreadCount > 0 && (
                        <Button
                            variant="default"
                            size="sm"
                            className="text-sm h-9 px-4 shadow-sm"
                            onClick={() => markAllAsRead()}
                        >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark all as read
                        </Button>
                    )}
                </div>
            </div>

            <PremiumCard
                title="Activity Feed"
                icon={Bell}
                description="Recent updates and system alerts."
                className="p-0 overflow-hidden border-border/50"
            >
                <div className="flex border-b border-border/50 px-4 pt-4 gap-4">
                    <button
                        onClick={() => setFilter("ALL")}
                        className={cn("pb-3 text-sm font-medium transition-colors border-b-2", filter === "ALL" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}
                    >
                        All Notifications
                    </button>
                    <button
                        onClick={() => setFilter("UNREAD")}
                        className={cn("pb-3 flex items-center gap-1.5 text-sm font-medium transition-colors border-b-2", filter === "UNREAD" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}
                    >
                        Unread
                        {unreadCount > 0 && (
                            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm text-[10px]">{unreadCount}</span>
                        )}
                    </button>
                </div>

                {filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16 text-center">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
                            <Bell className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">You're all caught up!</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            We'll notify you here when there's an update on your orders, payments, or stock levels.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {filteredNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={cn(
                                    "group flex flex-col sm:flex-row gap-4 p-5 hover:bg-muted/30 transition-all duration-200 relative overflow-hidden",
                                    notification.status === "UNREAD" && "bg-primary/[0.02]"
                                )}
                            >
                                {notification.status === "UNREAD" && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                                )}

                                <div className={cn(
                                    "mt-1 h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-border/50",
                                    notification.status === "UNREAD" ? "bg-primary/10" : "bg-muted"
                                )}>
                                    {getIcon(notification.type)}
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className={cn(
                                            "text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm border border-border/50",
                                            notification.status === "UNREAD" ? "text-primary bg-primary/5" : "text-muted-foreground bg-muted/20"
                                        )}>
                                            {notification.type}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground font-medium">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <h4 className={cn("text-base font-semibold mb-1", notification.status === "UNREAD" ? "text-foreground" : "text-foreground/80")}>
                                        {notification.title}
                                    </h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {notification.content}
                                    </p>
                                </div>

                                <div className="flex items-center sm:items-start pt-2 sm:pt-0">
                                    {notification.status === "UNREAD" ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs h-8 text-primary hover:text-primary hover:bg-primary/10 gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                            onClick={() => markAsRead(notification.id)}
                                        >
                                            <Check className="h-3 w-3" />
                                            Mark as read
                                        </Button>
                                    ) : (
                                        <span className="text-xs font-medium text-muted-foreground/50 px-3 py-1 flex items-center gap-1.5">
                                            <CheckCircle className="h-3 w-3" />
                                            Read
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </PremiumCard>
        </div>
    );
}

