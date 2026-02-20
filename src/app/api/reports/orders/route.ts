import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const status = searchParams.get("status");

        const where: any = {};
        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }
        if (status && status !== "ALL") {
            where.status = status;
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                client: { select: { name: true, phone: true } },
                items: {
                    include: {
                        furnitureType: { select: { name: true } },
                        fabricTypes: { select: { name: true } },
                    }
                }
            },
            orderBy: { createdAt: "desc" },
        });

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

        const enrichedOrders = orders.map(order => {
            const paidSoFar = paidMap.get(order.id) ?? 0;
            return {
                ...order,
                totalPrice: order.totalPrice.toNumber(),
                advancePayment: order.advancePayment.toNumber(),
                paidSoFar,
                balance: order.totalPrice.toNumber() - paidSoFar,
            };
        });

        return NextResponse.json({ success: true, data: enrichedOrders });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
