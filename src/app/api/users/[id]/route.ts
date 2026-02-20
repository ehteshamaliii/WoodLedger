import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
import { requireRole, hashPassword, logActivity, destroyAllUserSessions } from "@/lib/auth";
import { z } from "zod";

// Force dynamic for API routes using cookies


const updateUserSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    roleId: z.string().optional(),
    isActive: z.boolean().optional(),
});

// ============================================
// GET SINGLE USER
// ============================================

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireRole(["Admin"]);
        const { id } = await params;

        const user = await prisma.user.findUnique({
            where: { id },
            include: { role: true },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role.name,
                roleId: user.roleId,
                isActive: user.isActive,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
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
        console.error("Error fetching user:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================
// UPDATE USER
// ============================================

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await requireRole(["Admin"]);
        const { id } = await params;
        const body = await request.json();
        const validation = updateUserSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findUnique({ where: { id } });
        if (!existingUser) {
            return NextResponse.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        const { name, email, password, roleId, isActive } = validation.data;

        // Check email uniqueness if changing
        if (email && email !== existingUser.email) {
            const emailExists = await prisma.user.findUnique({ where: { email } });
            if (emailExists) {
                return NextResponse.json(
                    { success: false, error: "Email already in use" },
                    { status: 400 }
                );
            }
        }

        // Verify role if changing
        if (roleId) {
            const role = await prisma.role.findUnique({ where: { id: roleId } });
            if (!role) {
                return NextResponse.json(
                    { success: false, error: "Invalid role" },
                    { status: 400 }
                );
            }
        }

        const updateData: Record<string, unknown> = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (password) updateData.passwordHash = await hashPassword(password);
        if (roleId) updateData.roleId = roleId;
        if (typeof isActive === "boolean") updateData.isActive = isActive;

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            include: { role: true },
        });

        // If user was deactivated, destroy their sessions
        if (isActive === false) {
            await destroyAllUserSessions(id);
        }

        await logActivity("UPDATE", "User", id, updateData as Record<string, string | number | boolean>, currentUser.id);

        return NextResponse.json({
            success: true,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role.name,
                roleId: user.roleId,
                isActive: user.isActive,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
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
        console.error("Error updating user:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================
// DELETE USER
// ============================================

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await requireRole(["Admin"]);
        const { id } = await params;

        // Prevent self-deletion
        if (id === currentUser.id) {
            return NextResponse.json(
                { success: false, error: "Cannot delete your own account" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return NextResponse.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        // Destroy all sessions first
        await destroyAllUserSessions(id);

        // Delete user (sessions will cascade delete)
        await prisma.user.delete({ where: { id } });

        await logActivity("DELETE", "User", id, { name: user.name, email: user.email }, currentUser.id);

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
        console.error("Error deleting user:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
