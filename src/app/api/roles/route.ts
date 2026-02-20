import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, logActivity } from "@/lib/auth";
import { z } from "zod";

// Force dynamic for API routes using cookies
export const dynamic = 'force-dynamic';

const createRoleSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
    permissionIds: z.array(z.string()).optional().default([]),
});

// ============================================
// GET ALL ROLES
// ============================================

export async function GET() {
    try {
        await requireRole(["Admin"]);

        const roles = await prisma.role.findMany({
            include: {
                rolePermissions: {
                    include: { permission: true },
                },
                _count: { select: { users: true } },
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json({
            success: true,
            data: roles.map((role) => ({
                id: role.id,
                name: role.name,
                description: role.description,
                permissions: role.rolePermissions.map((rp) => ({
                    id: rp.permission.id,
                    name: rp.permission.name,
                    module: rp.permission.module,
                })),
                userCount: role._count.users,
                createdAt: role.createdAt,
            })),
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
        console.error("Error fetching roles:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// ============================================
// CREATE ROLE
// ============================================

export async function POST(request: NextRequest) {
    try {
        const currentUser = await requireRole(["Admin"]);
        const body = await request.json();
        const validation = createRoleSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { name, description, permissionIds } = validation.data;

        // Check if role name exists
        const existingRole = await prisma.role.findUnique({ where: { name } });
        if (existingRole) {
            return NextResponse.json(
                { success: false, error: "Role name already exists" },
                { status: 400 }
            );
        }

        const role = await prisma.role.create({
            data: {
                name,
                description,
                rolePermissions: {
                    create: permissionIds.map((permissionId) => ({
                        permissionId,
                    })),
                },
            },
            include: {
                rolePermissions: { include: { permission: true } },
            },
        });

        await logActivity("CREATE", "Role", role.id, { name, permissionIds }, currentUser.id);

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
                })),
                createdAt: role.createdAt,
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
        console.error("Error creating role:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
