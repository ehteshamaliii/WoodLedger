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

const createPaymentSchema = z.object({
    accountId: z.string(),
    orderId: z.string().optional().nullable(),
    amount: z.number().min(0.01, "Amount must be greater than 0"),
    type: z.enum(["CREDIT", "DEBIT"]),
    description: z.string().optional(),
    date: z.string().datetime(),
});

// ============================================
// GET ALL PAYMENTS
// ============================================

export async function GET(request: NextRequest) {
    try {
        await requirePermission("payments.view");

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "10");
        const search = searchParams.get("search") || "";
        const type = searchParams.get("type") || undefined;
        const accountId = searchParams.get("accountId") || undefined;

        const where: any = {
            AND: [
                search
                    ? {
                        OR: [
                            { description: { contains: search } },
                            { account: { name: { contains: search } } },
                        ],
                    }
                    : {},
                type ? { type } : {},
                accountId ? { accountId } : {},
            ],
        };

        const [payments, total] = await Promise.all([
            prisma.payment.findMany({
                where,
                include: {
                    account: true,
                    order: { select: { id: true, orderNumber: true } },
                },
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { date: "desc" },
            }),
            prisma.payment.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            data: payments.map((payment) => ({
                id: payment.id,
                account: {
                    id: payment.account.id,
                    name: payment.account.name,
                    type: payment.account.type,
                },
                orderId: payment.orderId,
                order: payment.order ? { id: payment.order.id, orderNumber: payment.order.orderNumber } : null,
                amount: payment.amount.toNumber(),
                type: payment.type,
                description: payment.description,
                date: payment.date,
                createdAt: payment.createdAt,
            })),
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
        console.error("Error fetching payments:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================
// CREATE PAYMENT
// ============================================

export async function POST(request: NextRequest) {
    try {
        const currentUser = await requirePermission("payments.create");
        const body = await request.json();
        const validation = createPaymentSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { accountId, orderId, amount, type, description, date } = validation.data;

        // Verify account exists
        const account = await prisma.account.findUnique({ where: { id: accountId } });
        if (!account) {
            return NextResponse.json(
                { success: false, error: "Account not found" },
                { status: 404 }
            );
        }

        // Verify order if provided
        if (orderId) {
            const order = await prisma.order.findUnique({ where: { id: orderId } });
            if (!order) {
                return NextResponse.json(
                    { success: false, error: "Order not found" },
                    { status: 404 }
                );
            }
        }

        // Create payment and update account balance in transaction
        const result = await prisma.$transaction(async (tx) => {
            const payment = await tx.payment.create({
                data: {
                    accountId,
                    orderId,
                    amount,
                    type,
                    description,
                    date: new Date(date),
                },
                include: {
                    account: true,
                    order: { select: { id: true, orderNumber: true } },
                },
            });

            // Update account balance
            const balanceChange = type === "CREDIT" ? amount : -amount;
            await tx.account.update({
                where: { id: accountId },
                data: { balance: { increment: balanceChange } },
            });

            // Sync order.advancePayment = total CREDIT payments for this order
            if (orderId) {
                const payments = await tx.payment.findMany({
                    where: { orderId },
                    select: { amount: true, type: true }
                });
                const totalPaid = payments.reduce((acc, p) => {
                    const amt = p.amount.toNumber();
                    return p.type === 'CREDIT' ? acc + amt : acc - amt;
                }, 0);
                await tx.order.update({
                    where: { id: orderId },
                    data: { advancePayment: totalPaid },
                });
            }

            return payment;
        });

        await logActivity(
            "CREATE",
            "Payment",
            result.id,
            { amount, type, account: account.name },
            currentUser.id
        );

        // Real-time Notification
        const io = (global as any).io;
        if (io) {
            io.emit("new_notification", {
                id: crypto.randomUUID(),
                type: "PAYMENT",
                title: "Payment Recorded",
                content: `${type} of Rs. ${amount} recorded for ${account.name}`,
                status: "UNREAD",
                createdAt: new Date(),
                link: `/payments`,
            });
        }

        // Send Email Receipt (if client email is available via account->client relation)
        // Since account might be linked to a client
        if (account.clientId) {
            const client = await prisma.client.findUnique({ where: { id: account.clientId } });
            if (client && client.email) {
                await sendEmail({
                    to: client.email,
                    subject: "Payment Receipt",
                    html: `
                        <h1>Payment Receipt</h1>
                        <p>Amount: <strong>Rs. ${amount}</strong></p>
                        <p>Type: ${type}</p>
                        <p>Date: ${new Date(date).toDateString()}</p>
                        <p>Description: ${description || "N/A"}</p>
                    `,
                });
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                id: result.id,
                account: result.account,
                orderId: result.orderId,
                order: result.order,
                amount: result.amount.toNumber(),
                type: result.type,
                description: result.description,
                date: result.date,
                createdAt: result.createdAt,
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
        console.error("Error creating payment:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
