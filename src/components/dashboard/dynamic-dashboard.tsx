import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    DndContext,
    closestCenter,
    pointerWithin,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { WidgetWrapper } from "./widget-wrapper";
import { StatsCard } from "./widgets/stats-card";
import { RevenueChart } from "./widgets/revenue-chart";
import { RecentOrdersWidget } from "./widgets/recent-orders-widget";
import { LowStockWidget } from "./widgets/low-stock-widget";
import { ProductionStatusWidget } from "./widgets/production-status-widget";
import { QuickActionsWidget } from "./widgets/quick-actions-widget";
import { SalesTargetWidget } from "./widgets/sales-target-widget";
import { RevenueCategoryWidget } from "./widgets/revenue-category-widget";
import { TopProductsWidget } from "./widgets/top-products-widget";
import { RecentPaymentsWidget } from "./widgets/recent-payments-widget";
import { ClientGrowthWidget } from "./widgets/client-growth-widget";
import { OrderStatusDistributionWidget } from "./widgets/order-status-distribution-widget";
import { StockValueWidget } from "./widgets/stock-value-widget";
import { PendingInvoicesWidget } from "./widgets/pending-invoices-widget";
import { ProductionEfficiencyWidget } from "./widgets/production-efficiency-widget";
import { MaintenanceAlertsWidget } from "./widgets/maintenance-alerts-widget";
import { FabricUsageWidget } from "./widgets/fabric-usage-widget";
import {
    TrendingUp,
    ShoppingCart,
    AlertTriangle,
    Users,
    Plus,
    LayoutDashboard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WidgetConfig {
    id: string;
    type: string;
    x: number;
    y: number;
    w: number;
    h: number;
    isVisible: boolean;
    settings?: any;
}

interface DynamicDashboardProps {
    data: any;
    isEditing: boolean;
    aiSuggestions: string | null;
    isAnalyzing: boolean;
    onFetchAiSuggestions: () => void;
    onSaveLayout: (widgets: WidgetConfig[]) => void;
}

const AVAILABLE_WIDGETS = [
    { type: "REVENUE_STATS", label: "Total Revenue", w: 1, h: 1 },
    { type: "ORDERS_STATS", label: "Active Orders", w: 1, h: 1 },
    { type: "STOCK_STATS", label: "Low Stock Alert", w: 1, h: 1 },
    { type: "CLIENTS_STATS", label: "Total Clients", w: 1, h: 1 },
    { type: "REVENUE_CHART", label: "Financial Overview", w: 2, h: 2 },
    { type: "RecentOrders", label: "Recent Orders", w: 2, h: 2 },
    { type: "LowStock", label: "Low Stock List", w: 2, h: 2 },
    { type: "PRODUCTION_QUEUE", label: "Production Status", w: 2, h: 2 },
    { type: "QuickActions", label: "Quick Actions", w: 2, h: 2 },
    { type: "SalesTarget", label: "Sales Target", w: 2, h: 2 },
    { type: "RevenueCategory", label: "Revenue by Category", w: 2, h: 2 },
    { type: "TopProducts", label: "Top Products", w: 2, h: 2 },
    { type: "RecentPayments", label: "Recent Payments", w: 2, h: 2 },
    { type: "ClientGrowth", label: "Client Growth", w: 2, h: 2 },
    { type: "OrderStatusDistribution", label: "Order Status Dist", w: 2, h: 2 },
    { type: "StockValue", label: "Stock Value", w: 2, h: 2 },
    { type: "PendingInvoices", label: "Pending Invoices", w: 2, h: 2 },
    { type: "ProductionEfficiency", label: "Production Efficiency", w: 2, h: 2 },
    { type: "MaintenanceAlerts", label: "Maintenance Alerts", w: 2, h: 2 },
    { type: "FabricUsage", label: "Fabric Usage", w: 2, h: 2 },
];

export function DynamicDashboard({
    data,
    isEditing,
    onSaveLayout,
}: DynamicDashboardProps) {
    const { toast } = useToast();
    const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);

    const [hasChanged, setHasChanged] = useState(false);

    // Calculate usage count for each widget type
    const widgetUsage = widgets.reduce((acc, w) => {
        acc[w.type] = (acc[w.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch("/api/dashboard/config");
                const result = await res.json();
                if (result.success) {
                    // Filter out widgets that are no longer supported
                    const supportedTypes = [
                        "REVENUE_STATS", "ORDERS_STATS", "STOCK_STATS", "CLIENTS_STATS",
                        "REVENUE_CHART", "RecentOrders", "LowStock", "PRODUCTION_QUEUE",
                        "QuickActions", "SalesTarget", "RevenueCategory", "TopProducts",
                        "RecentPayments", "ClientGrowth", "OrderStatusDistribution",
                        "StockValue", "PendingInvoices", "ProductionEfficiency",
                        "MaintenanceAlerts", "FabricUsage"
                    ];
                    const validWidgets = result.data.widgets.filter((w: WidgetConfig) =>
                        supportedTypes.includes(w.type)
                    );
                    setWidgets(validWidgets);
                }
            } catch (error) {
                console.error("Failed to load dashboard config");
            }
        };
        fetchConfig();
    }, []);

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setWidgets((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);

                if (oldIndex !== -1 && newIndex !== -1) {
                    const draggedItem = items[oldIndex];
                    const targetItem = items[newIndex];

                    const updatedItems = [...items];
                    // Swap dimensions
                    updatedItems[oldIndex] = { ...draggedItem, w: targetItem.w, h: targetItem.h };
                    updatedItems[newIndex] = { ...targetItem, w: draggedItem.w, h: draggedItem.h };

                    return arrayMove(updatedItems, oldIndex, newIndex);
                }
                return items;
            });
            setHasChanged(true);
        }

        setActiveId(null);
    };

    const handleRemoveWidget = (id: string) => {
        setWidgets(widgets.filter(w => w.id !== id));
        setHasChanged(true);
        toast({
            title: "Widget Removed",
            description: "You can add it back from the library in edit mode.",
        });
    };

    const handleAddWidget = (type: string) => {
        const widgetDef = AVAILABLE_WIDGETS.find(w => w.type === type);
        if (!widgetDef) return;

        const newWidget: WidgetConfig = {
            id: `${type}-${Date.now()}`,
            type: type,
            x: 0, // Dnd-kit sortable strategy usually handles layout flow, but coords are kept for grid
            y: 0,
            w: widgetDef.w,
            h: widgetDef.h,
            isVisible: true,
        };

        setWidgets([...widgets, newWidget]);
        setHasChanged(true);
        toast({
            title: "Widget Added",
            description: `${widgetDef.label} has been added to your dashboard.`,
        });
    };

    const handleResizeWidget = (id: string) => {
        setWidgets(widgets.map(w => {
            if (w.id === id) {
                // Cycle dimensions: 1x1 -> 2x1 -> 2x2 -> 4x2 -> 1x1
                if (w.w === 1 && w.h === 1) return { ...w, w: 2, h: 1 };
                if (w.w === 2 && w.h === 1) return { ...w, w: 2, h: 2 };
                if (w.w === 2 && w.h === 2) return { ...w, w: 4, h: 2 };
                if (w.w === 4 && w.h === 2) return { ...w, w: 1, h: 1 };
                return { ...w, w: 1, h: 1 }; // Reset fallback
            }
            return w;
        }));
        setHasChanged(true);
    };

    // Save layout when isEditing becomes false (if changed)
    useEffect(() => {
        if (!isEditing && hasChanged && widgets.length > 0) {
            // Update x/y coordinates to represent the sort order
            // Since we use CSS grid auto-placement, the array order dictates position.
            // We use 'y' as the sort index to ensure persistence.
            const orderedWidgets = widgets.map((w, index) => ({
                ...w,
                y: index,
                x: 0
            }));
            onSaveLayout(orderedWidgets);
            setHasChanged(false);
        }
    }, [isEditing, widgets, hasChanged]);

    const renderWidget = (widget: WidgetConfig) => {
        switch (widget.type) {
            case "REVENUE_STATS":
                return (
                    <StatsCard
                        title="Total Revenue"
                        value={`Rs. ${data.stats.totalRevenue.toLocaleString()}`}
                        trend={data.stats.revenueTrend}
                        icon={TrendingUp}
                        description="Monthly gross"
                    />
                );
            case "ORDERS_STATS":
                return (
                    <StatsCard
                        title="Active Orders"
                        value={data.stats.pendingOrders}
                        icon={ShoppingCart}
                        description="In processing"
                        variant="secondary"
                    />
                );
            case "STOCK_STATS":
                return (
                    <StatsCard
                        title="Low Stock"
                        value={data.stats.lowStockItems}
                        icon={AlertTriangle}
                        trend={data.stats.lowStockItems > 0 ? "Critical" : 0}
                        inverseTrend
                        description="Restock alerts"
                    />
                );
            case "CLIENTS_STATS":
                return (
                    <StatsCard
                        title="Total Clients"
                        value={data.stats.totalClients}
                        icon={Users}
                        description="Active partners"
                        variant="secondary"
                    />
                );
            case "REVENUE_CHART":
                return (
                    <RevenueChart data={data.chartData} />
                );
            case "RecentOrders":
                return (
                    <RecentOrdersWidget orders={data.recentActivity?.orders || []} />
                );
            case "LowStock":
                return (
                    <LowStockWidget items={(data.recentActivity?.stock || []).filter((s: any) => s.quantity <= s.minQuantity)} />
                );
            case "PRODUCTION_QUEUE":
                return (
                    <ProductionStatusWidget orders={data.productionOrders || []} />
                );
            case "QuickActions":
                return (
                    <QuickActionsWidget />
                );
            case "SalesTarget":
                return (
                    <SalesTargetWidget current={data.stats.totalRevenue} target={data.stats.monthlyTarget} />
                );
            case "RevenueCategory":
                return <RevenueCategoryWidget data={data.revenueByCategory} />;
            case "TopProducts":
                return <TopProductsWidget products={data.topProducts} />;
            case "RecentPayments":
                return <RecentPaymentsWidget payments={data.recentActivity?.payments || []} />;
            case "ClientGrowth":
                return <ClientGrowthWidget data={data.clientGrowth} />;
            case "OrderStatusDistribution":
                return <OrderStatusDistributionWidget data={data.orderStatusDistribution} />;
            case "StockValue":
                return <StockValueWidget totalValue={data.stockValue?.totalValue} itemCount={data.stockValue?.itemCount} />;
            case "PendingInvoices":
                return <PendingInvoicesWidget invoices={data.pendingInvoices} />;
            case "ProductionEfficiency":
                return <ProductionEfficiencyWidget
                    avgTurnaroundDays={data.productionEfficiency?.avgTurnaroundDays}
                    onTimeRate={data.productionEfficiency?.onTimeRate}
                    weeklyOutput={data.productionEfficiency?.weeklyOutput}
                    weeklyGoal={data.productionEfficiency?.weeklyGoal}
                />;
            case "MaintenanceAlerts":
                return <MaintenanceAlertsWidget alerts={data.maintenanceAlerts} />;
            case "FabricUsage":
                return <FabricUsageWidget fabrics={data.fabricUsage} />;
            default:
                return <div>Unknown: {widget.type}</div>;
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToWindowEdges]}
        >
            <div className="relative min-h-[calc(100vh-200px)]">
                {isEditing && (
                    <div className="flex items-center justify-between mb-8 p-4 bg-primary/5 border border-primary/10 rounded-sm animate-in fade-in slide-in-from-top-4 duration-500 backdrop-blur-sm shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-primary/10 rounded-full shadow-inner">
                                <LayoutDashboard className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-bold uppercase tracking-widest text-foreground">Dashboard Editor</p>
                                <p className="text-xs text-muted-foreground font-medium">Customize your workspace by rearranging or adding widgets</p>
                            </div>
                        </div>
                    </div>
                )}


                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 grid-flow-row-dense auto-rows-min pb-20">
                    <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
                        {widgets.map((widget) => (
                            <WidgetWrapper
                                key={widget.id}
                                id={widget.id}
                                item={widget}
                                isEditing={isEditing}
                                onRemove={handleRemoveWidget}
                                onResize={handleResizeWidget}
                            >
                                {renderWidget(widget)}
                            </WidgetWrapper>
                        ))}
                    </SortableContext>
                </div>

            </div>

            {mounted && isEditing && createPortal(
                <div className="fixed bottom-8 right-8 z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="lg" className="rounded-full h-16 w-16 shadow-2xl bg-primary hover:bg-primary/90 hover:scale-110 transition-all flex items-center justify-center border-4 border-background/50 backdrop-blur-sm group">
                                <Plus className="h-8 w-8 group-hover:rotate-90 transition-transform duration-300" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 glass-card border-white/10 mb-4 max-h-[400px] overflow-y-auto scrollbar-thin">
                            <DropdownMenuLabel className="font-heading uppercase tracking-wider text-xs opacity-70">Widget Library</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/10" />
                            {AVAILABLE_WIDGETS.map((w) => {
                                const count = widgetUsage[w.type] || 0;
                                return (
                                    <DropdownMenuItem
                                        key={w.type}
                                        onClick={() => handleAddWidget(w.type)}
                                        className="cursor-pointer focus:bg-primary/20 focus:text-foreground transition-colors p-2.5 rounded-sm flex items-center justify-between group/item"
                                    >
                                        <div className="flex items-center">
                                            <LayoutDashboard className="mr-3 h-4 w-4 opacity-70 group-hover/item:text-primary group-hover/item:opacity-100 transition-all" />
                                            <span className="font-medium text-sm">{w.label}</span>
                                        </div>
                                        {count > 0 && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-muted-foreground group-focus:bg-primary group-focus:text-primary-foreground group-focus:border-primary/20 transition-all">
                                                {count}
                                            </span>
                                        )}
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>,
                document.body
            )}

            <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                    styles: {
                        active: {
                            opacity: "0.5",
                        },
                    },
                }),
            }}>
                {activeId ? (
                    <div className="w-full h-full opacity-90 transition-transform">
                        {renderWidget(widgets.find(w => w.id === activeId)!)}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
