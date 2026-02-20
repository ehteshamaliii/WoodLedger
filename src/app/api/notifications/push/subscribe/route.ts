import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const subscription = await req.json();

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return NextResponse.json({ success: false, error: "Invalid subscription" }, { status: 400 });
        }

        // Save or update subscription


        // Actually, let's just find if it exists first.
        const existing = await prisma.pushSubscription.findFirst({
            where: {
                userId: user.id,
                endpoint: subscription.endpoint,
            }
        });

        if (existing) {
            await prisma.pushSubscription.update({
                where: { id: existing.id },
                data: {
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth,
                },
            });
        } else {
            await prisma.pushSubscription.create({
                data: {
                    userId: user.id,
                    endpoint: subscription.endpoint,
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth,
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving push subscription:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
