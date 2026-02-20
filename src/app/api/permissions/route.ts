import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// Force dynamic for API routes using cookies
export const dynamic = 'force-dynamic';

// ============================================
// GET ALL PERMISSIONS
// ============================================

export async function GET() {
    try {
        await requireRole(["Admin"]);

        const permissions = await prisma.permission.findMany({
            orderBy: [{ module: "asc" }, { name: "asc" }],
        });

        // Group permissions by module
        const grouped = permissions.reduce((acc, permission) => {
            if (!acc[permission.module]) {
                acc[permission.module] = [];
            }
            acc[permission.module].push({
                id: permission.id,
                name: permission.name,
                description: permission.description,
            });
            return acc;
        }, {} as Record<string, { id: string; name: string; description: string | null }[]>);

        return NextResponse.json({
            success: true,
            data: permissions,
            grouped,
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
        console.error("Error fetching permissions:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
