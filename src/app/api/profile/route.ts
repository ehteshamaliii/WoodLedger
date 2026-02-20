import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, verifyPassword, hashPassword } from "@/lib/auth";
import { z } from "zod";

const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters string"),
    email: z.string().email("Invalid email address"),
    currentPassword: z.string().min(1, "Current password is required if setting a new password").optional().or(z.literal("")),
    newPassword: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
    pushNotifications: z.boolean().optional(),
    emailNotifications: z.boolean().optional(),
});

export async function PUT(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();

        // Validate payload
        const validation = profileSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { name, email, currentPassword, newPassword, pushNotifications, emailNotifications } = validation.data;

        // Fetch current user with password explicitly (since we might need to verify it)
        const currentUser = await prisma.user.findUnique({
            where: { id: user.id },
        });

        if (!currentUser) {
            return NextResponse.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        // Check if email is being changed and if it's already taken
        if (email !== currentUser.email) {
            const existingUser = await prisma.user.findUnique({
                where: { email },
            });
            if (existingUser) {
                return NextResponse.json(
                    { success: false, error: "Email is already tightly bound to another account" },
                    { status: 400 }
                );
            }
        }

        const updateData: any = {
            name,
            email,
        };

        if (pushNotifications !== undefined) updateData.pushNotifications = pushNotifications;
        if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;

        // Handle password change if requested
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json(
                    { success: false, error: "Current password is required to set a new password" },
                    { status: 400 }
                );
            }

            const passwordMatch = await verifyPassword(currentPassword, currentUser.passwordHash);
            if (!passwordMatch) {
                return NextResponse.json(
                    { success: false, error: "Incorrect current password" },
                    { status: 400 }
                );
            }

            const hashedPassword = await hashPassword(newPassword);
            updateData.passwordHash = hashedPassword;
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                roleId: true,
                isActive: true,
                pushNotifications: true,
                emailNotifications: true,
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                ...updatedUser,
                role: updatedUser.role.name
            },
            message: "Profile updated successfully"
        });

    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update profile" },
            { status: 500 }
        );
    }
}
