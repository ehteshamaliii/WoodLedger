import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, logActivity } from "@/lib/auth";
import { z } from "zod";

// Force dynamic for API routes using cookies
export const dynamic = 'force-dynamic';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createFurnitureTypeSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
});

// ============================================
// GET ALL FURNITURE TYPES
// ============================================

export async function GET() {
    try {
        await requirePermission("types.view");

        const furnitureTypes = await prisma.furnitureType.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: { stocks: true, orderItems: true }
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: furnitureTypes,
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
        console.error("Error fetching furniture types:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================
// CREATE FURNITURE TYPE
// ============================================

export async function POST(request: NextRequest) {
    try {
        const currentUser = await requirePermission("types.manage");
        const body = await request.json();
        const validation = createFurnitureTypeSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { name, description } = validation.data;

        // Check if name exists
        const existing = await prisma.furnitureType.findUnique({ where: { name } });
        if (existing) {
            return NextResponse.json(
                { success: false, error: "Furniture type with this name already exists" },
                { status: 400 }
            );
        }

        const furnitureType = await prisma.furnitureType.create({
            data: { name, description },
        });

        await logActivity("CREATE", "FurnitureType", furnitureType.id, { name }, currentUser.id);

        return NextResponse.json({
            success: true,
            data: furnitureType,
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
        console.error("Error creating furniture type:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
