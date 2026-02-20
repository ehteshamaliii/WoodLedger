import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, logActivity } from "@/lib/auth";
import { z } from "zod";

// Force dynamic for API routes using cookies
export const dynamic = 'force-dynamic';

const updatePaymentSchema = z.object({
    accountId: z.string().optional(),
    orderId: z.string().optional().nullable(),
    amount: z.number().min(0.01).optional(),
    type: z.enum(["CREDIT", "DEBIT"]).optional(),
    description: z.string().optional(),
    date: z.string().datetime().optional(),
});

// ============================================
// GET SINGLE PAYMENT
// ============================================

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requirePermission("payments.view");
        const { id } = await params;

        const payment = await prisma.payment.findUnique({
            where: { id },
            include: {
                account: true,
                order: {
                    select: {
                        id: true,
                        orderNumber: true,
                    }
                }
            },
        });

        if (!payment) {
            return NextResponse.json({ success: false, error: "Payment not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                id: payment.id,
                account: payment.account,
                orderId: payment.orderId,
                order: payment.order,
                amount: payment.amount.toNumber(),
                type: payment.type,
                description: payment.description,
                date: payment.date,
                createdAt: payment.createdAt,
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
        console.error("Error fetching payment:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================
// UPDATE PAYMENT
// ============================================

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await requirePermission("payments.edit");
        const { id } = await params;
        const body = await request.json();
        const validation = updatePaymentSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const existingPayment = await prisma.payment.findUnique({
            where: { id },
            include: { account: true },
        });

        if (!existingPayment) {
            return NextResponse.json({ success: false, error: "Payment not found" }, { status: 404 });
        }

        const data = validation.data;

        // Update payment and revert/apply balance changes in transaction
        const payment = await prisma.$transaction(async (tx) => {
            // If amount or type changed, revert old balance change
            if (data.amount !== undefined || data.type !== undefined) {
                const oldChange =
                    existingPayment.type === "CREDIT"
                        ? existingPayment.amount.toNumber()
                        : -existingPayment.amount.toNumber();
                await tx.account.update({
                    where: { id: existingPayment.accountId },
                    data: { balance: { decrement: oldChange } },
                });
                const newAmount = data.amount ?? existingPayment.amount.toNumber();
                const newType = data.type ?? existingPayment.type;
                const newChange = newType === "CREDIT" ? newAmount : -newAmount;
                const targetAccountId = data.accountId ?? existingPayment.accountId;
                await tx.account.update({
                    where: { id: targetAccountId },
                    data: { balance: { increment: newChange } },
                });
            }

            const updated = await tx.payment.update({
                where: { id },
                data: {
                    ...(data.accountId && { accountId: data.accountId }),
                    ...(data.orderId !== undefined && { orderId: data.orderId }),
                    ...(data.amount && { amount: data.amount }),
                    ...(data.type && { type: data.type }),
                    ...(data.description !== undefined && { description: data.description }),
                    ...(data.date && { date: new Date(data.date) }),
                },
                include: {
                    account: true,
                    order: {
                        select: {
                            id: true,
                            orderNumber: true,
                        }
                    }
                },
            });

            // Sync advancePayment on any affected orders
            const affectedOrderIds = new Set<string>();
            if (existingPayment.orderId) affectedOrderIds.add(existingPayment.orderId);
            if (updated.orderId) affectedOrderIds.add(updated.orderId);
            for (const oid of affectedOrderIds) {
                const payments = await tx.payment.findMany({
                    where: { orderId: oid },
                    select: { amount: true, type: true }
                });
                const totalPaid = payments.reduce((acc, p) => {
                    const amt = p.amount.toNumber();
                    return p.type === 'CREDIT' ? acc + amt : acc - amt;
                }, 0);
                await tx.order.update({
                    where: { id: oid },
                    data: { advancePayment: totalPaid },
                });
            }

            return updated;
        });

        await logActivity("UPDATE", "Payment", id, { amount: payment.amount.toNumber() }, currentUser.id);

        return NextResponse.json({
            success: true,
            data: {
                id: payment.id,
                account: payment.account,
                orderId: payment.orderId,
                order: payment.order,
                amount: payment.amount.toNumber(),
                type: payment.type,
                description: payment.description,
                date: payment.date,
                createdAt: payment.createdAt,
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
        console.error("Error updating payment:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================
// DELETE PAYMENT
// ============================================

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await requirePermission("payments.delete");
        const { id } = await params;

        const payment = await prisma.payment.findUnique({ where: { id } });
        if (!payment) {
            return NextResponse.json({ success: false, error: "Payment not found" }, { status: 404 });
        }

        // Delete payment and revert balance change in transaction
        await prisma.$transaction(async (tx) => {
            const balanceChange = payment.type === "CREDIT" ? payment.amount.toNumber() : -payment.amount.toNumber();
            await tx.account.update({
                where: { id: payment.accountId },
                data: { balance: { decrement: balanceChange } },
            });
            await tx.payment.delete({ where: { id } });

            // Sync order.advancePayment after deletion
            if (payment.orderId) {
                const payments = await tx.payment.findMany({
                    where: { orderId: payment.orderId },
                    select: { amount: true, type: true }
                });
                const totalPaid = payments.reduce((acc, p) => {
                    const amt = p.amount.toNumber();
                    return p.type === 'CREDIT' ? acc + amt : acc - amt;
                }, 0);
                await tx.order.update({
                    where: { id: payment.orderId },
                    data: { advancePayment: totalPaid },
                });
            }
        });

        await logActivity("DELETE", "Payment", id, { amount: payment.amount.toNumber() }, currentUser.id);

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
        console.error("Error deleting payment:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
