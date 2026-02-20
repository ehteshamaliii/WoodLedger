import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";

// Force dynamic for API routes using cookies
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// ============================================
// GET ALL ACCOUNTS
// ============================================

export async function GET() {
    try {
        await requirePermission("payments.view");

        const accounts = await prisma.account.findMany({
            orderBy: { name: "asc" },
        });

        return NextResponse.json({
            success: true,
            data: accounts.map((account) => ({
                id: account.id,
                name: account.name,
                type: account.type,
                balance: account.balance.toNumber(),
                details: account.details,
                createdAt: account.createdAt,
            })),
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
        console.error("Error fetching accounts:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
