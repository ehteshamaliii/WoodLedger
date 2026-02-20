"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
    useCallback,
    useRef,
} from "react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/db";

interface ConnectivityContextType {
    isOnline: boolean;
    status: 'online' | 'offline';
}

const ConnectivityContext = createContext<ConnectivityContextType>({
    isOnline: true,
    status: 'online',
});

export const useConnectivity = () => {
    return useContext(ConnectivityContext);
};

export const ConnectivityProvider = ({ children }: { children: ReactNode }) => {
    const [isOnline, setIsOnline] = useState(true);
    const { toast } = useToast();

    const isOnlineRef = useRef(true);
    const isInitialRef = useRef(true);

    const syncPendingChanges = useCallback(async () => {
        const count = await db.syncQueue.count();
        if (count > 0) {
            console.log(`Connection restored. ${count} items pending sync.`);
        }
    }, []);

    const updateStatus = useCallback((online: boolean, reason?: 'health' | 'event') => {
        const wasOnline = isOnlineRef.current;
        const isFirstCheck = isInitialRef.current;

        // Always update refs and state
        isOnlineRef.current = online;
        setIsOnline(online);
        isInitialRef.current = false;

        // Skip toast on initial load
        if (isFirstCheck) return;

        // Only toast if status changed
        if (online && !wasOnline) {
            toast({
                title: "Back Online",
                description: "Synchronizing your offline changes...",
                variant: "default",
            });
            syncPendingChanges();
        } else if (!online && wasOnline) {
            const title = reason === 'health' ? "Server Error" : "Offline Mode";
            const description = reason === 'health'
                ? "Database connection lost. Changes will be saved locally."
                : "Changes will be saved locally and synced when you're back online.";

            toast({
                title,
                description,
                variant: "destructive",
            });
        }
    }, [toast, syncPendingChanges]);

    useEffect(() => {
        const checkHealth = async () => {
            if (!navigator.onLine) {
                updateStatus(false, 'event');
                return;
            }

            try {
                const response = await fetch('/api/health', {
                    method: 'GET',
                    cache: 'no-store',
                    signal: AbortSignal.timeout(5000)
                });

                const data = await response.json().catch(() => ({}));
                const isHealthy = response.ok && !data.isOffline;

                updateStatus(isHealthy, 'health');
            } catch (error) {
                updateStatus(false, 'health');
            }
        };

        const handleOnline = () => checkHealth();
        const handleOffline = () => updateStatus(false, 'event');

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const interval = setInterval(checkHealth, 5000);

        // Initial check
        checkHealth();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, [updateStatus]);

    return (
        <ConnectivityContext.Provider value={{ isOnline, status: isOnline ? 'online' : 'offline' }}>
            {children}
        </ConnectivityContext.Provider>
    );
};
