import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector } from "recharts";
import { ClipboardList } from "lucide-react";
import { useState, useEffect } from "react";

interface OrderStatusDistributionWidgetProps {
    data?: { name: string; value: number }[];
}

export function OrderStatusDistributionWidget({ data = [] }: OrderStatusDistributionWidgetProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const chartData = data;
    const [activeIndex, setActiveIndex] = useState(-1);
    const totalOrders = chartData.reduce((acc, curr) => acc + curr.value, 0);

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    const onPieLeave = () => {
        setActiveIndex(-1);
    };

    if (!isMounted) {
        return (
            <Card className="glass-card w-full h-[300px] border-none shadow-sm rounded-sm" />
        );
    }

    if (chartData.length === 0) {
        return (
            <Card className="glass-card w-full h-full border-none shadow-sm rounded-sm flex flex-col items-center justify-center p-6 text-center group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[150px] h-[150px] blur-3xl opacity-20 bg-orange-500/10 pointer-events-none" />
                <ClipboardList className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">No Active Orders</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Create orders to see status distribution</p>
            </Card>
        );
    }

    const STATUS_COLORS: Record<string, string> = {
        'Pending': 'hsl(38, 92%, 60%)',        // Brighter Amber
        'In Production': 'hsl(217, 91%, 70%)',  // Brighter Blue
        'Ready': 'hsl(142, 71%, 55%)',          // Brighter Emerald
        'Delivered': 'hsl(215, 25%, 65%)',      // Brighter Slate
    };

    const renderActiveShape = (props: any) => {
        const RADIAN = Math.PI / 180;
        const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
        const sin = Math.sin(-RADIAN * midAngle);
        const cos = Math.cos(-RADIAN * midAngle);
        const sx = cx + (outerRadius + 10) * cos;
        const sy = cy + (outerRadius + 10) * sin;
        const mx = cx + (outerRadius + 30) * cos;
        const my = cy + (outerRadius + 30) * sin;
        const ex = mx + (cos >= 0 ? 1 : -1) * 22;
        const ey = my;
        const textAnchor = cos >= 0 ? 'start' : 'end';

        return (
            <g>
                <text x={cx} y={cy} dy={8} textAnchor="middle" fill="currentColor" className="fill-foreground font-bold text-lg font-heading">
                    {payload.name}
                </text>
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius + 6}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                    cornerRadius={8}
                />
                <Sector
                    cx={cx}
                    cy={cy}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    innerRadius={outerRadius + 10}
                    outerRadius={outerRadius + 12}
                    fill={fill}
                    opacity={0.3}
                    cornerRadius={8}
                />
            </g>
        );
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-black/80 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-2xl animate-in fade-in zoom-in duration-200">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].fill }} />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">{data.name}</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-xl font-bold font-mono text-white">{data.value}</p>
                        <p className="text-xs font-medium text-white/50">Orders</p>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Hooks are declared above

    if (!isMounted) {
        return (
            <Card className="glass-card w-full h-[300px] border-none shadow-sm rounded-sm" />
        );
    }

    return (
        <Card className="glass-card w-full h-full !p-0 border-none shadow-sm rounded-sm overflow-hidden flex flex-col group relative">
            <div className="absolute top-0 right-0 w-[150px] h-[150px] blur-3xl opacity-20 bg-orange-500/30 transition-all duration-500 group-hover:opacity-30 pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-5 pt-5 border-none bg-transparent">
                <CardTitle className="text-[12px] font-bold uppercase tracking-widest opacity-80 font-heading flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-orange-500" />
                    Order Status Distribution
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-1 z-10 flex flex-col">
                <div className="h-[200px] w-full relative min-h-[1px] min-w-[1px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1} initialDimension={{ width: 10, height: 10 }}>
                        <PieChart>
                            <Pie
                                activeShape={renderActiveShape}
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                onMouseEnter={onPieEnter}
                                onMouseLeave={onPieLeave}
                                stroke="none"
                                cornerRadius={6}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={STATUS_COLORS[entry.name] || 'hsl(var(--primary))'}
                                        style={{ filter: activeIndex === index ? `drop-shadow(0 0 8px ${STATUS_COLORS[entry.name]})` : 'none' }}
                                        className="transition-all duration-300"
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                iconType="circle"
                                verticalAlign="bottom"
                                formatter={(value) => (
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 ml-1">
                                        {value}
                                    </span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    {activeIndex === -1 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-500">
                            <span className="text-2xl font-bold font-heading">{totalOrders}</span>
                            <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">Total Orders</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
