"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import "./print-styles.css"; // We'll create this for specific print overrides if needed, or just use Tailwind

// Duplicate interfaces for now to avoid dependency issues, or import from a shared type file if available
interface OrderItem {
    id: string;
    furnitureType: { name: string };
    fabricTypes: { name: string }[];
    quantity: number;
    price: number;
    notes: string | null;
}

interface Order {
    id: string;
    orderNumber: string;
    client: {
        id: string;
        name: string;
        phone: string;
        address: string | null;
    };
    deliveryDate: string;
    status: string;
    totalPrice: number;
    advancePayment: number;
    notes: string | null;
    items: OrderItem[];
    createdAt: string;
}

export default function OrderPrintPage() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchOrder();
        }
    }, [params.id]);

    const fetchOrder = async () => {
        try {
            const response = await fetch(`/api/orders/${params.id}`);
            const result = await response.json();

            if (result.success) {
                setOrder(result.data);
                // Wait for render then print
                setTimeout(() => {
                    window.print();
                }, 500);
            }
        } catch (error) {
            console.error("Failed to fetch order", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
        );
    }

    if (!order) return <div className="p-8 text-center">Order not found</div>;

    return (
        <div className="min-h-screen bg-white text-black p-8 font-sans print-container">
            {/* Header */}
            <div className="flex justify-between items-start mb-12 border-b-2 border-black pb-6">
                <div>
                    <h1 className="text-4xl font-bold uppercase tracking-tight mb-2">WoodLedger</h1>
                    <p className="text-sm text-gray-600 uppercase tracking-widest">Premium Furniture</p>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-bold uppercase mb-1">Invoice</h2>
                    <p className="font-mono text-lg text-gray-600">#{order.orderNumber}</p>
                    <p className="text-sm text-gray-500 mt-1">
                        {format(new Date(order.createdAt), "MMMM dd, yyyy")}
                    </p>
                </div>
            </div>

            {/* Client & Delivery Info Grid */}
            <div className="grid grid-cols-2 gap-12 mb-12">
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 border-b border-gray-200 pb-2">
                        Bill To
                    </h3>
                    <div className="space-y-1">
                        <p className="font-bold text-lg">{order.client.name}</p>
                        <p className="text-gray-600">{order.client.phone}</p>
                        {order.client.address && (
                            <p className="text-gray-600 whitespace-pre-line">{order.client.address}</p>
                        )}
                    </div>
                </div>
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 border-b border-gray-200 pb-2">
                        Delivery Details
                    </h3>
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Estimated Date:</span>
                            <span className="font-medium">{format(new Date(order.deliveryDate), "PPP")}</span>
                        </div>
                        {order.notes && (
                            <div className="mt-4 bg-gray-50 p-3 rounded border border-gray-100 text-sm italic text-gray-600">
                                <strong>Notes:</strong> {order.notes}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-12">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b-2 border-black">
                            <th className="py-3 font-bold uppercase text-xs tracking-wider">Item Details</th>
                            <th className="py-3 font-bold uppercase text-xs tracking-wider text-right">Qty</th>
                            <th className="py-3 font-bold uppercase text-xs tracking-wider text-right">Unit Price</th>
                            <th className="py-3 font-bold uppercase text-xs tracking-wider text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {order.items.map((item) => (
                            <tr key={item.id}>
                                <td className="py-4">
                                    <p className="font-bold text-gray-900">{item.furnitureType.name}</p>
                                    <p className="text-sm text-gray-600">
                                        {item.fabricTypes.map(f => f.name).join(", ")}
                                    </p>
                                    {item.notes && <p className="text-xs text-gray-500 italic mt-1">{item.notes}</p>}
                                </td>
                                <td className="py-4 text-right font-mono text-gray-700">{item.quantity}</td>
                                <td className="py-4 text-right font-mono text-gray-700">
                                    Rs. {item.price.toLocaleString()}
                                </td>
                                <td className="py-4 text-right font-bold font-mono">
                                    Rs. {(item.price * item.quantity).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan={3} className="pt-6 text-right font-bold uppercase text-xs tracking-wider text-gray-500">
                                Subtotal
                            </td>
                            <td className="pt-6 text-right font-bold font-mono text-lg">
                                Rs. {order.totalPrice.toLocaleString()}
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={3} className="pt-2 text-right font-bold uppercase text-xs tracking-wider text-gray-500">
                                Advance Paid
                            </td>
                            <td className="pt-2 text-right font-bold font-mono text-lg text-gray-600">
                                - Rs. {order.advancePayment.toLocaleString()}
                            </td>
                        </tr>
                        <tr className="border-t-2 border-black">
                            <td colSpan={3} className="pt-4 text-right font-black uppercase text-sm tracking-wider">
                                Balance Due
                            </td>
                            <td className="pt-4 text-right font-black font-mono text-2xl">
                                Rs. {(order.totalPrice - order.advancePayment).toLocaleString()}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-8 border-t border-gray-200 text-center text-xs text-gray-500 uppercase tracking-widest">
                <p>&copy; {new Date().getFullYear()} WoodLedger Furniture. All rights reserved.</p>
                <p className="mt-1">Thank you for your business.</p>
            </div>
        </div>
    );
}
