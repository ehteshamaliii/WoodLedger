import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, logActivity } from "@/lib/auth";
import { z } from "zod";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const updateClientSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    phone: z.string().min(10, "Phone number must be valid").optional(),
    email: z.string().email().optional().nullable(),
    address: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
});

// = [ GET CLIENT ] =============================================
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requirePermission("clients.view");
        const { id } = await params;

        const client = await prisma.client.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { orders: true }
                }
            }
        });

        if (!client) {
            return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: client });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "Unauthorized") return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
            if (error.message === "Forbidden") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }
        console.error("Error fetching client:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// = [ UPDATE CLIENT ] ==========================================
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await requirePermission("clients.edit");
        const { id } = await params;
        const body = await request.json();
        const validation = updateClientSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const existingClient = await prisma.client.findUnique({
            where: { id },
        });

        if (!existingClient) {
            return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
        }

        const client = await prisma.client.update({
            where: { id },
            data: validation.data,
        });

        await logActivity("UPDATE", "Client", client.id, {
            old: { name: existingClient.name, phone: existingClient.phone },
            new: validation.data
        }, currentUser.id);

        return NextResponse.json({ success: true, data: client });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "Unauthorized") return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
            if (error.message === "Forbidden") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }
        console.error("Error updating client:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// = [ DELETE CLIENT ] ==========================================
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await requirePermission("clients.delete");
        const { id } = await params;

        const client = await prisma.client.findUnique({
            where: { id },
            include: { _count: { select: { orders: true } } }
        });

        if (!client) {
            return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
        }

        if (client._count.orders > 0) {
            return NextResponse.json({
                success: false,
                error: "Cannot delete client with existing orders. Please delete or reassign orders first."
            }, { status: 400 });
        }

        await prisma.client.delete({
            where: { id },
        });

        await logActivity("DELETE", "Client", id, { name: client.name }, currentUser.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "Unauthorized") return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
            if (error.message === "Forbidden") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }
        console.error("Error deleting client:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
