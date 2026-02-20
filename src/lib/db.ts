import Dexie, { Table } from 'dexie';

export interface OfflineOrder {
    id: string;
    orderNumber: string;
    clientId: string;
    deliveryDate: Date;
    totalPrice: number;
    advancePayment: number;
    paidSoFar?: number;
    balance?: number;
    status: string;
    notes?: string;
    items: any[];
    createdAt: Date;
    updatedAt: Date;
    isOffline?: boolean;
}

export interface OfflineStock {
    id: string;
    productName: string;
    furnitureTypeId: string;
    fabricTypeId: string;
    quantity: number;
    createPrice: number;
    sellingPrice: number;
    minQuantity: number;
    updatedAt: Date;
    isOffline?: boolean;
}

export interface OfflinePayment {
    id: string;
    accountId: string;
    orderId?: string;
    amount: number;
    type: 'CREDIT' | 'DEBIT';
    description?: string;
    date: Date;
    createdAt: Date;
    isOffline?: boolean;
}

export interface OfflineClient {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    notes?: string;
    createdAt: Date;
    isOffline?: boolean;
}

export interface SyncQueueItem {
    id?: number;
    entity: 'ORDER' | 'STOCK' | 'PAYMENT' | 'CLIENT';
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    data: any;
    timestamp: number;
}

export interface OfflineNotification {
    id: string;
    type: string;
    title: string;
    content: string;
    status: string;
    link?: string | null;
    createdAt: Date;
}

export class WoodLedgerDB extends Dexie {
    orders!: Table<OfflineOrder>;
    stock!: Table<OfflineStock>;
    payments!: Table<OfflinePayment>;
    clients!: Table<OfflineClient>;
    notifications!: Table<OfflineNotification>;
    syncQueue!: Table<SyncQueueItem>;

    constructor() {
        super('WoodLedgerDB');
        this.version(2).stores({
            orders: 'id, clientId, status, createdAt',
            stock: 'id, productName, furnitureTypeId, fabricTypeId',
            payments: 'id, accountId, orderId, date',
            clients: 'id, name, phone, email',
            notifications: 'id, type, status, createdAt',
            syncQueue: '++id, entity, action, timestamp'
        });
    }
}

export const db = new WoodLedgerDB();
