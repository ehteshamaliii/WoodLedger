import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function GET(req: NextRequest) {
    try {
        // Fetch key metrics for analysis
        const [recentOrders, stockItems] = await Promise.all([
            prisma.order.findMany({
                take: 10,
                orderBy: { createdAt: "desc" },
                include: { items: true }
            }),
            prisma.stock.findMany({
                take: 20,
                include: { furnitureType: true, fabricType: true }
            })
        ]);

        if (recentOrders.length === 0 && stockItems.length === 0) {
            return NextResponse.json({
                success: true,
                data: "Not enough data for analysis yet. Add more orders and stock to get AI insights."
            });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const dataSummary = {
            recentSalesCount: recentOrders.length,
            averageOrderValue: recentOrders.reduce((acc, o) => acc + Number(o.totalPrice), 0) / (recentOrders.length || 1),
            inventoryProfile: stockItems.map(s => ({
                name: s.productName,
                cost: s.createPrice,
                price: s.sellingPrice,
                margin: ((Number(s.sellingPrice) - Number(s.createPrice)) / Number(s.sellingPrice) * 100).toFixed(1) + "%"
            }))
        };

        const prompt = `
            You are a business intelligence assistant for "WoodLedger", a furniture business.
            Analyze the following business data and provide 3 concise, actionable pricing or profit margin suggestions in markdown format.
            Focus on maximizing profit while remaining competitive.
            
            Current Data:
            ${JSON.stringify(dataSummary, null, 2)}
            
            Response format:
            1. Suggestion 1
            2. Suggestion 2
            3. Suggestion 3
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        return NextResponse.json({
            success: true,
            data: responseText
        });

    } catch (error: any) {
        console.error("Pricing Suggester Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
