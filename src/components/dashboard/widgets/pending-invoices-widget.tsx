import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Invoice {
    id: string;
    orderNumber: string;
    client: string;
    amount: number;
    date: Date | string;
}

interface PendingInvoicesWidgetProps {
    invoices?: Invoice[];
}

export function PendingInvoicesWidget({ invoices = [] }: PendingInvoicesWidgetProps) {
    const displayInvoices = invoices;

    if (displayInvoices.length === 0) {
        return (
            <Card className="glass-card w-full h-full border-none shadow-sm rounded-sm flex flex-col items-center justify-center p-6 text-center group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[150px] h-[150px] blur-3xl opacity-20 bg-red-500/10 pointer-events-none" />
                <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">No Pending Invoices</p>
                <p className="text-xs text-muted-foreground/50 mt-1">All orders are fully paid or delivered</p>
            </Card>
        );
    }

    return (
        <Card className="glass-card w-full h-full !p-0 border-none shadow-sm rounded-sm overflow-hidden flex flex-col group relative">
            <div className="absolute top-0 right-0 w-[150px] h-[150px] blur-3xl opacity-20 bg-red-500/30 transition-all duration-500 group-hover:opacity-30 pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-5 pt-5 border-none bg-transparent">
                <CardTitle className="text-[12px] font-bold uppercase tracking-widest opacity-80 font-heading flex items-center gap-2">
                    <FileText className="h-4 w-4 text-red-500" />
                    Pending Invoices
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 z-10">
                <div className="divide-y divide-white/5 relative">
                    {displayInvoices.map((invoice, i) => (
                        <Link key={invoice.id} href={`/orders/${invoice.id}`}>
                            <div className="flex items-center justify-between p-4 hover:bg-red-500/5 transition-colors group/item cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 shadow-sm">
                                        <AlertCircle className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold uppercase tracking-tight group-hover/item:text-red-600 dark:group-hover/item:text-red-400 transition-colors">{invoice.client}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1 flex items-center gap-1 opacity-70">
                                            #{invoice.orderNumber} • <Clock className="h-3 w-3" /> {formatDistanceToNow(new Date(invoice.date))} overdue
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold font-mono text-red-600 dark:text-red-500">Rs.{invoice.amount.toLocaleString()}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {displayInvoices.length === 0 && (
                        <div className="p-6 text-center text-muted-foreground text-sm">
                            No pending invoices.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
