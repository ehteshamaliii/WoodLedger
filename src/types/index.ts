// Global type definitions for WoodLedger

// User roles
export type UserRole = 'admin' | 'sales' | 'inventory_manager' | 'accountant';

// Order status
export type OrderStatus = 'pending' | 'confirmed' | 'in_production' | 'ready' | 'delivered' | 'cancelled';

// Payment status
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// Account types
export type AccountType = 'client' | 'vendor' | 'labor' | 'expense' | 'other';

// Notification types
export type NotificationType = 'order' | 'payment' | 'stock' | 'delivery' | 'system';

// Notification status
export type NotificationStatus = 'unread' | 'read' | 'archived';

// Base entity interface
export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}

// User
export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    roleId: string;
    permissions?: string[];
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

// Session
export interface Session {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
}

// Client
export interface Client extends BaseEntity {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    notes?: string;
}

// Furniture Type
export interface FurnitureType extends BaseEntity {
    name: string;
    description?: string;
}

// Fabric Type
export interface FabricType extends BaseEntity {
    name: string;
    imageUrl?: string;
    description?: string;
}

// Order
export interface Order extends BaseEntity {
    clientId: string;
    client?: Client;
    items: OrderItem[];
    totalPrice: number;
    advancePayment: number;
    deliveryDate: Date;
    status: OrderStatus;
    notes?: string;
}

// Order Item
export interface OrderItem extends BaseEntity {
    orderId: string;
    furnitureTypeId: string;
    furnitureType?: FurnitureType;
    fabricTypeId: string;
    fabricType?: FabricType;
    quantity: number;
    price: number;
    notes?: string;
}

// Stock / Inventory
export interface Stock extends BaseEntity {
    productName: string;
    furnitureTypeId: string;
    furnitureType?: FurnitureType;
    fabricTypeId: string;
    fabricType?: FabricType;
    quantity: number;
    createPrice: number;
    sellingPrice: number;
    imageUrl?: string;
}

// Account
export interface Account extends BaseEntity {
    name: string;
    type: AccountType;
    balance: number;
    details?: string;
}

// Payment
export interface Payment extends BaseEntity {
    accountId: string;
    account?: Account;
    invoiceId?: string;
    amount: number;
    type: 'credit' | 'debit';
    description?: string;
    date: Date;
}

// Notification
export interface Notification extends BaseEntity {
    userId: string;
    type: NotificationType;
    title: string;
    content: string;
    status: NotificationStatus;
    link?: string;
}

// Activity Log
export interface ActivityLog extends BaseEntity {
    userId: string;
    user?: User;
    action: string;
    entityType: string;
    entityId: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// Form types
export interface SelectOption {
    value: string;
    label: string;
}

// Dashboard widget types
export interface DashboardWidget {
    id: string;
    title: string;
    type: 'stat' | 'chart' | 'list' | 'alert';
    data: unknown;
}

// Offline sync types
export interface SyncQueueItem {
    id: string;
    action: 'create' | 'update' | 'delete';
    entity: string;
    data: unknown;
    timestamp: number;
    synced: boolean;
}
