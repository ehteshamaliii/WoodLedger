import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface SalesTargetWidgetProps {
    current: number;
    target: number;
}

export function SalesTargetWidget({ current = 0, target = 100000 }: SalesTargetWidgetProps) {
    const percentage = Math.min(Math.round((current / target) * 100), 100);
    const remaining = Math.max(target - current, 0);

    return (
        <Card className="glass-card h-full border-none shadow-sm rounded-sm overflow-hidden flex flex-col group relative">
            <div className="absolute top-0 right-0 w-[200px] h-[200px] blur-3xl opacity-20 bg-emerald-500/30 transition-all duration-500 group-hover:opacity-30 pointer-events-none" />

            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-5 border-none bg-transparent">
                <CardTitle className="text-[12px] font-bold uppercase tracking-widest opacity-80 font-heading flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-500" />
                    Monthly Target
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col justify-center flex-1 gap-6">
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Revenue Goal</p>
                        <h4 className="text-2xl font-bold font-heading">
                            {percentage}% <span className="text-sm font-normal text-muted-foreground normal-case tracking-normal">achieved</span>
                        </h4>
                    </div>
                    <div className={cn(
                        "p-2 rounded-full flex items-center justify-center",
                        percentage >= 100 ? "bg-emerald-500/20 text-emerald-500" : "bg-primary/10 text-primary"
                    )}>
                        <TrendingUp className="h-6 w-6" />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-70">
                        <span>Rs. {current.toLocaleString()}</span>
                        <span>Rs. {target.toLocaleString()}</span>
                    </div>
                    <Progress value={percentage} className="h-4 bg-secondary/20" indicatorClassName="bg-gradient-to-r from-emerald-500 to-teal-400" />
                </div>

                <div className="text-xs text-center font-medium bg-white/5 p-2 rounded-sm border border-white/5">
                    {percentage >= 100
                        ? "🎉 Goal reached! Great job team!"
                        : `Rs. ${remaining.toLocaleString()} more to hit the target!`}
                </div>
            </CardContent>
        </Card>
    );
}
