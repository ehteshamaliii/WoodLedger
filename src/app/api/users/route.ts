import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
import { requireRole, hashPassword, logActivity } from "@/lib/auth";
import { z } from "zod";

// Force dynamic for API routes using cookies


// ============================================
// VALIDATION SCHEMAS
// ============================================

const createUserSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    roleId: z.string().min(1, "Role is required"),
    isActive: z.boolean().optional().default(true),
});

const updateUserSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    roleId: z.string().optional(),
    isActive: z.boolean().optional(),
});

// ============================================
// GET ALL USERS
// ============================================

export async function GET(request: NextRequest) {
    try {
        await requireRole(["Admin"]);

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "10");
        const search = searchParams.get("search") || "";
        const roleId = searchParams.get("roleId") || undefined;

        const where = {
            AND: [
                search
                    ? {
                        OR: [
                            { name: { contains: search } },
                            { email: { contains: search } },
                        ],
                    }
                    : {},
                roleId ? { roleId } : {},
            ],
        };

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                include: { role: true },
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: "desc" },
            }),
            prisma.user.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            data: users.map((user) => ({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role.name,
                roleId: user.roleId,
                isActive: user.isActive,
                createdAt: user.createdAt,
            })),
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "Unauthorized") {
                return NextResponse.json(
                    { success: false, error: "Unauthorized" },
                    { status: 401 }
                );
            }
            if (error.message === "Forbidden") {
                return NextResponse.json(
                    { success: false, error: "Forbidden" },
                    { status: 403 }
                );
            }
        }
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// ============================================
// CREATE USER
// ============================================

export async function POST(request: NextRequest) {
    try {
        const currentUser = await requireRole(["Admin"]);
        const body = await request.json();
        const validation = createUserSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { name, email, password, roleId, isActive } = validation.data;

        // Check if email exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { success: false, error: "Email already registered" },
                { status: 400 }
            );
        }

        // Verify role exists
        const role = await prisma.role.findUnique({
            where: { id: roleId },
        });

        if (!role) {
            return NextResponse.json(
                { success: false, error: "Invalid role" },
                { status: 400 }
            );
        }

        const passwordHash = await hashPassword(password);
        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                roleId,
                isActive,
            },
            include: { role: true },
        });

        await logActivity("CREATE", "User", user.id, { name, email, role: role.name }, currentUser.id);

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
            },
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === "Unauthorized") {
                return NextResponse.json(
                    { success: false, error: "Unauthorized" },
                    { status: 401 }
                );
            }
            if (error.message === "Forbidden") {
                return NextResponse.json(
                    { success: false, error: "Forbidden" },
                    { status: 403 }
                );
            }
        }
        console.error("Error creating user:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
