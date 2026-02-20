import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { status } = body;

        const result = await prisma.notification.updateMany({
            where: {
                id,
                userId: user.id
            },
            data: { status },
        });

        if (result.count === 0) {
            return NextResponse.json({ success: false, error: "Notification not found or unauthorized" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to update notification" },
            { status: 500 }
        );
    }
}
