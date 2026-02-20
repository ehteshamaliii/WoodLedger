"use client";

import { useCallback, useEffect } from 'react';
import { db, SyncQueueItem } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { useConnectivity } from '@/providers/connectivity-provider';

export function useOffline() {
    const { isOnline } = useConnectivity();
    const { toast } = useToast();

    const syncData = useCallback(async () => {
        const queue = await db.syncQueue.toArray();
        if (queue.length === 0) return;

        console.log(`Syncing ${queue.length} items...`);

        // Track temp_id → real_id mappings so we can fix up linked records
        // e.g. a Payment with orderId: "temp_123" becomes orderId: "<realOrderId>"
        const idMap = new Map<string, string>();

        for (const item of queue) {
            try {
                let url = '';
                switch (item.entity) {
                    case 'ORDER': url = '/api/orders'; break;
                    case 'STOCK': url = '/api/inventory'; break;
                    case 'PAYMENT': url = '/api/payments'; break;
                    case 'CLIENT': url = '/api/clients'; break;
                }

                // Resolve any temp IDs in the data that have already been mapped to real IDs
                const resolvedData = { ...item.data };
                if (resolvedData.orderId && idMap.has(resolvedData.orderId)) {
                    resolvedData.orderId = idMap.get(resolvedData.orderId)!;
                    // Also update the local Dexie record so it reflects the real orderId
                    if (item.entity === 'PAYMENT') {
                        await db.payments.update(resolvedData.id, { orderId: resolvedData.orderId });
                    }
                }
                if (resolvedData.clientId && idMap.has(resolvedData.clientId)) {
                    resolvedData.clientId = idMap.get(resolvedData.clientId)!;
                }

                const method = item.action === 'CREATE' ? 'POST' : 'PUT';
                const finalUrl = item.action === 'UPDATE'
                    ? `${url}/${resolvedData.id}`
                    : url;

                const response = await fetch(finalUrl, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(resolvedData),
                });

                if (response.ok) {
                    const result = await response.json();

                    if (item.action === 'CREATE' && result.success) {
                        const tempId = item.data.id as string;
                        const realId = result.data?.id as string;

                        // Record the mapping so downstream queue items can resolve it
                        if (tempId && realId && tempId.startsWith('temp_')) {
                            idMap.set(tempId, realId);
                        }

                        // Remove the temp local record — reconciliation will put the real one
                        const entityTable =
                            item.entity === 'ORDER' ? db.orders :
                                item.entity === 'STOCK' ? db.stock :
                                    item.entity === 'PAYMENT' ? db.payments :
                                        item.entity === 'CLIENT' ? db.clients : null;

                        if (entityTable && tempId?.startsWith('temp_')) {
                            await entityTable.delete(tempId);
                        }
                    }

                    await db.syncQueue.delete(item.id!);
                } else {
                    console.error(`Failed to sync item ${item.id}`, await response.text());
                }
            } catch (error) {
                console.error(`Error syncing item ${item.id}`, error);
                break; // Stop if network fails again
            }
        }

        if ((await db.syncQueue.count()) === 0) {
            toast({
                title: "Sync Complete",
                description: "All offline changes have been synchronized with the server.",
            });
        }
    }, [toast]);

    /**
     * Server-wins reconciliation.
     * Removes local Dexie records that no longer exist on the server
     * and are not pending in the syncQueue (i.e. not real offline writes).
     */
    const reconcileWithServer = useCallback(async () => {
        try {
            const pendingQueue = await db.syncQueue.toArray();
            const pendingIds = new Set(pendingQueue.map(q => q.data?.id).filter(Boolean));

            const endpoints = [
                { url: '/api/orders?pageSize=1000', table: db.orders },
                { url: '/api/payments?pageSize=1000', table: db.payments },
                { url: '/api/inventory?pageSize=1000', table: db.stock },
                { url: '/api/clients?pageSize=1000', table: db.clients },
            ] as const;

            for (const { url, table } of endpoints) {
                try {
                    const res = await fetch(url);
                    if (!res.ok) continue;
                    const result = await res.json();
                    if (!result.success || !Array.isArray(result.data)) continue;

                    const serverIds = new Set<string>(result.data.map((item: any) => item.id));
                    const localRecords = await (table as any).toArray();
                    const staleIds = localRecords
                        .map((r: any) => r.id as string)
                        .filter((id: string) => !serverIds.has(id) && !pendingIds.has(id));

                    if (staleIds.length > 0) {
                        console.log(`[Reconcile] Removing ${staleIds.length} stale local record(s) from ${url}`);
                        await (table as any).bulkDelete(staleIds);
                    }
                } catch { /* non-blocking */ }
            }
        } catch (error) {
            console.error('[Reconcile] Failed:', error);
        }
    }, []);

    // When coming back online: push pending writes first, then reconcile stale data
    useEffect(() => {
        if (isOnline) {
            syncData().then(() => reconcileWithServer());
        }
    }, [isOnline, syncData, reconcileWithServer]);

    const queueAction = async (item: Omit<SyncQueueItem, 'timestamp'>) => {
        await db.syncQueue.add({
            ...item,
            timestamp: Date.now()
        });

        const { entity, data } = item;
        try {
            switch (entity) {
                case 'ORDER':
                    await db.orders.put({ ...data, isOffline: true });
                    break;
                case 'STOCK':
                    await db.stock.put({ ...data, isOffline: true });
                    break;
                case 'PAYMENT':
                    await db.payments.put({ ...data, isOffline: true });
                    break;
                case 'CLIENT':
                    await db.clients.put({ ...data, isOffline: true });
                    break;
            }
        } catch (e) {
            console.error('Failed to update local db', e);
        }
    };

    return {
        isOnline,
        queueAction,
        syncData,
        reconcileWithServer,
    };
}
