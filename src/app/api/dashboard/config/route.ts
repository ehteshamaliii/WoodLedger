import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        let config = await prisma.dashboardConfig.findUnique({
            where: { userId: user.id },
            include: { widgets: { orderBy: { y: 'asc' } } }
        });

        // Initialize default config if none exists
        if (!config) {
            config = await prisma.dashboardConfig.create({
                data: {
                    userId: user.id,
                    widgets: {
                        create: [
                            { type: "REVENUE_STATS", x: 0, y: 0, w: 1, h: 1, isVisible: true },
                            { type: "ORDERS_STATS", x: 1, y: 0, w: 1, h: 1, isVisible: true },
                            { type: "STOCK_STATS", x: 2, y: 0, w: 1, h: 1, isVisible: true },
                            { type: "CLIENTS_STATS", x: 3, y: 0, w: 1, h: 1, isVisible: true },
                            { type: "REVENUE_CHART", x: 0, y: 1, w: 2, h: 2, isVisible: true },
                            { type: "PRODUCTION_QUEUE", x: 2, y: 1, w: 2, h: 2, isVisible: true },
                            { type: "RecentOrders", x: 0, y: 3, w: 2, h: 2, isVisible: true },
                            { type: "LowStock", x: 2, y: 3, w: 2, h: 2, isVisible: true },
                        ]
                    }
                },
                include: { widgets: true }
            });
        }

        return NextResponse.json({ success: true, data: config });
    } catch (error) {
        console.error("Dashboard config GET error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { widgets } = await req.json();

        // Transaction to sync widgets: delete all for this config, then recreate
        const result = await prisma.$transaction(async (tx) => {
            let config = await tx.dashboardConfig.findUnique({
                where: { userId: user.id }
            });

            if (!config) {
                config = await tx.dashboardConfig.create({
                    data: { userId: user.id }
                });
            }

            // 1. Delete all existing widgets for this config
            await tx.dashboardWidget.deleteMany({
                where: { configId: config.id }
            });

            // 2. Create new widgets from the request
            if (widgets && widgets.length > 0) {
                await tx.dashboardWidget.createMany({
                    data: widgets.map((w: any) => ({
                        configId: config.id,
                        type: w.type,
                        x: w.x,
                        y: w.y,
                        w: w.w,
                        h: w.h,
                        isVisible: w.isVisible,
                        settings: w.settings
                    }))
                });
            }

            return tx.dashboardConfig.findUnique({
                where: { userId: user.id },
                include: { widgets: true }
            });
        });

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error("Dashboard config POST error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
