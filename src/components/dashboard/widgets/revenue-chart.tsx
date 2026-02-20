"use client";

import { useState, useEffect } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartData {
    month: string;
    revenue: number;
    expense: number;
}

export function RevenueChart({ data }: { data: ChartData[] }) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <Card className="glass-card w-full h-[400px] border-none shadow-sm rounded-sm" />
        );
    }

    return (
        <Card className="glass-card w-full h-full !p-6 border-none shadow-sm rounded-sm overflow-hidden flex flex-col group relative">
            <div className="absolute top-0 right-0 w-[200px] h-[200px] blur-3xl opacity-15 bg-primary/30 transition-all duration-500 group-hover:opacity-20" />
            <div className="mb-6 flex items-center justify-between relative z-10">
                <div>
                    <h3 className="text-xl font-bold tracking-tight font-heading text-foreground">Financial Overview</h3>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Revenue & Expenses</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Revenue</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-600" />
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Expense</span>
                    </div>
                </div>
            </div>
            <div className="h-[320px] w-full relative z-10 min-h-[1px] min-w-[1px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} initialDimension={{ width: 10, height: 10 }}>
                    <BarChart
                        data={data}
                        margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--primary)" stopOpacity={1} />
                                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.6} />
                            </linearGradient>
                            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#94a3b8" stopOpacity={1} />
                                <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.6} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(from var(--muted-foreground) l c h / 0.1)" />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor', opacity: 0.5 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor', opacity: 0.5 }}
                            tickFormatter={(value) => `Rs.${value >= 1000 ? (value / 1000) + 'k' : value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'oklch(from var(--background) l c h / 0.8)',
                                backdropFilter: 'blur(12px)',
                                borderRadius: '16px',
                                border: '1px solid oklch(from var(--border) l c h / 0.5)',
                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                padding: '12px'
                            }}
                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                            labelStyle={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            cursor={{ fill: 'var(--muted)', opacity: 0.1, radius: 8 }}
                        />
                        <Bar
                            dataKey="revenue"
                            fill="url(#revenueGradient)"
                            radius={[6, 6, 0, 0]}
                            barSize={32}
                            animationDuration={1500}
                        />
                        <Bar
                            dataKey="expense"
                            fill="url(#expenseGradient)"
                            radius={[6, 6, 0, 0]}
                            barSize={32}
                            animationDuration={1500}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
