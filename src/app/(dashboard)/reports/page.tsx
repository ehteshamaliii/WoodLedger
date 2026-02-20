"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
    Package,
    CreditCard,
    BarChart,
    History,
    FileSpreadsheet,
    FileText,
    TrendingUp,
    Store,
    ArrowUpRight,
    ArrowDownLeft,
    Wallet,
    PackageCheck,
    AlertCircle,
    CheckCircle2,
    Activity,
    PlusCircle,
    Edit3,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { ReportDocument } from "@/components/reports/report-template";
import { DataTable, Column, FilterConfig, DataTableFilters } from "@/components/shared/data-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsCard } from "@/components/dashboard/widgets/stats-card";

type ReportType = "ORDERS" | "PAYMENTS" | "STOCK" | "ACTIVITY";

const TAB_TYPES: ReportType[] = ["ORDERS", "PAYMENTS", "STOCK", "ACTIVITY"];

const reportConfig: Record<ReportType, {
    title: string;
    icon: React.ElementType;
    columns: Column<any>[];
    apiUrl: string;
}> = {
    ORDERS: {
        title: "Orders Report",
        icon: Package,
        apiUrl: "/api/reports/orders",
        columns: [
            { header: "Order #", render: (o) => <span className="font-mono text-sm">{o.orderNumber}</span> },
            { header: "Client", accessorKey: "client.name", render: (o) => <span className="font-medium">{o.client?.name}</span> },
            { header: "Total (Rs)", headerClassName: "text-right", className: "text-right font-mono font-bold", render: (o) => <span>Rs. {Number(o.totalPrice).toLocaleString()}</span> },
            { header: "Status", render: (o) => <span className="uppercase font-bold text-[10px] tracking-wider">{o.status}</span> },
            { header: "Date", render: (o) => <span className="text-muted-foreground text-sm">{format(new Date(o.createdAt), "MMM dd, yyyy")}</span> },
        ],
    },
    PAYMENTS: {
        title: "Payments Report",
        icon: CreditCard,
        apiUrl: "/api/reports/payments",
        columns: [
            { header: "Account", render: (p) => <span className="font-medium">{p.account?.name}</span> },
            { header: "Amount (Rs)", headerClassName: "text-right", className: "text-right font-mono font-bold", render: (p) => <span>Rs. {Number(p.amount).toLocaleString()}</span> },
            { header: "Type", render: (p) => <span className="uppercase font-bold text-[10px] tracking-wider">{p.type}</span> },
            { header: "Date", render: (p) => <span className="text-muted-foreground text-sm">{format(new Date(p.date), "MMM dd, yyyy")}</span> },
        ],
    },
    STOCK: {
        title: "Stock Report",
        icon: BarChart,
        apiUrl: "/api/reports/stock",
        columns: [
            { header: "Product", render: (s) => <span className="font-bold">{s.productName}</span> },
            { header: "Furniture", render: (s) => <span className="text-sm text-muted-foreground">{s.furnitureType?.name}</span> },
            { header: "Fabric", render: (s) => <span className="text-sm text-muted-foreground">{s.fabricType?.name}</span> },
            { header: "Qty", headerClassName: "text-right", className: "text-right font-mono font-bold", accessorKey: "quantity" },
            { header: "Status", render: (s) => <span className={s.quantity <= s.minQuantity ? "text-red-500 font-bold text-[10px] uppercase" : "text-emerald-500 font-bold text-[10px] uppercase"}>{s.quantity <= s.minQuantity ? "LOW" : "OK"}</span> },
        ],
    },
    ACTIVITY: {
        title: "Audit Log",
        icon: History,
        apiUrl: "/api/reports/activity-logs",
        columns: [
            { header: "User", render: (l) => <span className="font-medium">{l.user?.name}</span> },
            { header: "Action", render: (l) => <span className="font-bold text-[10px] uppercase tracking-wider">{l.action}</span> },
            { header: "Module", render: (l) => <span className="text-sm text-muted-foreground">{l.module}</span> },
            { header: "Time", render: (l) => <span className="text-sm text-muted-foreground font-mono">{format(new Date(l.createdAt), "MMM dd, HH:mm")}</span> },
        ],
    },
};

