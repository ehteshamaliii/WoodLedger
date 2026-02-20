"use client";

import { Bell, Info, AlertTriangle, CheckCircle, Package, CreditCard, ChevronRight } from "lucide-react";
import Link from "next/link";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, Notification } from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function NotificationCenter({ userId }: { userId?: string }) {
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        isSubscribed,
        subscribeToPush,
        unsubscribeFromPush
    } = useNotifications(userId);

    const getIcon = (type: string) => {
        switch (type) {
            case "ORDER": return <Package className="h-4 w-4 text-primary" />;
            case "PAYMENT": return <CreditCard className="h-4 w-4 text-secondary" />;
            case "STOCK": return <AlertTriangle className="h-4 w-4 text-accent" />;
            case "DELIVERY": return <Info className="h-4 w-4 text-secondary" />;
            case "SYSTEM": return <CheckCircle className="h-4 w-4 text-secondary" />;
            default: return <Bell className="h-4 w-4" />;
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="relative bg-background border border-border text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border transition-all shadow-xs">

                    <Bell className="h-4 w-4 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary border-2 border-background shadow-sm" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 shadow-xl border-border bg-popover/95 backdrop-blur-md" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm tracking-tight font-heading">Notifications</h4>
                        {unreadCount > 0 && (
                            <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {unreadCount} NEW
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-[11px] h-7 px-2 text-muted-foreground hover:text-primary transition-colors"
                                onClick={() => markAllAsRead()}
                            >
                                Mark all read
                            </Button>
                        )}
                    </div>
                </div>

                {/* Push Notification Toggle */}
                <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b">
                    <Label htmlFor="push-mode" className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        Push Notifications
                    </Label>
                    <Switch
                        id="push-mode"
                        checked={isSubscribed}
                        onCheckedChange={(checked) => checked ? subscribeToPush() : unsubscribeFromPush()}
                        className="scale-75"
                    />
                </div>

                <ScrollArea className="h-[350px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[300px] text-center p-8">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                <Bell className="h-6 w-6 text-muted-foreground/50" />
                            </div>
                            <p className="text-sm font-medium">All caught up!</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                No new notifications at the moment.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "group p-4 hover:bg-muted/50 transition-all duration-200 cursor-pointer relative overflow-hidden",
                                        notification.status === "UNREAD" && "bg-primary/[0.03]"
                                    )}
                                    onClick={() => markAsRead(notification.id)}
                                >
                                    {notification.status === "UNREAD" && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                                    )}
                                    <div className="flex gap-3">
                                        <div className={cn(
                                            "mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                                            notification.status === "UNREAD" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                        )}>
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <p className={cn(
                                                    "text-[10px] font-bold uppercase tracking-widest",
                                                    notification.status === "UNREAD" ? "text-primary" : "text-muted-foreground"
                                                )}>
                                                    {notification.type}
                                                </p>
                                                <span className="text-[10px] text-muted-foreground font-medium">
                                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <h5 className="text-xs font-semibold mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                                                {notification.title}
                                            </h5>
                                            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                                                {notification.content}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="p-3 border-t bg-muted/20">
                    <Button variant="outline" size="sm" className="w-full text-xs h-8 group" asChild>
                        <Link href="/notifications">
                            View All Notifications
                            <ChevronRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}


