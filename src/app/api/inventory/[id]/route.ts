import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, logActivity } from "@/lib/auth";
import { z } from "zod";

// Force dynamic for API routes using cookies
export const dynamic = 'force-dynamic';

const updateStockSchema = z.object({
    productName: z.string().min(2).optional(),
    furnitureTypeId: z.string().optional(),
    fabricTypeId: z.string().optional(),
    quantity: z.number().int().min(0).optional(),
    createPrice: z.number().min(0).optional(),
    sellingPrice: z.number().min(0).optional(),
    minQuantity: z.number().int().min(0).optional(),
    images: z.array(z.string()).optional(),
});

// ============================================
// GET SINGLE STOCK ITEM
// ============================================

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requirePermission("inventory.view");
        const { id } = await params;

        const stockItem = await prisma.stock.findUnique({
            where: { id },
            include: {
                furnitureType: true,
                fabricType: true,
                images: true,
            },
        });

        if (!stockItem) {
            return NextResponse.json({ success: false, error: "Stock item not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                id: stockItem.id,
                productName: stockItem.productName,
                furnitureType: stockItem.furnitureType,
                fabricType: stockItem.fabricType,
                quantity: stockItem.quantity,
                createPrice: stockItem.createPrice.toNumber(),
                sellingPrice: stockItem.sellingPrice.toNumber(),
                minQuantity: stockItem.minQuantity,
                images: stockItem.images,
                isLowStock: stockItem.quantity <= stockItem.minQuantity,
                createdAt: stockItem.createdAt,
                updatedAt: stockItem.updatedAt,
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
        console.error("Error fetching stock item:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================
// UPDATE STOCK ITEM
// ============================================

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await requirePermission("inventory.edit");
        const { id } = await params;
        const body = await request.json();
        const validation = updateStockSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const existingItem = await prisma.stock.findUnique({ where: { id } });
        if (!existingItem) {
            return NextResponse.json({ success: false, error: "Stock item not found" }, { status: 404 });
        }

        const data = validation.data;

        // Verify types if changing
        if (data.furnitureTypeId) {
            const furnitureType = await prisma.furnitureType.findUnique({
                where: { id: data.furnitureTypeId },
            });
            if (!furnitureType) {
                return NextResponse.json(
                    { success: false, error: "Furniture type not found" },
                    { status: 404 }
                );
            }
        }

        if (data.fabricTypeId) {
            const fabricType = await prisma.fabricType.findUnique({
                where: { id: data.fabricTypeId },
            });
            if (!fabricType) {
                return NextResponse.json(
                    { success: false, error: "Fabric type not found" },
                    { status: 404 }
                );
            }
        }

        const stockItem = await prisma.stock.update({
            where: { id },
            data: {
                ...(data.productName && { productName: data.productName }),
                ...(data.furnitureTypeId && { furnitureTypeId: data.furnitureTypeId }),
                ...(data.fabricTypeId && { fabricTypeId: data.fabricTypeId }),
                ...(typeof data.quantity === 'number' && { quantity: data.quantity }),
                ...(typeof data.createPrice === 'number' && { createPrice: data.createPrice }),
                ...(typeof data.sellingPrice === 'number' && { sellingPrice: data.sellingPrice }),
                ...(typeof data.minQuantity === 'number' && { minQuantity: data.minQuantity }),
                ...(data.images !== undefined && {
                    images: {
                        deleteMany: {},
                        create: data.images.map(base64 => ({ base64 }))
                    }
                }),
            },
            include: {
                furnitureType: true,
                fabricType: true,
                images: true,
            },
        });

        await logActivity(
            "UPDATE",
            "Stock",
            id,
            { productName: stockItem.productName, quantity: stockItem.quantity },
            currentUser.id
        );

        return NextResponse.json({
            success: true,
            data: {
                id: stockItem.id,
                productName: stockItem.productName,
                furnitureType: stockItem.furnitureType,
                fabricType: stockItem.fabricType,
                quantity: stockItem.quantity,
                createPrice: stockItem.createPrice.toNumber(),
                sellingPrice: stockItem.sellingPrice.toNumber(),
                minQuantity: stockItem.minQuantity,
                images: stockItem.images,
                isLowStock: stockItem.quantity <= stockItem.minQuantity,
                createdAt: stockItem.createdAt,
                updatedAt: stockItem.updatedAt,
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
        console.error("Error updating stock item:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================
// DELETE STOCK ITEM
// ============================================

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await requirePermission("inventory.delete");
        const { id } = await params;

        const stockItem = await prisma.stock.findUnique({ where: { id } });
        if (!stockItem) {
            return NextResponse.json({ success: false, error: "Stock item not found" }, { status: 404 });
        }

        await prisma.stock.delete({ where: { id } });

        await logActivity(
            "DELETE",
            "Stock",
            id,
            { productName: stockItem.productName },
            currentUser.id
        );

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
        console.error("Error deleting stock item:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
