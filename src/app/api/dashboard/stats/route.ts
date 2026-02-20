import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { startOfMonth, endOfMonth, subMonths, formatDistanceToNow } from "date-fns";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));

        // 1. Basic Stats (Counts)
        const [
            totalOrders,
            pendingOrders,
            completedOrders,
            totalRevenueData,
            lastMonthRevenueData,
            lowStockItems,
            totalClients,
            paymentsReceivedData
        ] = await Promise.all([
            prisma.order.count(),
            prisma.order.count({ where: { status: "PENDING" } }),
            prisma.order.count({ where: { status: "DELIVERED" } }),
            prisma.order.aggregate({
                _sum: { totalPrice: true },
                where: { createdAt: { gte: monthStart, lte: monthEnd } }
            }),
            prisma.order.aggregate({
                _sum: { totalPrice: true },
                where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } }
            }),
            prisma.stock.count({
                where: { quantity: { lte: prisma.stock.fields.minQuantity } }
            }),
            prisma.client.count(),
            prisma.payment.aggregate({
                _sum: { amount: true },
                where: { type: "CREDIT", createdAt: { gte: monthStart, lte: monthEnd } }
            })
        ]);

        const currentRevenue = Number(totalRevenueData._sum.totalPrice || 0);
        const lastMonthRevenue = Number(lastMonthRevenueData._sum.totalPrice || 0);
        const revenueTrend = lastMonthRevenue > 0
            ? ((currentRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
            : 0;

        // 2. Recent Activity (Combined feed)
        const recentOrders = await prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: { client: { select: { name: true } } }
        });

        const recentPayments = await prisma.payment.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: { account: { select: { name: true } } }
        });

        const recentStockChanges = await prisma.stock.findMany({
            take: 5,
            orderBy: { updatedAt: "desc" },
            where: { quantity: { lte: 10 } } // Focus on items getting low or critical
        });

        // 3. Chart Data (Last 6 Months)
        const chartData = [];
        const clientGrowth = [];

        for (let i = 5; i >= 0; i--) {
            const date = subMonths(now, i);
            const start = startOfMonth(date);
            const end = endOfMonth(date);

            const [rev, pay, newClients] = await Promise.all([
                prisma.order.aggregate({
                    _sum: { totalPrice: true },
                    where: { createdAt: { gte: start, lte: end } }
                }),
                prisma.payment.aggregate({
                    _sum: { amount: true },
                    where: { type: "DEBIT", createdAt: { gte: start, lte: end } }
                }),
                prisma.client.count({
                    where: { createdAt: { gte: start, lte: end } }
                })
            ]);

            const monthName = date.toLocaleString('default', { month: 'short' });

            chartData.push({
                month: monthName,
                revenue: Number(rev._sum.totalPrice || 0),
                expense: Number(pay._sum.amount || 0)
            });

            clientGrowth.push({
                month: monthName,
                clients: newClients
            });
        }

        // 4. Widget Data: Revenue By Category
        const allOrderItems = await prisma.orderItem.findMany({
            include: { furnitureType: true }
        });

        const categoryMap = new Map<string, number>();
        allOrderItems.forEach(item => {
            const catName = item.furnitureType.name;
            const revenue = Number(item.price) * item.quantity;
            categoryMap.set(catName, (categoryMap.get(catName) || 0) + revenue);
        });
        const revenueByCategory = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));

        // 5. Widget Data: Order Status Distribution
        const allOrders = await prisma.order.findMany({ select: { status: true } });
        const statusMap = new Map<string, number>();
        allOrders.forEach(order => {
            // Capitalize first letter, lowercase rest, replace underscore with space
            const statusName = order.status.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
            statusMap.set(statusName, (statusMap.get(statusName) || 0) + 1);
        });
        const orderStatusDistribution = Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }));

        // 6. Widget Data: Top Products (by Revenue)
        const topProductsMap = new Map<string, { name: string, sold: number, revenue: number }>();
        allOrderItems.forEach(item => {
            const productName = item.furnitureType.name;
            const existing = topProductsMap.get(productName) || { name: productName, sold: 0, revenue: 0 };
            existing.sold += item.quantity;
            existing.revenue += Number(item.price) * item.quantity;
            topProductsMap.set(productName, existing);
        });
        const topProducts = Array.from(topProductsMap.entries())
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        // 7. Widget Data: Stock Value
        const allStock = await prisma.stock.findMany();
        let totalStockValue = 0;
        let totalStockItems = 0;
        allStock.forEach(item => {
            totalStockValue += Number(item.sellingPrice) * item.quantity;
            totalStockItems += item.quantity;
        });

        // 8. Widget Data: Pending Invoices
        const pendingInvoicesData = await prisma.order.findMany({
            where: { status: { notIn: ["DELIVERED", "CANCELLED"] }, totalPrice: { gt: 0 } },
            orderBy: { createdAt: "asc" },
            take: 5,
            include: { client: true }
        });
        const pendingInvoices = pendingInvoicesData.map(inv => ({
            id: inv.id,
            orderNumber: inv.orderNumber,
            client: inv.client.name,
            amount: Number(inv.totalPrice) - Number(inv.advancePayment),
            date: inv.createdAt
        }));

        // 9. Widget Data: Production Efficiency (Avg Delivery Time)
        const deliveredOrders = await prisma.order.findMany({
            where: { status: "DELIVERED", deliveryDate: { not: null } }
        });

        let totalTurnaroundDays = 0;
        deliveredOrders.forEach(order => {
            const diffTime = Math.abs(new Date(order.deliveryDate!).getTime() - new Date(order.createdAt).getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            totalTurnaroundDays += diffDays;
        });
        const avgTurnaroundDays = deliveredOrders.length > 0 ? (totalTurnaroundDays / deliveredOrders.length).toFixed(1) : "0";

        // Delivered this week calculation
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        const deliveredThisWeek = deliveredOrders.filter(o => new Date(o.deliveryDate!) >= weekStart).length;

        const productionEfficiency = {
            avgTurnaroundDays: Number(avgTurnaroundDays),
            onTimeRate: 98, // Simulated for now
            weeklyOutput: deliveredThisWeek,
            weeklyGoal: 50 // Static goal
        };

        // 10. Widget Data: Fabric Usage
        const fabricStock = await prisma.stock.findMany({
            where: { quantity: { gt: 0 } },
            include: { fabricType: true }
        });

        const fabricUsageMap = new Map<string, { left: number, total: number }>();
        fabricStock.forEach(stock => {
            const name = stock.fabricType.name;
            const existing = fabricUsageMap.get(name) || { left: 0, total: 0 };
            existing.left += stock.quantity;
            // Assuming initial total was minQuantity + something, we'll use minQuantity*5 as a basic fake total for percentage if not known
            existing.total += Math.max(stock.quantity, stock.minQuantity * 3);
            fabricUsageMap.set(name, existing);
        });

        const fabricUsage = Array.from(fabricUsageMap.entries()).map(([name, data]) => ({
            name,
            left: data.left,
            usage: Math.round(((data.total - data.left) / data.total) * 100) || 0
        })).sort((a, b) => b.usage - a.usage).slice(0, 4);

        // Existing Feeds
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);

        const deliveryReminders = await prisma.order.findMany({
            where: {
                deliveryDate: { gte: now, lte: nextWeek },
                status: { notIn: ["DELIVERED", "CANCELLED"] }
            },
            include: { client: { select: { name: true } } },
            orderBy: { deliveryDate: "asc" }
        });

        const productionOrders = await prisma.order.findMany({
            where: {
                status: { in: ["IN_PRODUCTION", "READY"] }
            },
            include: { client: { select: { name: true } } },
            take: 5,
            orderBy: { updatedAt: "desc" }
        });

        const combinedActivities = [
            ...recentOrders.map(o => ({
                id: o.id,
                type: "ORDER" as const,
                title: `Order #${o.orderNumber}`,
                description: `${o.client.name} - Rs. ${Number(o.totalPrice).toLocaleString()}`,
                time: o.createdAt,
                link: `/orders/${o.id}`
            })),
            ...recentPayments.map(p => ({
                id: p.id,
                type: "PAYMENT" as const,
                title: `Payment ${p.type}`,
                description: `${p.account.name} - Rs. ${Number(p.amount).toLocaleString()}`,
                time: p.createdAt,
                link: `/payments`
            })),
            ...recentStockChanges.filter(s => s.quantity <= s.minQuantity).map(s => ({
                id: s.id,
                type: "STOCK" as const,
                title: `Low Stock: ${s.productName}`,
                description: `Only ${s.quantity} remaining (Min: ${s.minQuantity})`,
                time: s.updatedAt,
                link: `/inventory`
            }))
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        return NextResponse.json({
            success: true,
            data: {
                stats: {
                    totalOrders,
                    pendingOrders,
                    completedOrders,
                    totalRevenue: currentRevenue,
                    revenueTrend: revenueTrend.toFixed(1),
                    paymentsReceived: Number(paymentsReceivedData._sum.amount || 0),
                    lowStockItems,
                    totalClients,
                    monthlyTarget: 5000000 // Placeholder for target
                },
                recentActivity: {
                    orders: recentOrders,
                    payments: recentPayments,
                    stock: recentStockChanges
                },
                // New Widget Data Mapping
                revenueByCategory,
                topProducts,
                clientGrowth,
                orderStatusDistribution,
                stockValue: {
                    totalValue: totalStockValue,
                    itemCount: totalStockItems
                },
                pendingInvoices,
                productionEfficiency,
                fabricUsage,
                maintenanceAlerts: [], // Empty state as requested
                // Existing Feed Data
                deliveryReminders,
                chartData,
                productionOrders: productionOrders.map(o => ({
                    id: o.id,
                    orderNumber: o.orderNumber,
                    clientName: o.client.name,
                    status: o.status,
                    progress: o.status === "READY" ? 100 : 65
                })),
                activities: combinedActivities.map(a => ({
                    ...a,
                    time: formatDistanceToNow(new Date(a.time), { addSuffix: true })
                }))
            }
        });

    } catch (error) {
        console.error("Dashboard stats error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
