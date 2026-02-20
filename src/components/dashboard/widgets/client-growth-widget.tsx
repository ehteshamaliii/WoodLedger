import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Users } from "lucide-react";

interface ClientGrowthWidgetProps {
    data?: { month: string; clients: number }[];
}

export function ClientGrowthWidget({ data = [] }: ClientGrowthWidgetProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const chartData = data;

    if (!isMounted) {
        return (
            <Card className="glass-card w-full h-[300px] border-none shadow-sm rounded-sm" />
        );
    }

    if (chartData.length === 0 || chartData.every(m => m.clients === 0)) {
        return (
            <Card className="glass-card w-full h-full border-none shadow-sm rounded-sm flex flex-col items-center justify-center p-6 text-center group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[150px] h-[150px] blur-3xl opacity-20 bg-indigo-500/10 pointer-events-none" />
                <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">No Client Data</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Register clients to track growth</p>
            </Card>
        );
    }

    if (!isMounted) {
        return (
            <Card className="glass-card w-full h-[300px] border-none shadow-sm rounded-sm" />
        );
    }

    return (
        <Card className="glass-card w-full h-full !p-0 border-none shadow-sm rounded-sm overflow-hidden flex flex-col group relative">
            <div className="absolute top-0 right-0 w-[150px] h-[150px] blur-3xl opacity-20 bg-indigo-500/30 transition-all duration-500 group-hover:opacity-30 pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-5 pt-5 border-none bg-transparent">
                <CardTitle className="text-[12px] font-bold uppercase tracking-widest opacity-80 font-heading flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-500" />
                    Client Acquisition
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-1 z-10">
                <div className="h-[200px] w-full min-h-[1px] min-w-[1px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} initialDimension={{ width: 10, height: 10 }}>
                        <AreaChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 10, opacity: 0.7 }}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 10, opacity: 0.7 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(0,0,0,0.8)',
                                    borderColor: 'rgba(255,255,255,0.1)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '8px',
                                    color: 'white'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="clients"
                                stroke="#6366f1"
                                fillOpacity={1}
                                fill="url(#colorClients)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