function getCsvData(type: ReportType, data: any[]) {
    switch (type) {
        case "ORDERS": return { headers: ["Order #", "Client", "Total (Rs)", "Status", "Date"], rows: data.map(o => [o.orderNumber, o.client?.name, Number(o.totalPrice).toLocaleString(), o.status, format(new Date(o.createdAt), "yyyy-MM-dd")]) };
        case "PAYMENTS": return { headers: ["Account", "Amount (Rs)", "Type", "Date"], rows: data.map(p => [p.account?.name, Number(p.amount).toLocaleString(), p.type, format(new Date(p.date), "yyyy-MM-dd")]) };
        case "STOCK": return { headers: ["Product", "Furniture", "Fabric", "Qty", "Status"], rows: data.map(s => [s.productName, s.furnitureType?.name, s.fabricType?.name, s.quantity, s.quantity <= s.minQuantity ? "LOW" : "OK"]) };
        case "ACTIVITY": return { headers: ["User", "Action", "Module", "Time"], rows: data.map(l => [l.user?.name, l.action, l.module, format(new Date(l.createdAt), "yyyy-MM-dd HH:mm")]) };
    }
}

export default function ReportsPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<ReportType>("ORDERS");
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [tableFilters, setTableFilters] = useState<DataTableFilters | null>(null);

    useEffect(() => {
        const fetchReport = async () => {
            setIsLoading(true);
            try {
                const cfg = reportConfig[activeTab];
                const res = await fetch(`${cfg.apiUrl}?pageSize=500`);
                const result = await res.json();
                if (result.success) {
                    setData(result.data);
                } else {
                    toast({ title: "Error", description: result.error || "Failed to load report", variant: "destructive" });
                }
            } catch {
                toast({ title: "Error", description: "Failed to load report", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
        setTableFilters(null); // Reset filters on tab change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const filterConfig = useMemo<FilterConfig>(() => {
        //...
        switch (activeTab) {
            case "ORDERS":
                return {
                    search: {
                        //...
                        enabled: true,
                        placeholder: "Search by order # or client...",
                        searchFields: ["orderNumber", "client.name"],
                    },
                    selects: [
                        {
                            key: "status",
                            label: "Status",
                            options: [
                                { label: "Pending", value: "PENDING" },
                                { label: "Processing", value: "PROCESSING" },
                                { label: "Delivered", value: "DELIVERED" },
                            ],
                        },
                    ],
                    dateRange: {
                        enabled: true,
                        key: "createdAt",
                        label: "Date",
                    }
                };
            case "PAYMENTS":
                return {
                    search: {
                        enabled: true,
                        placeholder: "Search by account or description...",
                        searchFields: ["account.name", "description"],
                    },
                    selects: [
                        {
                            key: "type",
                            label: "Type",
                            options: [
                                { label: "Credit (In)", value: "CREDIT" },
                                { label: "Debit (Out)", value: "DEBIT" },
                            ],
                        },
                    ],
                    dateRange: {
                        enabled: true,
                        key: "date",
                        label: "Date",
                    }
                };
            case "STOCK":
                return {
                    search: {
                        enabled: true,
                        placeholder: "Search product name...",
                        searchFields: ["productName", "furnitureType.name", "fabricType.name"],
                    },
                    toggles: [
                        {
                            key: "lowStock",
                            label: "Low Stock Only",
                            filterFn: (item: any) => item.quantity <= item.minQuantity,
                        }
                    ]
                };
            case "ACTIVITY":
                return {
                    search: {
                        enabled: true,
                        placeholder: "Search by user or module...",
                        searchFields: ["user.name", "module"],
                    },
                    selects: [
                        {
                            key: "action",
                            label: "Action",
                            options: [
                                { label: "Create", value: "CREATE" },
                                { label: "Update", value: "UPDATE" },
                                { label: "Delete", value: "DELETE" },
                            ],
                        },
                    ],
                    dateRange: {
                        enabled: true,
                        key: "createdAt",
                        label: "Date",
                    }
                };
        }
    }, [activeTab]);

    const filteredDataExport = useMemo(() => {
        let result = data;
        if (!tableFilters) return result;

        const config = filterConfig;

        if (tableFilters.search && config.search) {
            const searchLower = tableFilters.search.toLowerCase();
            result = result.filter(item => {
                return config.search!.searchFields.some(field => {
                    const value = field.split('.').reduce((acc, part) => acc && acc[part], item);
                    return String(value || '').toLowerCase().includes(searchLower);
                });
            });
        }

        if (tableFilters.selects) {
            for (const [key, value] of Object.entries(tableFilters.selects)) {
                if (value && value !== 'all') {
                    result = result.filter(item => String(item[key]) === value);
                }
            }
        }

        if (tableFilters.dateRange?.from && config.dateRange) {
            const key = config.dateRange.key;
            if (key) {
                const start = startOfDay(tableFilters.dateRange.from);
                const end = tableFilters.dateRange.to ? endOfDay(tableFilters.dateRange.to) : endOfDay(tableFilters.dateRange.from);
                result = result.filter(item => {
                    const itemDate = new Date(item[key]);
                    return isWithinInterval(itemDate, { start, end });
                });
            }
        }

        if (tableFilters.toggles && config.toggles) {
            for (const toggle of config.toggles) {
                if (tableFilters.toggles[toggle.key]) {
                    if (toggle.filterFn) {
                        result = result.filter(item => toggle.filterFn!(item));
                    } else {
                        result = result.filter(item => {
                            return toggle.key.split('.').reduce((acc, part) => acc && acc[part], item);
                        });
                    }
                }
            }
        }

        return result;
    }, [data, tableFilters, filterConfig]);

    const csvData = filteredDataExport.length ? getCsvData(activeTab, filteredDataExport) : null;

    const exportToCSV = () => {
        if (!csvData) return;
        const csvContent = [csvData.headers.join(","), ...csvData.rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `woodledger_${activeTab.toLowerCase()}_${format(new Date(), "yyyyMMdd")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const cfg = reportConfig[activeTab];

    const statsCards = useMemo(() => {
        const sourceData = filteredDataExport; // Always show stats based on filtered view
        if (!sourceData.length) return null;

        if (activeTab === "ORDERS") {
            const total = sourceData.length;
            const revenue = sourceData.reduce((sum, o: any) => sum + Number(o.totalPrice || 0), 0);
            const pending = sourceData.filter((o: any) => o.status === "PENDING").length;
            const delivered = sourceData.filter((o: any) => o.status === "DELIVERED").length;

            return (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatsCard title="Filtered Orders" value={total} icon={Package} description="Orders in report" variant="primary" />
                    <StatsCard title="Revenue" value={`Rs. ${revenue.toLocaleString()}`} icon={TrendingUp} description="Value of selected orders" variant="secondary" />
                    <StatsCard title="Pending" value={pending} icon={Store} description="Awaiting processing" variant="destructive" />
                    <StatsCard title="Delivered" value={delivered} icon={PackageCheck} description="Completed orders" variant="secondary" />
                </div>
            );
        }

        if (activeTab === "PAYMENTS") {
            const credits = sourceData.filter((p: any) => p.type === "CREDIT").reduce((sum, p: any) => sum + Number(p.amount || 0), 0);
            const debits = sourceData.filter((p: any) => p.type === "DEBIT").reduce((sum, p: any) => sum + Number(p.amount || 0), 0);
            const net = credits - debits;

            return (
                <div className="grid gap-4 md:grid-cols-3">
                    <StatsCard title="Credits" value={`Rs. ${credits.toLocaleString()}`} icon={ArrowUpRight} description="Inflow amount" variant="secondary" />
                    <StatsCard title="Debits" value={`Rs. ${debits.toLocaleString()}`} icon={ArrowDownLeft} description="Outflow amount" variant="destructive" />
                    <StatsCard title="Net Flow" value={`Rs. ${net.toLocaleString()}`} icon={Wallet} description="Period balance" variant={net >= 0 ? "primary" : "destructive"} />
                </div>
            );
        }

        if (activeTab === "STOCK") {
            const totalItems = sourceData.length;
            const lowStock = sourceData.filter((s: any) => s.quantity <= s.minQuantity).length;
            const healthy = totalItems - lowStock;

            return (
                <div className="grid gap-4 md:grid-cols-3">
                    <StatsCard title="Tracked Items" value={totalItems} icon={BarChart} description="Items in inventory" variant="primary" />
                    <StatsCard title="Needs Attention" value={lowStock} icon={AlertCircle} description="Low stock items" variant="destructive" />
                    <StatsCard title="Healthy Stock" value={healthy} icon={CheckCircle2} description="Adequate quantity" variant="secondary" />
                </div>
            );
        }

        if (activeTab === "ACTIVITY") {
            const total = sourceData.length;
            const creates = sourceData.filter((a: any) => a.action === "CREATE").length;
            const updates = sourceData.filter((a: any) => a.action === "UPDATE").length;
            const deletes = sourceData.filter((a: any) => a.action === "DELETE").length;

            return (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatsCard title="Matching Actions" value={total} icon={Activity} description="Recorded events" variant="primary" />
                    <StatsCard title="Creations" value={creates} icon={PlusCircle} description="New records" variant="secondary" />
                    <StatsCard title="Updates" value={updates} icon={Edit3} description="Modified records" variant="primary" />
                    <StatsCard title="Deletions" value={deletes} icon={Trash2} description="Removed records" variant="destructive" />
                </div>
            );
        }

        return null;
    }, [filteredDataExport, activeTab]);

    const exportActions = (
        <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={exportToCSV} disabled={!filteredDataExport.length || isLoading}
                className="shadow-lg shadow-secondary/20 hover:scale-105 transition-all">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                CSV
            </Button>
            {filteredDataExport.length > 0 && csvData && (
                <PDFDownloadLink
                    document={
                        <ReportDocument
                            title={cfg.title}
                            dateRange={
                                tableFilters?.dateRange?.from
                                    ? `${format(tableFilters.dateRange.from, "MMM dd")} - ${format(tableFilters.dateRange.to || tableFilters.dateRange.from, "MMM dd")}`
                                    : "All Time"
                            }
                            headers={csvData.headers}
                            data={csvData.rows}
                        />
                    }
                    fileName={`woodledger_${activeTab.toLowerCase()}.pdf`}
                >
                    {({ loading }) => (
                        <Button size="sm" disabled={loading}
                            className="shadow-lg shadow-secondary/20 hover:scale-105 transition-all">
                            <FileText className="h-3.5 w-3.5" />
                            {loading ? "Preparing..." : "PDF"}
                        </Button>
                    )}
                </PDFDownloadLink>
            )}
        </div>
    );

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 page-enter">
            <DataTable
                title="Reports & Exports"
                description="Analyze your data and export business reports in multiple formats"
                headerActions={exportActions}
                statsCards={statsCards}
                sectionTitle={cfg.title}
                sectionDescription={`${filteredDataExport.length} results found`}
                data={data}
                columns={cfg.columns}
                filterConfig={filterConfig}
                onFilterChange={setTableFilters}
                isLoading={isLoading}
                rowIdKey="id"
                emptyTitle="No data found"
                emptyDescription={data.length === 0 ? "No records exist for this report type" : "Change filters to see results"}
                emptyIcon={<BarChart className="h-16 w-16 text-muted-foreground/20" />}
                headerChildren={
                    <div className="mb-6 space-y-4">
                        <Tabs
                            value={activeTab}
                            onValueChange={(v) => { setActiveTab(v as ReportType); setData([]); }}
                            className="w-full"
                        >
                            <TabsList className="w-full sm:w-auto justify-start h-auto p-1 bg-muted/40">
                                {TAB_TYPES.map((type) => {
                                    const Icon = reportConfig[type].icon;
                                    return (
                                        <TabsTrigger
                                            key={type}
                                            value={type}
                                            className="px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2"
                                        >
                                            <Icon className="h-4 w-4" />
                                            {type === "ACTIVITY" ? "Audit" : type.charAt(0) + type.slice(1).toLowerCase()}
                                        </TabsTrigger>
                                    );
                                })}
                            </TabsList>
                        </Tabs>
                    </div>
                }
            />
        </div>
    );
}

