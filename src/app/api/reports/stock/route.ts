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
        const lowStockOnly = searchParams.get("lowStock") === "true";

        const where: any = {};
        if (lowStockOnly) {
            where.quantity = { lte: prisma.stock.fields.minQuantity };
        }

        const stock = await prisma.stock.findMany({
            where,
            include: {
                furnitureType: { select: { name: true } },
                fabricType: { select: { name: true } },
            },
            orderBy: { quantity: "asc" },
        });

        return NextResponse.json({ success: true, data: stock });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
