import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        // Perform a simple query to check database connectivity
        await prisma.$queryRaw`SELECT 1`;

        return NextResponse.json({
            status: "ok",
            database: "connected",
            timestamp: new Date().toISOString()
        }, { status: 200 });
    } catch (error) {
        console.error("Health check failed:", error);
        return NextResponse.json({
            status: "error",
            database: "disconnected",
            message: "Database connection failed",
            timestamp: new Date().toISOString()
        }, { status: 503 });
    }
}
