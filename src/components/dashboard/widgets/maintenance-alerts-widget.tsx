import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Calendar, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Alert {
    id: string | number;
    machine: string;
    type: string;
    date: Date | string;
    description: string;
}

interface MaintenanceAlertsWidgetProps {
    alerts?: Alert[];
}

export function MaintenanceAlertsWidget({ alerts = [] }: MaintenanceAlertsWidgetProps) {

    if (alerts.length === 0) {
        return (
            <Card className="glass-card w-full h-full border-none shadow-sm rounded-sm flex flex-col items-center justify-center p-6 text-center group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[150px] h-[150px] blur-3xl opacity-20 bg-slate-500/10 pointer-events-none" />
                <Wrench className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">No Scheduled Maintenance</p>
                <p className="text-xs text-muted-foreground/50 mt-1">All equipment is fully operational</p>
            </Card>
        );
    }

    return (
        <Card className="glass-card w-full h-full !p-0 border-none shadow-sm rounded-sm overflow-hidden flex flex-col group relative">
            <div className="absolute top-0 right-0 w-[150px] h-[150px] blur-3xl opacity-20 bg-slate-500/30 transition-all duration-500 group-hover:opacity-30 pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-5 pt-5 border-none bg-transparent">
                <CardTitle className="text-[12px] font-bold uppercase tracking-widest opacity-80 font-heading flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-slate-500" />
                    Maintenance Schedule
                </CardTitle>
            </CardHeader>
            <CardContent className="px-3 z-10">
                <div className="divide-y divide-white/5">
                    {alerts.map((alert) => (
                        <div key={alert.id} className="p-4 hover:bg-white/5 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                                <h5 className="font-bold text-sm">{alert.machine}</h5>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${alert.type === 'Urgent' ? 'bg-red-500/20 text-red-500' :
                                    alert.type === 'Scheduled' ? 'bg-amber-500/20 text-amber-500' :
                                        'bg-blue-500/20 text-blue-500'
                                    }`}>
                                    {alert.type}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{alert.description}</p>
                            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-500">
                                <Calendar className="h-3 w-3" />
                                <span>Due {formatDistanceToNow(alert.date, { addSuffix: true })}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
