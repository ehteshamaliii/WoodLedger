"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/use-socket";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { urlBase64ToUint8Array } from "@/lib/push-utils";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";

export interface Notification {
    id: string;
    type: "ORDER" | "PAYMENT" | "STOCK" | "DELIVERY" | "SYSTEM";
    title: string;
    content: string;
    status: "UNREAD" | "READ" | "ARCHIVED";
    link?: string | null;
    createdAt: string;
}

export const useNotifications = (userId?: string) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const { socket } = useSocket();
    const { toast } = useToast();
    const router = useRouter();

    const offlineNotifications = useLiveQuery(() => db.notifications.orderBy('createdAt').reverse().toArray()) || [];
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        fetchNotifications();
        checkPushSubscription();
    }, []);

    const checkPushSubscription = async () => {
        if ("serviceWorker" in navigator && "PushManager" in window) {
            try {
                const registration = await navigator.serviceWorker.ready;
                const sub = await registration.pushManager.getSubscription();
                setIsSubscribed(!!sub);
                setSubscription(sub);
            } catch (error) {
                console.error("Error checking push subscription:", error);
            }
        }
    };

    const subscribeToPush = async () => {
        try {
            if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
                toast({
                    title: "Not supported",
                    description: "Push notifications are not supported in this browser.",
                    variant: "destructive",
                });
                return;
            }

            const registration = await navigator.serviceWorker.register("/sw.js");
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""),
            });

            // Subscription objects in browser have toJSON() which returns the keys
            const subData = JSON.parse(JSON.stringify(sub));

            const res = await fetch("/api/notifications/push/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(subData),
            });

            if (res.ok) {
                setIsSubscribed(true);
                setSubscription(sub);
                toast({
                    title: "Success",
                    description: "You have subscribed to push notifications!",
                });
            } else {
                throw new Error("Failed to save subscription on server");
            }
        } catch (error) {
            console.error("Failed to subscribe to push", error);
            toast({
                title: "Error",
                description: "Failed to enable push notifications.",
                variant: "destructive",
            });
        }
    };

    const unsubscribeFromPush = async () => {
        try {
            if (subscription) {
                await subscription.unsubscribe();
                setIsSubscribed(false);
                setSubscription(null);
                toast({
                    title: "Unsubscribed",
                    description: "You will no longer receive push notifications.",
                });
            }
        } catch (error) {
            console.error("Failed to unsubscribe", error);
        }
    };

    useEffect(() => {
        if (!socket) return;

        if (userId) {
            socket.emit("join_room", userId);
        }

        const handleNewNotification = async (notification: Notification) => {
            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);

            await db.notifications.put({
                ...notification,
                createdAt: new Date(notification.createdAt)
            });

            toast({
                title: notification.title,
                description: notification.content,
            });

            // In-app desktop notification if permission granted and not already handled by SW
            if (window.Notification && Notification.permission === "granted") {
                new window.Notification(notification.title, {
                    body: notification.content,
                });
            }
        };

        socket.on("new_notification", handleNewNotification);

        return () => {
            socket.off("new_notification", handleNewNotification);
        };
    }, [socket, userId, toast, router]);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications");
            const result = await res.json();
            if (result.success) {
                setNotifications(result.data);
                const count = result.data.filter((n: Notification) => n.status === "UNREAD").length;
                setUnreadCount(count);

                // Sync with Dexie
                await db.notifications.bulkPut(result.data.map((n: any) => ({
                    ...n,
                    createdAt: new Date(n.createdAt)
                })));
            }
        } catch (error) {
            console.error("Failed to fetch notifications");
        }
    };

    const markAsRead = async (id: string) => {
        try {
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, status: "READ" } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));

            // Optimistic Dexie update so UI reacts instantly
            await db.notifications.update(id, { status: "READ" });

            const res = await fetch(`/api/notifications/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "READ" }),
            });

            // If the server says the notification doesn't exist anymore, clean it up locally
            if (res.status === 404) {
                await db.notifications.delete(id);
                setNotifications((prev) => prev.filter((n) => n.id !== id));
            }
        } catch (error) {
            console.error("Failed to mark as read");
        }
    };

    const markAllAsRead = async () => {
        const activeList = offlineNotifications.length > 0 ? offlineNotifications : notifications;
        const unreadIds = activeList
            .filter((n: any) => n.status === "UNREAD")
            .map((n: any) => n.id);

        if (unreadIds.length === 0) return;

        setNotifications((prev) =>
            prev.map((n) => ({ ...n, status: "READ" }))
        );
        setUnreadCount(0);

        // Optimistic Bulk Dexie Update
        await Promise.all(unreadIds.map(id => db.notifications.update(id, { status: "READ" })));

        await Promise.all(
            unreadIds.map(async (id) => {
                const res = await fetch(`/api/notifications/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "READ" }),
                });

                if (res.status === 404) {
                    await db.notifications.delete(id);
                }
            })
        );
    };

    const requestPermission = async () => {
        if (window.Notification && Notification.permission !== "granted") {
            await Notification.requestPermission();
        }
    };

    return {
        notifications: offlineNotifications.length > 0 ? offlineNotifications : notifications,
        unreadCount: offlineNotifications.filter(n => n.status === "UNREAD").length || unreadCount,
        isSubscribed,
        subscribeToPush,
        unsubscribeFromPush,
        markAsRead,
        markAllAsRead,
        requestPermission,
        fetchNotifications,
    };
};
