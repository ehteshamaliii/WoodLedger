import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, logActivity } from "@/lib/auth";
import { z } from "zod";

// Force dynamic for API routes using cookies
export const dynamic = 'force-dynamic';

const updateRoleSchema = z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    permissionIds: z.array(z.string()).optional(),
});

// ============================================
// GET SINGLE ROLE
// ============================================

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireRole(["Admin"]);
        const { id } = await params;

        const role = await prisma.role.findUnique({
            where: { id },
            include: {
                rolePermissions: { include: { permission: true } },
                _count: { select: { users: true } },
            },
        });

        if (!role) {
            return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                id: role.id,
                name: role.name,
                description: role.description,
                permissions: role.rolePermissions.map((rp) => ({
                    id: rp.permission.id,
                    name: rp.permission.name,
                    module: rp.permission.module,
                    description: rp.permission.description,
                })),
                userCount: role._count.users,
                createdAt: role.createdAt,
                updatedAt: role.updatedAt,
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
        console.error("Error fetching role:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================
// UPDATE ROLE
// ============================================

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await requireRole(["Admin"]);
        const { id } = await params;
        const body = await request.json();
        const validation = updateRoleSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const existingRole = await prisma.role.findUnique({ where: { id } });
        if (!existingRole) {
            return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
        }

        const { name, description, permissionIds } = validation.data;

        // Check name uniqueness if changing
        if (name && name !== existingRole.name) {
            const nameExists = await prisma.role.findUnique({ where: { name } });
            if (nameExists) {
                return NextResponse.json(
                    { success: false, error: "Role name already exists" },
                    { status: 400 }
                );
            }
        }

        // Update role and permissions
        const role = await prisma.$transaction(async (tx) => {
            // Update role basic info
            const updatedRole = await tx.role.update({
                where: { id },
                data: {
                    ...(name && { name }),
                    ...(description !== undefined && { description }),
                },
            });

            // Update permissions if provided
            if (permissionIds !== undefined) {
                // Delete existing permissions
                await tx.rolePermission.deleteMany({ where: { roleId: id } });

                // Create new permissions
                if (permissionIds.length > 0) {
                    await tx.rolePermission.createMany({
                        data: permissionIds.map((permissionId) => ({
                            roleId: id,
                            permissionId,
                        })),
                    });
                }
            }

            return tx.role.findUnique({
                where: { id },
                include: { rolePermissions: { include: { permission: true } } },
            });
        });

        await logActivity("UPDATE", "Role", id, { name, permissionIds }, currentUser.id);

        return NextResponse.json({
            success: true,
            data: {
                id: role!.id,
                name: role!.name,
                description: role!.description,
                permissions: role!.rolePermissions.map((rp) => ({
                    id: rp.permission.id,
                    name: rp.permission.name,
                    module: rp.permission.module,
                })),
                createdAt: role!.createdAt,
                updatedAt: role!.updatedAt,
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
        console.error("Error updating role:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================
// DELETE ROLE
// ============================================

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const currentUser = await requireRole(["Admin"]);
        const { id } = await params;

        const role = await prisma.role.findUnique({
            where: { id },
            include: { _count: { select: { users: true } } },
        });

        if (!role) {
            return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
        }

        // Prevent deletion if role has users
        if (role._count.users > 0) {
            return NextResponse.json(
                { success: false, error: `Cannot delete role with ${role._count.users} assigned user(s)` },
                { status: 400 }
            );
        }

        // Prevent deletion of Admin role
        if (role.name === "Admin") {
            return NextResponse.json(
                { success: false, error: "Cannot delete the Admin role" },
                { status: 400 }
            );
        }

        await prisma.role.delete({ where: { id } });

        await logActivity("DELETE", "Role", id, { name: role.name }, currentUser.id);

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
        console.error("Error deleting role:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
