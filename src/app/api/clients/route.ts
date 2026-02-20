import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, logActivity } from "@/lib/auth";
import { z } from "zod";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// Force dynamic for API routes using cookies
// This line was already present and is kept. The instruction's "Code Edit" implied a reordering/removal of logActivity, which is not directly related to "Add force-dynamic" and thus not performed.

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createClientSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().min(10, "Phone number must be valid"),
    email: z.string().email().optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
});

// ============================================
// GET ALL CLIENTS
// ============================================

export async function GET(request: NextRequest) {
    try {
        await requirePermission("clients.view");

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "10");
        const search = searchParams.get("search") || "";

        const where = search
            ? {
                OR: [
                    { name: { contains: search } },
                    { phone: { contains: search } },
                    { email: { contains: search } },
                ],
            }
            : {};

        const [clients, total] = await Promise.all([
            prisma.client.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: "desc" },
                include: {
                    _count: {
                        select: { orders: true }
                    }
                }
            }),
            prisma.client.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            data: clients,
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
        console.error("Error fetching clients:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================
// CREATE CLIENT
// ============================================

export async function POST(request: NextRequest) {
    try {
        const currentUser = await requirePermission("clients.create");
        const body = await request.json();
        const validation = createClientSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { name, phone, email, address, notes } = validation.data;

        const client = await prisma.client.create({
            data: { name, phone, email, address, notes },
        });

        await logActivity("CREATE", "Client", client.id, { name, phone }, currentUser.id);

        return NextResponse.json({
            success: true,
            data: client,
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
        console.error("Error creating client:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
