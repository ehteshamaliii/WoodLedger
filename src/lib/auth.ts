import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import crypto from "crypto";
import type { Prisma } from "@prisma/client";

const SALT_ROUNDS = 12;
const SESSION_EXPIRY_DAYS = parseInt(process.env.SESSION_EXPIRY_DAYS || "7");

// ============================================
// PASSWORD UTILITIES
// ============================================

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
    password: string,
    hash: string
): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// ============================================
// SESSION MANAGEMENT
// ============================================

export function generateSessionToken(): string {
    return crypto.randomBytes(32).toString("hex");
}

export async function createSession(
    userId: string,
    userAgent?: string,
    ipAddress?: string
) {
    const token = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

    const session = await prisma.session.create({
        data: {
            userId,
            token,
            userAgent,
            ipAddress,
            expiresAt,
        },
    });

    return session;
}

export async function validateSession(token: string) {
    const session = await prisma.session.findUnique({
        where: { token },
        include: {
            user: {
                include: {
                    role: {
                        include: {
                            rolePermissions: {
                                include: {
                                    permission: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!session) {
        return null;
    }

    // Check if session is expired
    if (new Date() > session.expiresAt) {
        await prisma.session.delete({ where: { id: session.id } });
        return null;
    }

    // Check if user is active
    if (!session.user.isActive) {
        return null;
    }

    return session;
}

export async function destroySession(token: string) {
    try {
        await prisma.session.delete({ where: { token } });
        return true;
    } catch {
        return false;
    }
}

export async function destroyAllUserSessions(userId: string) {
    await prisma.session.deleteMany({ where: { userId } });
}

// ============================================
// COOKIE MANAGEMENT
// ============================================

const COOKIE_NAME = "woodledger_session";

export async function setSessionCookie(token: string) {
    const cookieStore = await cookies();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: expiresAt,
        path: "/",
    });
}

export async function getSessionCookie(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get(COOKIE_NAME)?.value;
}

export async function clearSessionCookie() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

// ============================================
// AUTH HELPERS
// ============================================

export async function getCurrentUser() {
    const token = await getSessionCookie();
    if (!token) return null;

    const session = await validateSession(token);
    if (!session) return null;

    // Extract permissions for easy access
    const permissions = session.user.role.rolePermissions.map(
        (rp) => rp.permission.name
    );

    return {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role.name,
        roleId: session.user.roleId,
        permissions,
        isActive: session.user.isActive,
    };
}

export async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error("Unauthorized");
    }
    return user;
}

export async function requireRole(allowedRoles: string[]) {
    const user = await requireAuth();
    if (!allowedRoles.includes(user.role)) {
        throw new Error("Forbidden");
    }
    return user;
}

export async function requirePermission(permission: string) {
    const user = await requireAuth();
    if (!user.permissions.includes(permission)) {
        throw new Error("Forbidden");
    }
    return user;
}

// ============================================
// ACTIVITY LOGGING
// ============================================

export async function logActivity(
    action: string,
    entityType: string,
    entityId?: string,
    details?: Prisma.InputJsonValue,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
) {
    try {
        await prisma.activityLog.create({
            data: {
                userId,
                action,
                entityType,
                entityId,
                details: details ?? undefined,
                ipAddress,
                userAgent,
            },
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
}

