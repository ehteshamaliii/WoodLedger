import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
import { requirePermission, logActivity } from "@/lib/auth";
import { sendEmail } from "@/lib/mail";
import { z } from "zod";

// Force dynamic for API routes using cookies


// ============================================
// VALIDATION SCHEMAS
// ============================================

const orderItemSchema = z.object({
    furnitureTypeId: z.string(),
    fabricTypeIds: z.array(z.string()).min(1, "At least one fabric type is required"),
    quantity: z.number().int().min(1),
    price: z.number().min(0),
    notes: z.string().optional(),
});

const createOrderSchema = z.object({
    clientId: z.string(),
    deliveryDate: z.string().datetime(),
    advancePayment: z.number().min(0).optional().default(0),
    notes: z.string().optional(),
    items: z.array(orderItemSchema).min(1, "At least one item is required"),
});

// ============================================
// GENERATE ORDER NUMBER
// ============================================

async function generateOrderNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

    // Count orders created today
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const count = await prisma.order.count({
        where: {
            createdAt: {
                gte: startOfDay,
                lte: endOfDay,
            },
        },
    });

    const sequence = (count + 1).toString().padStart(3, '0');
    return `ORD-${dateStr}-${sequence}`;
}

// ============================================
// GET ALL ORDERS
// ============================================

export async function GET(request: NextRequest) {
    try {
        await requirePermission("orders.view");

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "10");
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || undefined;
        const clientId = searchParams.get("clientId") || undefined;

        const where: any = {
            AND: [
                search
                    ? {
                        OR: [
                            { orderNumber: { contains: search } },
                            { client: { name: { contains: search } } },
                        ],
                    }
                    : {},
                status ? { status } : {},
                clientId ? { clientId } : {},
            ],
        };

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    client: true,
                    _count: { select: { items: true } },
                },
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: "desc" },
            }),
            prisma.order.count({ where }),
        ]);

        const orderIds = orders.map(o => o.id);

        const payments = await prisma.payment.findMany({
            where: { orderId: { in: orderIds } },
            select: { orderId: true, amount: true, type: true }
        });

        const paidMap = new Map<string, number>();
        payments.forEach(p => {
            const current = paidMap.get(p.orderId!) || 0;
            const amount = p.amount.toNumber();
            paidMap.set(p.orderId!, p.type === 'CREDIT' ? current + amount : current - amount);
        });

        return NextResponse.json({
            success: true,
            data: orders.map((order) => {
                const paidSoFar = paidMap.get(order.id) ?? 0;
                return {
                    id: order.id,
                    orderNumber: order.orderNumber,
                    client: {
                        id: order.client.id,
                        name: order.client.name,
                    },
                    deliveryDate: order.deliveryDate,
                    status: order.status,
                    totalPrice: order.totalPrice.toNumber(),
                    advancePayment: order.advancePayment.toNumber(),
                    paidSoFar,
                    balance: order.totalPrice.toNumber() - paidSoFar,
                    itemCount: order._count.items,
                    createdAt: order.createdAt,
                };
            }),
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
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
        console.error("Error fetching orders:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================
// CREATE ORDER
// ============================================

export async function POST(request: NextRequest) {
    try {
        const currentUser = await requirePermission("orders.create");
        const body = await request.json();
        const validation = createOrderSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { clientId, deliveryDate, advancePayment, notes, items } = validation.data;

        // Verify client exists
        const client = await prisma.client.findUnique({ where: { id: clientId } });
        if (!client) {
            return NextResponse.json(
                { success: false, error: "Client not found" },
                { status: 404 }
            );
        }

        // Calculate total price
        const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // Guard: advance cannot exceed invoice total
        if ((advancePayment || 0) > totalPrice) {
            return NextResponse.json(
                { success: false, error: `Advance payment (Rs. ${advancePayment}) cannot exceed the invoice total (Rs. ${totalPrice})` },
                { status: 400 }
            );
        }

        // Generate order number
        const orderNumber = await generateOrderNumber();

        // Create order with items
        const order = await prisma.order.create({
            data: {
                orderNumber,
                clientId,
                deliveryDate: new Date(deliveryDate),
                totalPrice,
                advancePayment: advancePayment || 0,
                status: "PENDING",
                notes,
                items: {
                    create: items.map((item) => ({
                        furnitureTypeId: item.furnitureTypeId,
                        fabricTypes: {
                            connect: item.fabricTypeIds.map(id => ({ id }))
                        },
                        quantity: item.quantity,
                        price: item.price,
                        notes: item.notes,
                    })),
                },
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

        await logActivity(
            "CREATE",
            "Order",
            order.id,
            { orderNumber: order.orderNumber, client: client.name, totalPrice },
            currentUser.id
        );

        // Real-time Notification
        const io = (global as any).io;
        if (io) {
            io.emit("new_notification", {
                id: crypto.randomUUID(),
                type: "ORDER",
                title: `New Order ${order.orderNumber}`,
                content: `Order created for ${client.name} - Total: Rs. ${totalPrice}`,
                status: "UNREAD",
                createdAt: new Date(),
                link: `/orders/${order.id}`,
            });
        }

        // Email Notification
        if (client.email) {
            await sendEmail({
                to: client.email,
                subject: `Order Confirmation - ${order.orderNumber}`,
                html: `
                    <h1>Thank you for your order!</h1>
                    <p>Order Number: <strong>${order.orderNumber}</strong></p>
                    <p>Total Amount: <strong>Rs. ${totalPrice}</strong></p>
                    <p>Delivery Date: ${new Date(deliveryDate).toDateString()}</p>
                `,
            });
        }

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
        console.error("Error creating order:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
