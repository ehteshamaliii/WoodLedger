import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, UserPlus, PackagePlus, BarChart3, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuickActionsWidget() {
    const actions = [
        {
            label: "New Order",
            icon: PlusCircle,
            href: "/orders/new",
            color: "text-accent",
            bgColor: "bg-accent/10",
            borderColor: "border-accent/20"
        },
        {
            label: "Add Client",
            icon: UserPlus,
            href: "/clients/new",
            color: "text-secondary",
            bgColor: "bg-secondary/10",
            borderColor: "border-secondary/20"
        },
        {
            label: "Add Stock",
            icon: PackagePlus,
            href: "/inventory",
            color: "text-primary",
            bgColor: "bg-primary/10",
            borderColor: "border-primary/20"
        },
        {
            label: "Reports",
            icon: BarChart3,
            href: "/reports",
            color: "text-muted-foreground",
            bgColor: "bg-muted/30",
            borderColor: "border-muted/30"
        }
    ];

    return (
        <Card className="glass-card h-full border-none shadow-sm rounded-sm overflow-hidden flex flex-col group relative">
            <div className="absolute top-0 right-0 w-[150px] h-[150px] blur-3xl opacity-20 bg-accent/20 transition-all duration-500 group-hover:opacity-30 pointer-events-none" />

            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-5 border-none bg-transparent">
                <CardTitle className="text-[12px] font-bold uppercase tracking-widest opacity-80 font-heading flex items-center gap-2">
                    <Zap className="h-4 w-4 text-accent" />
                    Quick Actions
                </CardTitle>
            </CardHeader>
            <CardContent className="p-5 grid grid-cols-2 gap-4 flex-1">
                {actions.map((action, index) => (
                    <Button
                        key={index}
                        variant="outline"
                        className={cn(
                            "h-full flex flex-col items-center justify-center gap-3 border- border-dashed hover:border-solid transition-all duration-300",
                            "bg-secondary/5 hover:bg-secondary/10 border-white/10 hover:border-primary/20",
                            "hover:scale-[1.02] hover:shadow-lg shadow-none"
                        )}
                        asChild
                    >
                        <Link href={action.href}>
                            <div className={cn(
                                "p-3 rounded-xl transition-all duration-300",
                                action.bgColor,
                                "group-hover:scale-110"
                            )}>
                                <action.icon className={cn("h-5 w-5", action.color)} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider opacity-80 text-muted-foreground group-hover:text-foreground transition-colors">{action.label}</span>
                        </Link>
                    </Button>
                ))}
            </CardContent>
        </Card>
    );
}
