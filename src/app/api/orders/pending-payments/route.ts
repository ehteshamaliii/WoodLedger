import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/orders/pending-payments
 * Returns orders that still have an outstanding balance (remaining > 0).
 * Remaining = totalPrice - sum of CREDIT payments already linked to the order.
 */
export async function GET(request: NextRequest) {
    try {
        await requirePermission("orders.view");

        // Fetch all non-cancelled, non-completed orders with their linked payments
        const orders = await prisma.order.findMany({
            where: {
                status: { notIn: ["CANCELLED"] },
            },
            include: {
                client: { select: { id: true, name: true } },
                payments: {
                    where: { type: "CREDIT" },
                    select: { amount: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const result = orders
            .map((order) => {
                const paidSoFar = order.payments.reduce(
                    (sum, p) => sum + p.amount.toNumber(),
                    0
                );
                const remaining = order.totalPrice.toNumber() - paidSoFar;
                return {
                    id: order.id,
                    orderNumber: order.orderNumber,
                    client: order.client,
                    status: order.status,
                    totalPrice: order.totalPrice.toNumber(),
                    paidSoFar,
                    remaining: Math.max(0, remaining),
                };
            })
            .filter((o) => o.remaining > 0);

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "Unauthorized")
                return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
            if (error.message === "Forbidden")
                return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }
        console.error("Error fetching pending payment orders:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
