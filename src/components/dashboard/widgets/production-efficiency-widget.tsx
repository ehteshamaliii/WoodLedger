import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gauge, Clock, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProductionEfficiencyWidgetProps {
    avgTurnaroundDays?: number;
    onTimeRate?: number;
    weeklyOutput?: number;
    weeklyGoal?: number;
}

export function ProductionEfficiencyWidget({
    avgTurnaroundDays = 0,
    onTimeRate = 0,
    weeklyOutput = 0,
    weeklyGoal = 50
}: ProductionEfficiencyWidgetProps) {

    if (weeklyOutput === 0 && avgTurnaroundDays === 0) {
        return (
            <Card className="glass-card w-full h-full border-none shadow-sm rounded-sm flex flex-col items-center justify-center p-6 text-center group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[150px] h-[150px] blur-3xl opacity-20 bg-lime-500/10 pointer-events-none" />
                <Gauge className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">No Delivery Data</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Deliver orders to track efficiency</p>
            </Card>
        );
    }

    const progressValue = Math.min(100, Math.round((weeklyOutput / weeklyGoal) * 100)) || 0;

    return (
        <Card className="glass-card w-full h-full border-none shadow-sm rounded-sm overflow-hidden flex flex-col group relative">
            <div className="absolute top-0 right-0 w-[150px] h-[150px] blur-3xl opacity-20 bg-lime-500/30 transition-all duration-500 group-hover:opacity-30 pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-5 border-none bg-transparent">
                <CardTitle className="text-[12px] font-bold uppercase tracking-widest opacity-80 font-heading flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-lime-500" />
                    Production Efficiency
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col justify-center gap-6 z-10 flex-1">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-lime-500/10 p-4 rounded-sm border border-lime-500/20 text-center">
                        <Clock className="h-6 w-6 text-lime-600 dark:text-lime-400 mx-auto mb-2" />
                        <h4 className="text-2xl font-bold font-heading">{avgTurnaroundDays} <span className="text-xs font-normal text-muted-foreground">days</span></h4>
                        <p className="text-[10px] uppercase font-bold tracking-wider opacity-60">Avg Turnaround</p>
                    </div>
                    <div className="bg-emerald-500/10 p-4 rounded-sm border border-emerald-500/20 text-center">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                        <h4 className="text-2xl font-bold font-heading">{onTimeRate}%</h4>
                        <p className="text-[10px] uppercase font-bold tracking-wider opacity-60">On-Time Rate</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-70">
                        <span>Weekly Output Goal</span>
                        <span>{weeklyOutput} / {weeklyGoal} units</span>
                    </div>
                    <Progress value={progressValue} className="h-2" indicatorClassName="bg-lime-500" />
                </div>
            </CardContent>
        </Card>
    );
}
