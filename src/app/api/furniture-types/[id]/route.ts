import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, logActivity } from "@/lib/auth";
import { z } from "zod";

// Force dynamic for API routes using cookies
export const dynamic = 'force-dynamic';

const updateFurnitureTypeSchema = z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional().nullable(),
});

// ============================================
// GET SINGLE FURNITURE TYPE
// ============================================

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requirePermission("types.view");
        const { id } = await params;

        const furnitureType = await prisma.furnitureType.findUnique({ where: { id } });

        if (!furnitureType) {
            return NextResponse.json(
                { success: false, error: "Furniture type not found" },
                { status: 404 }
            );
        }

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
        console.error("Error fetching furniture type:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================
// UPDATE FURNITURE TYPE
// ============================================

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await requirePermission("types.manage");
        const { id } = await params;
        const body = await request.json();
        const validation = updateFurnitureTypeSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const existing = await prisma.furnitureType.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json(
                { success: false, error: "Furniture type not found" },
                { status: 404 }
            );
        }

        const data = validation.data;

        // Check name uniqueness if changing
        if (data.name && data.name !== existing.name) {
            const nameExists = await prisma.furnitureType.findUnique({ where: { name: data.name } });
            if (nameExists) {
                return NextResponse.json(
                    { success: false, error: "Furniture type with this name already exists" },
                    { status: 400 }
                );
            }
        }

        const furnitureType = await prisma.furnitureType.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.description !== undefined && { description: data.description }),
            },
        });

        await logActivity("UPDATE", "FurnitureType", id, { name: furnitureType.name }, currentUser.id);

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
        console.error("Error updating furniture type:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================
// DELETE FURNITURE TYPE
// ============================================

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await requirePermission("types.manage");
        const { id } = await params;

        const furnitureType = await prisma.furnitureType.findUnique({ where: { id } });
        if (!furnitureType) {
            return NextResponse.json(
                { success: false, error: "Furniture type not found" },
                { status: 404 }
            );
        }

        // Check if type is in use
        const inUse = await prisma.orderItem.findFirst({ where: { furnitureTypeId: id } });
        if (inUse) {
            return NextResponse.json(
                { success: false, error: "Cannot delete furniture type that is in use" },
                { status: 400 }
            );
        }

        await prisma.furnitureType.delete({ where: { id } });

        await logActivity("DELETE", "FurnitureType", id, { name: furnitureType.name }, currentUser.id);

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
        console.error("Error deleting furniture type:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
