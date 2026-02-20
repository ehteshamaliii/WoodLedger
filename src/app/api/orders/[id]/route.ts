import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, logActivity } from "@/lib/auth";
import { z } from "zod";

// Force dynamic for API routes using cookies
export const dynamic = 'force-dynamic';

const orderItemSchema = z.object({
    id: z.string().optional(),
    furnitureTypeId: z.string(),
    fabricTypeIds: z.array(z.string()).min(1),
    quantity: z.number().int().min(1),
    price: z.number().min(0),
    notes: z.string().optional(),
});

const updateOrderSchema = z.object({
    clientId: z.string().optional(),
    deliveryDate: z.string().datetime().optional(),
    status: z.enum(["PENDING", "CONFIRMED", "IN_PRODUCTION", "READY", "DELIVERED", "CANCELLED"]).optional(),
    advancePayment: z.number().min(0).optional(),
    notes: z.string().optional(),
    items: z.array(orderItemSchema).optional(),
});

// ============================================
// GET SINGLE ORDER
// ============================================

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requirePermission("orders.view");
        const { id } = await params;

        const order = await prisma.order.findFirst({
            where: {
                OR: [
                    { id },
                    { orderNumber: id }
                ]
            },
            include: {
                client: true,
                items: {
                    include: {
                        furnitureType: true,
                        fabricTypes: true,
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
        }

        // Aggregate total payments (Net: CREDIT - DEBIT) for this order
        const payments = await prisma.payment.findMany({
            where: { orderId: order.id },
            select: { amount: true, type: true }
        });
        const paidSoFar = payments.reduce((acc, p) => {
            const amt = p.amount.toNumber();
            return p.type === 'CREDIT' ? acc + amt : acc - amt;
        }, 0);

        return NextResponse.json({
            success: true,
            data: {
                id: order.id,
                orderNumber: order.orderNumber,
                clientId: order.clientId,
                client: order.client,
                deliveryDate: order.deliveryDate,
                status: order.status,
                totalPrice: order.totalPrice.toNumber(),
                advancePayment: order.advancePayment.toNumber(),
                paidSoFar,
                balance: order.totalPrice.toNumber() - paidSoFar,
                notes: order.notes,
                items: order.items.map((item) => ({
                    id: item.id,
                    furnitureTypeId: item.furnitureTypeId,
                    fabricTypeIds: item.fabricTypes.map(ft => ft.id),
                    furnitureType: item.furnitureType,
                    fabricTypes: item.fabricTypes,
                    quantity: item.quantity,
                    price: item.price.toNumber(),
                    notes: item.notes,
                })),
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
            },
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "Unauthorized") {
                return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
            }
            if (error.message === "Forbidden") {
                return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
            }
        }
        console.error("Error fetching order:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================
// UPDATE ORDER
// ============================================

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await requirePermission("orders.edit");
        const { id } = await params;
        const body = await request.json();
        const validation = updateOrderSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const existingOrder = await prisma.order.findFirst({
            where: {
                OR: [
                    { id },
                    { orderNumber: id }
                ]
            }
        });
        if (!existingOrder) {
            return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
        }

        const { clientId, deliveryDate, status, advancePayment, notes, items } = validation.data;

        // Calculate total price based on new items if provided, otherwise use existing order's total price
        let totalPrice = existingOrder.totalPrice.toNumber();
        if (items) {
            totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        }

        // Guard: advance payment cannot exceed the invoice total
        // If advancePayment is provided in the request, use it for the check.
        // Otherwise, use the existing order's advance payment for the check.
        const effectiveAdvance = typeof advancePayment === 'number' ? advancePayment : existingOrder.advancePayment.toNumber();
        if (effectiveAdvance > totalPrice) {
            return NextResponse.json(
                { success: false, error: `Advance payment (Rs. ${effectiveAdvance}) cannot exceed the invoice total (Rs. ${totalPrice})` },
                { status: 400 }
            );
        }

        // Update order in transaction
        const order = await prisma.$transaction(async (tx) => {
            // If items are provided, delete old items and create new ones
            if (items) {
                await tx.orderItem.deleteMany({ where: { orderId: existingOrder.id } });
            }

            // Construct update data object
            const updateData: any = {};
            if (clientId) updateData.clientId = clientId;
            if (deliveryDate) updateData.deliveryDate = new Date(deliveryDate);
            if (status) updateData.status = status;
            if (typeof advancePayment === 'number') updateData.advancePayment = advancePayment;
            if (notes !== undefined) updateData.notes = notes;
            if (items) {
                updateData.totalPrice = totalPrice;
                updateData.items = {
                    create: items.map((item) => ({
                        furnitureTypeId: item.furnitureTypeId,
                        fabricTypes: {
                            connect: item.fabricTypeIds.map(id => ({ id }))
                        },
                        quantity: item.quantity,
                        price: item.price,
                        notes: item.notes,
                    })),
                };
            }

            return tx.order.update({
                where: { id: existingOrder.id },
                data: updateData,
                include: {
                    client: true,
                    items: {
                        include: {
                            furnitureType: true,
                            fabricTypes: true,
                        },
                    },
                },
            });
        });

        await logActivity(
            "UPDATE",
            "Order",
            existingOrder.id,
            { orderNumber: order.orderNumber, status: order.status },
            currentUser.id
        );

        return NextResponse.json({
            success: true,
            data: {
                id: order.id,
                orderNumber: order.orderNumber,
                client: order.client,
                deliveryDate: order.deliveryDate,
                status: order.status,
                totalPrice: order.totalPrice.toNumber(),
                advancePayment: order.advancePayment.toNumber(),
                notes: order.notes,
                items: order.items.map((item) => ({
                    id: item.id,
                    furnitureType: item.furnitureType,
                    fabricTypes: item.fabricTypes,
                    quantity: item.quantity,
                    price: item.price.toNumber(),
                    notes: item.notes,
                })),
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
            },
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "Unauthorized") {
                return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
            }
            if (error.message === "Forbidden") {
                return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
            }
        }
        console.error("Error updating order:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================
// DELETE ORDER
// ============================================

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await requirePermission("orders.delete");
        const { id } = await params;

        const order = await prisma.order.findFirst({
            where: {
                OR: [
                    { id },
                    { orderNumber: id }
                ]
            }
        });
        if (!order) {
            return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
        }

        // Guard: cannot delete order that has payments — must remove payments first
        const paymentCount = await prisma.payment.count({ where: { orderId: order.id } });
        if (paymentCount > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: `This order has ${paymentCount} payment${paymentCount > 1 ? 's' : ''} linked to it. Please remove all payments before deleting the order.`,
                    paymentCount,
                },
                { status: 409 }
            );
        }

        await logActivity(
            "DELETE",
            "Order",
            order.id,
            { orderNumber: order.orderNumber },
            currentUser.id
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "Unauthorized") {
                return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
            }
            if (error.message === "Forbidden") {
                return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
            }
        }
        console.error("Error deleting order:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
