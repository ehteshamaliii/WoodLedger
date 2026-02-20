import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    hashPassword,
    verifyPassword,
    createSession,
    setSessionCookie,
    getSessionCookie,
    validateSession,
    destroySession,
    clearSessionCookie,
    getCurrentUser,
    logActivity,
} from "@/lib/auth";
import { z } from "zod";

// Force dynamic for API routes using cookies
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';


// ============================================
// VALIDATION SCHEMAS
// ============================================

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    roleId: z.string().optional(),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function getClientInfo(request: NextRequest) {
    const userAgent = request.headers.get("user-agent") || undefined;
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor?.split(",")[0] || request.headers.get("x-real-ip") || undefined;
    return { userAgent, ipAddress };
}

// ============================================
// ROUTE HANDLERS
// ============================================

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ route: string[] }> }
) {
    const { route } = await params;
    const action = route?.[0];

    try {
        switch (action) {
            case "login":
                return await handleLogin(request);
            case "register":
                return await handleRegister(request);
            case "logout":
                return await handleLogout();
            default:
                return NextResponse.json(
                    { success: false, error: "Not found" },
                    { status: 404 }
                );
        }
    } catch (error) {
        console.error(`Auth error (${action}):`, error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ route: string[] }> }
) {
    const { route } = await params;
    const action = route?.[0];

    try {
        switch (action) {
            case "me":
                return await handleGetCurrentUser();
            default:
                return NextResponse.json(
                    { success: false, error: "Not found" },
                    { status: 404 }
                );
        }
    } catch (error) {
        console.error(`Auth error (${action}):`, error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// ============================================
// LOGIN
// ============================================

async function handleLogin(request: NextRequest) {
    let body;
    try {
        body = await request.json();
    } catch (e) {
        return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
    }
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
        return NextResponse.json(
            { success: false, error: validation.error.issues[0].message },
            { status: 400 }
        );
    }

    const { email, password } = validation.data;
    const { userAgent, ipAddress } = getClientInfo(request);

    // Find user by email
    const user = await prisma.user.findUnique({
        where: { email },
        include: { role: true },
    });

    if (!user) {
        return NextResponse.json(
            { success: false, error: "Invalid email or password" },
            { status: 401 }
        );
    }

    // Check if user is active
    if (!user.isActive) {
        return NextResponse.json(
            { success: false, error: "Your account has been deactivated" },
            { status: 401 }
        );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
        return NextResponse.json(
            { success: false, error: "Invalid email or password" },
            { status: 401 }
        );
    }

    // Create session
    const session = await createSession(user.id, userAgent, ipAddress);
    await setSessionCookie(session.token);

    // Log activity
    await logActivity("LOGIN", "User", user.id, { email }, user.id, ipAddress, userAgent);

    return NextResponse.json({
        success: true,
        data: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role.name,
        },
    });
}

// ============================================
// REGISTER (Admin Only)
// ============================================

async function handleRegister(request: NextRequest) {
    let body;
    try {
        body = await request.json();
    } catch (e) {
        return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
    }
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
        return NextResponse.json(
            { success: false, error: validation.error.issues[0].message },
            { status: 400 }
        );
    }

    const { name, email, password, roleId } = validation.data;
    const { userAgent, ipAddress } = getClientInfo(request);

    // Check if this is the first user (will be admin)
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    // If not first user, require admin authentication
    if (!isFirstUser) {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== "Admin") {
            return NextResponse.json(
                { success: false, error: "Only admins can register new users" },
                { status: 403 }
            );
        }
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        return NextResponse.json(
            { success: false, error: "Email already registered" },
            { status: 400 }
        );
    }

    // Get or create admin role for first user
    let assignedRoleId = roleId;
    if (isFirstUser || !roleId) {
        const adminRole = await prisma.role.findFirst({
            where: { name: "Admin" },
        });
        if (adminRole) {
            assignedRoleId = adminRole.id;
        } else {
            // Create admin role if it doesn't exist
            const newAdminRole = await prisma.role.create({
                data: {
                    name: "Admin",
                    description: "Full system access",
                },
            });
            assignedRoleId = newAdminRole.id;
        }
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
        data: {
            name,
            email,
            passwordHash,
            roleId: assignedRoleId!,
        },
        include: { role: true },
    });

    // Log activity
    const currentUser = await getCurrentUser();
    await logActivity(
        "CREATE",
        "User",
        user.id,
        { name, email, role: user.role.name },
        currentUser?.id,
        ipAddress,
        userAgent
    );

    // If first user, also log them in
    if (isFirstUser) {
        const session = await createSession(user.id, userAgent, ipAddress);
        await setSessionCookie(session.token);
    }

    return NextResponse.json({
        success: true,
        data: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role.name,
        },
    });
}

// ============================================
// LOGOUT
// ============================================

async function handleLogout() {
    const token = await getSessionCookie();

    if (token) {
        const session = await validateSession(token);
        if (session) {
            await logActivity("LOGOUT", "User", session.user.id, {}, session.user.id);
        }
        await destroySession(token);
    }

    await clearSessionCookie();

    return NextResponse.json({ success: true });
}

// ============================================
// GET CURRENT USER
// ============================================

async function handleGetCurrentUser() {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json(
            { success: false, error: "Not authenticated" },
            { status: 401 }
        );
    }

    return NextResponse.json({
        success: true,
        data: user,
    });
}
