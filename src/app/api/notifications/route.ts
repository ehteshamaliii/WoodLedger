import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const notifications = await prisma.notification.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        return NextResponse.json({ success: true, data: notifications });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch notifications" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { userId, type, title, content, link } = body;

        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                content,
                link,
                status: "UNREAD",
            },
        });

        // Validating global IO existence
        const io = (global as any).io;
        if (io) {
            io.to(userId).emit("new_notification", notification);
        }

        // Send Push Notification
        const { sendPushNotification } = await import("@/lib/push-notifications");
        await sendPushNotification(userId, {
            title: notification.title,
            body: notification.content,
            url: notification.link || "/dashboard",
        });

        return NextResponse.json({ success: true, data: notification });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to create notification" },
            { status: 500 }
        );
    }
}
