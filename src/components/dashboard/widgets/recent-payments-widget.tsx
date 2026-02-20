import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Payment {
    id: string;
    entity: string;
    amount: number;
    type: 'CREDIT' | 'DEBIT';
    date: Date | string;
}

interface RecentPaymentsWidgetProps {
    payments?: Payment[];
}

export function RecentPaymentsWidget({ payments = [] }: RecentPaymentsWidgetProps) {
    const displayPayments = payments;

    if (displayPayments.length === 0) {
        return (
            <Card className="glass-card w-full h-full border-none shadow-sm rounded-sm flex flex-col items-center justify-center p-6 text-center group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[150px] h-[150px] blur-3xl opacity-20 bg-purple-500/10 pointer-events-none" />
                <CreditCard className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">No Transactions</p>
                <p className="text-xs text-muted-foreground/50 mt-1">No recent payment activity</p>
            </Card>
        );
    }

    return (
        <Card className="glass-card w-full h-full !p-0 border-none shadow-sm rounded-sm overflow-hidden flex flex-col group relative">
            <div className="absolute top-0 right-0 w-[150px] h-[150px] blur-3xl opacity-20 bg-purple-500/30 transition-all duration-500 group-hover:opacity-30 pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-5 pt-5 border-none bg-transparent">
                <CardTitle className="text-[12px] font-bold uppercase tracking-widest opacity-80 font-heading flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-purple-500" />
                    Recent Transactions
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 z-10">
                <div className="divide-y divide-white/5 relative">
                    {displayPayments.map((payment) => (
                        <Link key={payment.id} href="/payments">
                            <div className="flex items-center justify-between p-4 hover:bg-purple-500/5 transition-colors group/item cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center border shadow-sm transition-all group-hover/item:scale-110",
                                        payment.type === 'CREDIT'
                                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                            : "bg-red-500/10 text-red-500 border-red-500/20"
                                    )}>
                                        {payment.type === 'CREDIT' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold uppercase tracking-tight group-hover/item:text-purple-600 dark:group-hover/item:text-purple-400 transition-colors">{payment.entity}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1 opacity-70">
                                            {formatDistanceToNow(new Date(payment.date), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={cn(
                                        "text-sm font-bold font-mono",
                                        payment.type === 'CREDIT' ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"
                                    )}>
                                        {payment.type === 'CREDIT' ? '+' : '-'}Rs.{Number(payment.amount).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
