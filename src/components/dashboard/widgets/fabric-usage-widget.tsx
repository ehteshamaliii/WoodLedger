import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, Layers } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface FabricData {
    name: string;
    usage: number;
    left: number;
}

interface FabricUsageWidgetProps {
    fabrics?: FabricData[];
}

export function FabricUsageWidget({ fabrics = [] }: FabricUsageWidgetProps) {

    if (fabrics.length === 0) {
        return (
            <Card className="glass-card w-full h-full border-none shadow-sm rounded-sm flex flex-col items-center justify-center p-6 text-center group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[150px] h-[150px] blur-3xl opacity-20 bg-pink-500/10 pointer-events-none" />
                <Scissors className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">No Fabric Data</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Stock fabric inventory to view usage</p>
            </Card>
        );
    }

    const totalUsage = fabrics.reduce((acc, curr) => acc + (curr.left * (curr.usage / 100)), 0); // rough estimate for display purposes

    return (
        <Card className="glass-card w-full h-full border-none shadow-sm rounded-sm overflow-hidden flex flex-col group relative">
            <div className="absolute top-0 right-0 w-[150px] h-[150px] blur-3xl opacity-20 bg-pink-500/30 transition-all duration-500 group-hover:opacity-30 pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-5 border-none bg-transparent">
                <CardTitle className="text-[12px] font-bold uppercase tracking-widest opacity-80 font-heading flex items-center gap-2">
                    <Scissors className="h-4 w-4 text-pink-500" />
                    Fabric Consumption
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-1 overflow-y-auto space-y-4 z-10">
                {fabrics.map((fabric, i) => (
                    <div key={i}>
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-xs font-bold">{fabric.name}</span>
                            <span className={`text-[10px] font-bold ${fabric.usage > 90 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                {fabric.left}m remaining
                            </span>
                        </div>
                        <Progress
                            value={fabric.usage}
                            className="h-1.5"
                            indicatorClassName={fabric.usage > 90 ? "bg-red-500" : "bg-pink-500"}
                        />
                    </div>
                ))}

                <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 rounded-full">
                            <Layers className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-xs font-medium">Total Usage (This Month)</p>
                            <p className="text-lg font-bold font-mono">1,240 <span className="text-xs font-normal text-muted-foreground">meters</span></p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
