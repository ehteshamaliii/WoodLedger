"use client";

import { useState, useEffect, useCallback } from 'react';
import { useConnectivity } from '@/providers/connectivity-provider';
import { useOffline } from '@/hooks/use-offline';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

interface UseSyncDataOptions {
    entity: 'ORDER' | 'STOCK' | 'PAYMENT' | 'CLIENT';
    apiUrl: string;
    dexieTable: any;
}

export function useSyncData({ entity, apiUrl, dexieTable }: UseSyncDataOptions) {
    const { isOnline } = useConnectivity();
    const { queueAction, syncData } = useOffline();
    const [isLoading, setIsLoading] = useState(false);

    // 1. Instant UI: Load from local state (Dexie)
    const items = useLiveQuery(() => dexieTable.toArray()) || [];

    // 2. Background Revalidation: Fetch fresh data from server (server-wins)
    const revalidate = useCallback(async () => {
        if (!isOnline) return;

        try {
            setIsLoading(true);
            const res = await fetch(apiUrl);
            const result = await res.json();

            if (result.success) {
                const data = Array.isArray(result.data) ? result.data : [result.data];
                const serverIds = new Set<string>(data.map((item: any) => item.id));

                // Push fresh server data into local DB
                await dexieTable.bulkPut(data.map((item: any) => ({
                    ...item,
                    isOffline: false
                })));

                // Server-wins reconciliation: remove local records whose IDs are
                // absent from the server response and are NOT pending sync upload.
                // This clears phantom records left after DB resets or server deletions.
                const pendingQueue = await db.syncQueue.toArray();
                const pendingIds = new Set<string>(pendingQueue.map((q: any) => q.data?.id).filter(Boolean));

                const localRecords = await dexieTable.toArray();
                const staleIds: string[] = localRecords
                    .map((r: any) => r.id as string)
                    .filter((id: string) => !serverIds.has(id) && !pendingIds.has(id));

                if (staleIds.length > 0) {
                    console.log(`[Reconcile] Removing ${staleIds.length} stale ${entity} record(s) from local DB`);
                    await dexieTable.bulkDelete(staleIds);
                }
            }
        } catch (error) {
            console.error(`Revalidation failed for ${entity}:`, error);
        } finally {
            setIsLoading(false);
        }
    }, [isOnline, apiUrl, entity, dexieTable]);

    // 3. Effect: Revalidate on mount or connection restore
    useEffect(() => {
        revalidate();
    }, [isOnline, revalidate]);

    // 4. Action Handler: Smart choice between online/offline
    const performAction = async (action: 'CREATE' | 'UPDATE' | 'DELETE', data: any) => {
        // Optimistic Update: Update UI immediately
        const tempId = data.id || `temp_${Date.now()}`;
        const localData = {
            ...data,
            id: tempId,
            isOffline: true,
            updatedAt: new Date(),
            createdAt: data.createdAt || new Date()
        };

        if (action !== 'DELETE') {
            await dexieTable.put(localData);
        } else {
            await dexieTable.delete(tempId);
        }

        if (isOnline) {
            try {
                const res = await fetch(apiUrl, {
                    method: action === 'CREATE' ? 'POST' : (action === 'UPDATE' ? 'PUT' : 'DELETE'),
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                const result = await res.json();

                if (result.success) {
                    // Update local with server response (which has real ID)
                    if (action === 'DELETE') {
                        await dexieTable.delete(tempId);
                    } else {
                        // Remove the temp item if IDs changed
                        if (result.data.id !== tempId) {
                            await dexieTable.delete(tempId);
                        }
                        await dexieTable.put({ ...result.data, isOffline: false });
                    }
                    return result.data;
                }
            } catch (e) {
                console.warn(`Online action failed, falling back to queue:`, e);
            }
        }

        // Offline or Online failed: Queue it
        await queueAction({ entity, action, data });
        return localData;
    };

    return {
        items,
        isLoading,
        performAction,
        refresh: revalidate
    };
}
