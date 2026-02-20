import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { renderToStream } from "@react-pdf/renderer";
import { InvoiceTemplate } from "@/components/reports/invoice-template";
import React from 'react';

const prisma = new PrismaClient();

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const orderId = id;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                client: true,
                items: {
                    include: {
                        furnitureType: true,
                        fabricTypes: true,
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
        }

        console.log("Rendering PDF for order:", order.id);
        console.log("Current working directory:", process.cwd());
        const fs = require('fs');
        const path = require('path');
        const fontsDir = path.join(process.cwd(), "public", "fonts");
        console.log("Fonts directory:", fontsDir);

        try {
            if (fs.existsSync(fontsDir)) {
                console.log("Fonts directory exists");
                const files = fs.readdirSync(fontsDir);
                console.log("Font files found:", files);
            } else {
                console.error("Fonts directory DOES NOT EXIST at:", fontsDir);
                // Try listing root directory to see structure
                console.log("Root directory contents:", fs.readdirSync(process.cwd()));
            }
        } catch (e) {
            console.error("Error checking fonts dir:", e);
        }

        // Pass React explicitly as it might be needed for the template in some environments
        const stream = await renderToStream(
            React.createElement(InvoiceTemplate, {
                order,
                client: order.client,
                items: order.items,
            }) as any
        );

        // Convert stream to Buffer for NextResponse
        const chunks: any[] = [];
        for await (const chunk of stream as any) {
            chunks.push(chunk);
        }
        const pdfBuffer = Buffer.concat(chunks);

        return new NextResponse(pdfBuffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename=invoice-${order.orderNumber}.pdf`,
            },
        });
    } catch (error: any) {
        console.error("PDF Generation Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
