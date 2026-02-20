import { create } from 'zustand';
import type { Notification } from '@/types';

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Notification) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    removeNotification: (id: string) => void;
    setNotifications: (notifications: Notification[]) => void;
    clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,

    addNotification: (notification) =>
        set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: notification.status === 'unread' ? state.unreadCount + 1 : state.unreadCount,
        })),

    markAsRead: (id) =>
        set((state) => {
            const notification = state.notifications.find((n) => n.id === id);
            if (!notification || notification.status === 'read') return state;

            return {
                notifications: state.notifications.map((n) =>
                    n.id === id ? { ...n, status: 'read' as const } : n
                ),
                unreadCount: Math.max(0, state.unreadCount - 1),
            };
        }),

    markAllAsRead: () =>
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, status: 'read' as const })),
            unreadCount: 0,
        })),

    removeNotification: (id) =>
        set((state) => {
            const notification = state.notifications.find((n) => n.id === id);
            const unreadCount =
                notification?.status === 'unread'
                    ? Math.max(0, state.unreadCount - 1)
                    : state.unreadCount;

            return {
                notifications: state.notifications.filter((n) => n.id !== id),
                unreadCount,
            };
        }),

    setNotifications: (notifications) =>
        set({
            notifications,
            unreadCount: notifications.filter((n) => n.status === 'unread').length,
        }),

    clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
