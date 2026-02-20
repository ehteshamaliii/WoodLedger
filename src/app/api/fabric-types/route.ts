import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, logActivity } from "@/lib/auth";
import { z } from "zod";

// Force dynamic for API routes using cookies
export const dynamic = 'force-dynamic';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createFabricTypeSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    imageUrl: z.string().optional(),
    description: z.string().optional(),
});

// ============================================
// GET ALL FABRIC TYPES
// ============================================

export async function GET() {
    try {
        await requirePermission("types.view");

        const fabricTypes = await prisma.fabricType.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: { stocks: true, orderItems: true }
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: fabricTypes,
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
        console.error("Error fetching fabric types:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================
// CREATE FABRIC TYPE
// ============================================

export async function POST(request: NextRequest) {
    try {
        const currentUser = await requirePermission("types.manage");
        const body = await request.json();
        const validation = createFabricTypeSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { name, imageUrl, description } = validation.data;

        // Check if name exists
        const existing = await prisma.fabricType.findUnique({ where: { name } });
        if (existing) {
            return NextResponse.json(
                { success: false, error: "Fabric type with this name already exists" },
                { status: 400 }
            );
        }

        const fabricType = await prisma.fabricType.create({
            data: { name, imageUrl, description },
        });

        await logActivity("CREATE", "FabricType", fabricType.id, { name }, currentUser.id);

        return NextResponse.json({
            success: true,
            data: fabricType,
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
        console.error("Error creating fabric type:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
