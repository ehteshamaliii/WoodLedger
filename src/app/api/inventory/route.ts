import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, logActivity } from "@/lib/auth";
import { z } from "zod";

// Force dynamic for API routes using cookies
export const dynamic = 'force-dynamic';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createStockSchema = z.object({
    productName: z.string().min(2, "Product name must be at least 2 characters"),
    furnitureTypeId: z.string(),
    fabricTypeId: z.string(),
    quantity: z.number().int().min(0),
    createPrice: z.number().min(0),
    sellingPrice: z.number().min(0),
    minQuantity: z.number().int().min(0).optional().default(5),
    images: z.array(z.string()).optional(),
});

// ============================================
// GET ALL STOCK ITEMS
// ============================================

export async function GET(request: NextRequest) {
    try {
        await requirePermission("inventory.view");

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "10");
        const search = searchParams.get("search") || "";
        const lowStock = searchParams.get("lowStock") === "true";

        const where: any = {
            AND: [
                search
                    ? {
                        OR: [
                            { productName: { contains: search } },
                            { furnitureType: { name: { contains: search } } },
                            { fabricType: { name: { contains: search } } },
                        ],
                    }
                    : {},
                lowStock
                    ? {
                        quantity: {
                            lte: prisma.stock.fields.minQuantity,
                        },
                    }
                    : {},
            ],
        };

        const [stockItems, total] = await Promise.all([
            prisma.stock.findMany({
                where,
                include: {
                    furnitureType: true,
                    fabricType: true,
                    images: true,
                },
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: "desc" },
            }),
            prisma.stock.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            data: stockItems.map((item) => ({
                id: item.id,
                productName: item.productName,
                furnitureType: item.furnitureType,
                fabricType: item.fabricType,
                quantity: item.quantity,
                createPrice: item.createPrice.toNumber(),
                sellingPrice: item.sellingPrice.toNumber(),
                minQuantity: item.minQuantity,
                images: item.images,
                isLowStock: item.quantity <= item.minQuantity,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
            })),
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
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
        console.error("Error fetching stock:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================
// CREATE STOCK ITEM
// ============================================

export async function POST(request: NextRequest) {
    try {
        const currentUser = await requirePermission("inventory.create");
        const body = await request.json();
        const validation = createStockSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const {
            productName,
            furnitureTypeId,
            fabricTypeId,
            quantity,
            createPrice,
            sellingPrice,
            minQuantity,
            images,
        } = validation.data;

        // Verify types exist
        const [furnitureType, fabricType] = await Promise.all([
            prisma.furnitureType.findUnique({ where: { id: furnitureTypeId } }),
            prisma.fabricType.findUnique({ where: { id: fabricTypeId } }),
        ]);

        if (!furnitureType) {
            return NextResponse.json(
                { success: false, error: "Furniture type not found" },
                { status: 404 }
            );
        }

        if (!fabricType) {
            return NextResponse.json(
                { success: false, error: "Fabric type not found" },
                { status: 404 }
            );
        }

        const stockItem = await prisma.stock.create({
            data: {
                productName,
                furnitureTypeId,
                fabricTypeId,
                quantity,
                createPrice,
                sellingPrice,
                minQuantity: minQuantity || 5,
                images: {
                    create: images?.map(base64 => ({ base64 })) || []
                }
            },
            include: {
                furnitureType: true,
                fabricType: true,
                images: true,
            },
        });

        await logActivity(
            "CREATE",
            "Stock",
            stockItem.id,
            { productName, quantity },
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
        console.error("Error creating stock item:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
