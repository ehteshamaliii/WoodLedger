"use client";

import { ReactNode, useState, useEffect, useCallback } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Loader2,
    Package,
    Search,
    X,
    ArrowUpDown,
    Eye,
    Pencil,
    Trash2,
    Download,
    MoreHorizontal,
    SlidersHorizontal,
    Check,
    XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmationModal } from "@/components/shared/confirmation-modal";

// --- Types ---

export type ColumnType = 'text' | 'number' | 'currency' | 'date' | 'badge' | 'custom' | 'action';

export interface Column<T> {
    accessorKey?: keyof T; // Key to access data
    header: string;
    type?: ColumnType;
    className?: string;
    headerClassName?: string;
    hideable?: boolean; // Whether this column can be shown/hidden via the column picker
    // Formatting options
    format?: string; // e.g., 'MMM dd, yyyy' for dates
    badgeConfig?: Record<string, { label: string; variant?: "default" | "secondary" | "destructive" | "outline"; className?: string }>;
    // Custom render (overrides type/accessorKey)
    render?: (item: T) => ReactNode;
    sortable?: boolean;
}

export interface FilterConfig {
    search?: {
        enabled: boolean;
        placeholder?: string;
        searchFields: string[]; // Fields to search in (e.g., ['orderNumber', 'client.name'])
    };
    selects?: {
        key: string; // Key to filter by (e.g., 'status')
        label: string;
        options: { label: string; value: string }[];
    }[];
    dateRange?: {
        enabled: boolean;
        key: string; // Key to filter by (e.g., 'createdAt')
        label?: string;
    };
    toggles?: {
        key: string; // Key for boolean check or custom logic
        label: string;
        activeLabel?: string;
        icon?: React.ElementType; // Icon component
        filterFn?: (item: any) => boolean; // Custom filter function
    }[];
}

export interface TabsConfig {
    valueKey: string; // The key in the data to filter by (e.g., 'status')
    defaultValue?: string;
    showCount?: boolean; // Show item count badge on each tab
    items: {
        value: string; // The value to match
        label: string;
        icon?: React.ElementType;
    }[];
}

export interface BulkAction<T> {
    label: string;
    icon?: React.ElementType;
    variant?: "default" | "secondary" | "destructive" | "outline" | "ghost";
    onClick: (selectedItems: T[]) => void | Promise<void>;
    confirmation?: {
        title: string;
        description: string;
    };
}

export type RowActionType = 'view' | 'edit' | 'delete' | 'download' | 'custom';

export interface RowAction<T> {
    type?: RowActionType; // Optional for backward compatibility, but recommended
    label: string; // Used for tooltip
    icon?: React.ElementType; // Optional if type is provided
    onClick: (item: T) => void | Promise<void>;
    className?: string; // Custom styling (e.g., text-destructive)
    show?: (item: T) => boolean; // Conditional rendering
    disabled?: (item: T) => boolean; // Conditional disabling
    disabledReason?: string | ((item: T) => string); // Tooltip text when disabled
    confirmation?: {
        title: string | ((item: T) => string);
        description: string | ((item: T) => string);
    };
}

export interface DataTableFilters {
    search?: string;
    selects?: Record<string, string>;
    tab?: string;
    dateRange?: DateRange;
    toggles?: Record<string, boolean>;
}

export interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    isLoading?: boolean;
    rowIdKey: keyof T;
    // Page Header (top of page – primary)
    title?: string;
    description?: string;
    headerActions?: ReactNode;
    // Stats Cards (between page header and table)
    statsCards?: ReactNode;
    // Section heading inside the table card (secondary)
    sectionTitle?: string;
    sectionDescription?: string;
    // Configuration
    filterConfig?: FilterConfig;
    tabsConfig?: TabsConfig;
    bulkActions?: BulkAction<T>[];
    rowActions?: RowAction<T>[];
    // Pagination (Client-side handled internally if not provided, or external)
    pagination?: {
        currentPage: number;
        totalPages: number;
        onPageChange: (page: number) => void;
        pageSize?: number;
    };
    // Callbacks
    onFilterChange?: (filters: DataTableFilters) => void; // Fires when internal filters change (for server-side filtering)
    // Empty state
    emptyTitle?: string;
    emptyDescription?: string;
    emptyIcon?: ReactNode;
    // Row click
    onRowClick?: (item: T) => void;
    // Extra content rendered below the page header (e.g. filter panels)
    headerChildren?: ReactNode;
    // Explicit tab counts to display as badges (overrides internal count)
    tabCounts?: Record<string, number>;
}

// --- Helper Functions ---

const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const formatValue = (value: any, type: ColumnType = 'text', config: any = {}) => {
    if (value === null || value === undefined) return '-';

    switch (type) {
        case 'currency':
            return `Rs. ${Number(value).toLocaleString()}`;
        case 'number':
            return Number(value).toLocaleString();
        case 'date':
            try {
                return format(new Date(value), config.format || "MMM dd, yyyy");
            } catch (e) {
                return String(value);
            }
        case 'badge':
            return (
                <StatusBadge variant={String(value)} />
            );
        default:
            return String(value);
    }
};

const getActionConfig = (type?: RowActionType) => {
    switch (type) {
        case 'view':
            return { icon: Eye, className: "text-muted-foreground hover:text-foreground hover:bg-muted" };
        case 'edit':
            return { icon: Pencil, className: "text-amber-500 hover:text-amber-600 hover:bg-amber-500/10" };
        case 'delete':
            return { icon: Trash2, className: "text-destructive hover:text-destructive hover:bg-destructive/10" };
        case 'download':
            return { icon: Download, className: "text-secondary hover:text-secondary hover:bg-secondary/10" };
        default:
            return { icon: MoreHorizontal, className: "text-muted-foreground" };
    }
};

// --- Component ---

export function DataTable<T>({
    data,
    columns,
    isLoading,
    rowIdKey,
    title,
    description,
    headerActions,
    statsCards,
    sectionTitle,
    sectionDescription,
    filterConfig,
    tabsConfig,
    bulkActions,
    rowActions,
    pagination: externalPagination,
    onFilterChange,
    emptyTitle = "No data found",
    emptyDescription,
    emptyIcon,
    onRowClick,
    headerChildren,
    tabCounts: externalTabCounts,
}: DataTableProps<T>) {
    // Local State for Filtering & Sorting
    const [searchQuery, setSearchQuery] = useState("");
    const [activeSelectFilters, setActiveSelectFilters] = useState<Record<string, string>>({});
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [activeToggles, setActiveToggles] = useState<Record<string, boolean>>({});
    const [activeTab, setActiveTab] = useState(tabsConfig?.defaultValue || (tabsConfig?.items[0]?.value) || "all");

    // Internal Pagination State (if external not provided)
    const [internalPage, setInternalPage] = useState(1);
    const pageSize = externalPagination?.pageSize || 10;

    // Selection State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Column Visibility State
    const hideableColumns = columns.filter(c => c.hideable);
    const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());

    const toggleColumnVisibility = useCallback((header: string) => {
        setHiddenColumns(prev => {
            const next = new Set(prev);
            next.has(header) ? next.delete(header) : next.add(header);
            return next;
        });
    }, []);

    // Confirmation Modal State
    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        action: () => Promise<void> | void;
        isProcessing: boolean;
        variant?: 'destructive' | 'default' | 'info';
    }>({
        isOpen: false,
        title: "",
        description: "",
        action: () => { },
        isProcessing: false,
        variant: 'destructive'
    });

    // Update active tab if tabsConfig changes
    useEffect(() => {
        if (tabsConfig) {
            setActiveTab(current => {
                // If current tab is not in new config, reset to default
                const exists = tabsConfig.items.some(item => item.value === current);
                return exists ? current : (tabsConfig.defaultValue || tabsConfig.items[0]?.value || "all");
            });
        }
    }, [tabsConfig]);

    // --- Filtering Logic ---
    const processedData = data.filter((item: any) => {
        // 0. Tabs
        if (tabsConfig && activeTab !== 'all' && activeTab !== 'ALL') {
            const itemValue = getNestedValue(item, tabsConfig.valueKey);
            if (String(itemValue) !== activeTab) return false;
        }

        // 1. Search
        if (filterConfig?.search?.enabled && searchQuery) {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = filterConfig.search.searchFields.some(field => {
                const value = getNestedValue(item, field);
                return String(value || '').toLowerCase().includes(searchLower);
            });
            if (!matchesSearch) return false;
        }

        // 2. Select Filters
        for (const [key, value] of Object.entries(activeSelectFilters)) {
            if (value && value !== 'all') {
                const itemValue = getNestedValue(item, key);
                if (String(itemValue) !== value) return false;
            }
        }

        // 3. Date Range
        if (filterConfig?.dateRange?.enabled && dateRange?.from) {
            const itemDateStr = getNestedValue(item, filterConfig.dateRange.key);
            if (itemDateStr) {
                const itemDate = new Date(itemDateStr);
                const start = startOfDay(dateRange.from);
                const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
                if (!isWithinInterval(itemDate, { start, end })) return false;
            }
        }

        // 4. Toggles
        if (filterConfig?.toggles) {
            for (const toggle of filterConfig.toggles) {
                if (activeToggles[toggle.key]) {
                    if (toggle.filterFn) {
                        if (!toggle.filterFn(item)) return false;
                    } else {
                        // Default behavior: check if key is truthy
                        if (!getNestedValue(item, toggle.key)) return false;
                    }
                }
            }
        }

        return true;
    });

    // --- Sorting Logic ---
    const sortedData = [...processedData].sort((a: any, b: any) => {
        if (!sortConfig) return 0;

        const aValue = getNestedValue(a, sortConfig.key);
        const bValue = getNestedValue(b, sortConfig.key);

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // --- Pagination Logic ---
    const totalItems = sortedData.length;
    const isExternalPagination = !!externalPagination;
    const currentPage = isExternalPagination ? externalPagination.currentPage : internalPage;
    const totalPages = isExternalPagination ? externalPagination.totalPages : Math.ceil(totalItems / pageSize);

    // Slice data if internal pagination
    const displayData = isExternalPagination
        ? sortedData // External pagination handles slicing typically, but we might be filtering locally. 
        : sortedData.slice((internalPage - 1) * pageSize, internalPage * pageSize);

    // Reset page when filters change
    useEffect(() => {
        if (!isExternalPagination) setInternalPage(1);
    }, [searchQuery, activeSelectFilters, dateRange, activeToggles, activeTab, isExternalPagination]);

    // Fire onFilterChange whenever internal filter state changes
    useEffect(() => {
        if (!onFilterChange) return;
        onFilterChange({
            search: searchQuery || undefined,
            selects: Object.keys(activeSelectFilters).length > 0 ? activeSelectFilters : undefined,
            tab: activeTab !== 'all' ? activeTab : undefined,
            dateRange: dateRange,
            toggles: Object.keys(activeToggles).length > 0 ? activeToggles : undefined,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, activeSelectFilters, dateRange, activeTab, activeToggles]);


    // --- Handlers ---
    const handleSort = useCallback((key: string) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    }, []);

    const toggleSelectAll = useCallback(() => {
        if (selectedIds.length === displayData.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(displayData.map((item: any) => String(item[rowIdKey])));
        }
    }, [selectedIds, displayData, rowIdKey]);

    const toggleSelectRow = useCallback((id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    }, []);

    const executeAction = useCallback(async (action: () => Promise<void> | void) => {
        try {
            setConfirmation(prev => ({ ...prev, isProcessing: true }));
            await action();
        } finally {
            setConfirmation(prev => ({ ...prev, isProcessing: false, isOpen: false }));
        }
    }, []);

    const handleBulkAction = (action: BulkAction<T>) => {
        const selectedItems = data.filter((item: any) => selectedIds.includes(String(item[rowIdKey])));

        if (action.confirmation) {
            setConfirmation({
                isOpen: true,
                title: action.confirmation.title,
                description: action.confirmation.description,
                action: () => {
                    action.onClick(selectedItems);
                    setSelectedIds([]);
                },
                isProcessing: false
            });
        } else {
            action.onClick(selectedItems);
            setSelectedIds([]);
        }
    };

    const handleRowAction = (action: RowAction<T>, item: T) => {
        if (action.confirmation) {
            setConfirmation({
                isOpen: true,
                title: typeof action.confirmation.title === 'function' ? action.confirmation.title(item) : action.confirmation.title,
                description: typeof action.confirmation.description === 'function' ? action.confirmation.description(item) : action.confirmation.description,
                action: () => action.onClick(item),
                isProcessing: false,
                variant: action.type === 'delete' ? 'destructive' : 'default',
            });
        } else {
            action.onClick(item);
        }
    };

    const isAllSelected = displayData.length > 0 && selectedIds.length === displayData.length;

    // Tab counts — use externally provided counts, or compute from data
    const tabCounts = externalTabCounts || (tabsConfig?.showCount
        ? tabsConfig.items.reduce((acc, tab) => {
            const count = tab.value === 'all' || tab.value === 'ALL'
                ? data.length
                : data.filter((item: any) => String(getNestedValue(item, tabsConfig.valueKey)) === tab.value).length;
            acc[tab.value] = count;
            return acc;
        }, {} as Record<string, number>)
        : null);

    // Apply column visibility filter, then extend with rowActions if needed
    const displayColumns = [...columns].filter(col => !hiddenColumns.has(col.header));
    if (rowActions && rowActions.length > 0) {
        displayColumns.push({
            header: "Actions",
            type: "action",
            headerClassName: "text-right",
            className: "text-right",
            render: (item) => (
                <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <TooltipProvider>
                        {rowActions.map((action, idx) => {
                            if (action.show && !action.show(item)) return null;

                            const isDisabled = action.disabled ? action.disabled(item) : false;
                            const reason = action.disabledReason
                                ? (typeof action.disabledReason === 'function' ? action.disabledReason(item) : action.disabledReason)
                                : action.label;

                            const defaultConfig = getActionConfig(action.type);
                            const Icon = action.icon || defaultConfig.icon;
                            const className = cn("h-8 w-8 transition-colors", defaultConfig.className, action.className);

                            return (
                                <Tooltip key={idx}>
                                    <TooltipTrigger asChild>
                                        <div className="flex">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn(className, isDisabled && "opacity-30 grayscale hover:bg-transparent cursor-not-allowed")}
                                                disabled={isDisabled}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!isDisabled) handleRowAction(action, item);
                                                }}
                                            >
                                                <Icon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        className={cn(
                                            isDisabled
                                                ? "bg-card border border-destructive/20 text-destructive fill-card font-heading uppercase text-[10px] tracking-widest px-3 py-2 shadow-md"
                                                : ""
                                        )}
                                    >
                                        {isDisabled ? (
                                            <div className="flex items-center gap-2 py-0.5">
                                                <XCircle className="h-3.5 w-3.5 text-destructive/80" />
                                                <span className="font-bold">{reason}</span>
                                            </div>
                                        ) : action.label}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </TooltipProvider>
                </div>
            )
        });
    }

    return (
        <div className="space-y-6">
            {/* --- Page Header (Primary) --- */}
            {(title || headerActions) && (
                <PageHeader
                    title={title || ""}
                    subtitle={description}
                >
                    {headerActions}
                </PageHeader>
            )}

            {/* --- Header Children (e.g., report filter panels) --- */}
            {headerChildren && headerChildren}

            {/* --- Stats Cards (Optional) --- */}
            {statsCards && statsCards}

            {/* --- Glass Card: Section Heading + Table Content --- */}
            <div className="glass-card border-none p-6 space-y-4">
                {/* --- Section Heading (Secondary) --- */}
                {sectionTitle && (
                    <div className="flex flex-col gap-1 pb-4 border-b border-border">
                        <h3 className="text-lg font-bold font-heading uppercase tracking-wider">{sectionTitle}</h3>
                        {sectionDescription && (
                            <p className="text-sm text-muted-foreground">{sectionDescription}</p>
                        )}
                    </div>
                )}

                {/* --- Tabs (Optional) --- */}
                {tabsConfig && (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="w-full justify-start h-auto p-1 bg-muted/40">
                            {tabsConfig.items.map((tab) => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className="px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2"
                                >
                                    {tab.icon && <tab.icon className="h-4 w-4" />}
                                    {tab.label}
                                    {tabCounts && tabCounts[tab.value] !== undefined && (
                                        <span className={cn(
                                            "inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold min-w-[18px] transition-colors",
                                            activeTab === tab.value
                                                ? "bg-primary/20 text-primary"
                                                : "bg-muted text-muted-foreground"
                                        )}>
                                            {tabCounts[tab.value]}
                                        </span>
                                    )}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                )}

                {/* --- Toolbar --- */}
                {(filterConfig || bulkActions) && (
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                        {/* Filters */}
                        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center flex-wrap">

                            {/* Item count summary */}
                            {filterConfig && (
                                <p className="text-sm text-muted-foreground whitespace-nowrap">
                                    Showing <span className="font-bold text-foreground">{displayData.length}</span>
                                    {processedData.length !== data.length && (
                                        <> of <span className="font-bold text-foreground">{processedData.length}</span> filtered</>
                                    )}
                                    <> / <span className="font-bold text-foreground">{data.length}</span> total</>
                                </p>
                            )}

                            {/* Search */}

                            {filterConfig?.search?.enabled && (
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={filterConfig.search.placeholder || "Search..."}
                                        className="pl-8 bg-background border-border hover:border-border/80 focus:border-primary/50 transition-all font-medium"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            )}

                            {/* Selects */}
                            {filterConfig?.selects?.map((select) => (
                                <Select
                                    key={select.key}
                                    value={activeSelectFilters[select.key] || "all"}
                                    onValueChange={(val) => setActiveSelectFilters(prev => ({ ...prev, [select.key]: val }))}
                                >
                                    <SelectTrigger className="w-full sm:w-52 bg-background border-border font-medium hover:bg-muted transition-colors">
                                        <SelectValue placeholder={select.label} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All {select.label}</SelectItem>
                                        {select.options.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ))}

                            {/* Date Range */}
                            {filterConfig?.dateRange?.enabled && (
                                <DateRangePicker
                                    value={dateRange}
                                    onValueChange={setDateRange}
                                    className="w-full sm:w-[260px] bg-background border-border font-medium"
                                />
                            )}

                            {/* Clear Filters */}
                            {(searchQuery || Object.values(activeSelectFilters).some(v => v && v !== 'all') || dateRange || Object.values(activeToggles).some(v => v)) && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setActiveSelectFilters({});
                                        setDateRange(undefined);
                                        setActiveToggles({});
                                    }}
                                    title="Clear Filters"
                                    className="h-9 w-9 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {/* Toggles + Column Visibility */}
                        <div className="flex items-center gap-2">
                            {filterConfig?.toggles?.map(toggle => {
                                const Icon = toggle.icon;
                                const isActive = activeToggles[toggle.key];
                                return (
                                    <Button
                                        key={toggle.key}
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setActiveToggles(prev => ({ ...prev, [toggle.key]: !prev[toggle.key] }))}
                                        className={cn(
                                            "font-bold uppercase tracking-wider text-[10px] h-9 transition-all px-4 border",
                                            isActive
                                                ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground shadow-sm shadow-primary/20"
                                                : "bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        {Icon && <Icon className={cn("h-3.5 w-3.5 mr-2", isActive ? "text-primary-foreground" : "text-muted-foreground")} />}
                                        {isActive ? (toggle.activeLabel || toggle.label) : toggle.label}
                                    </Button>
                                );
                            })}

                            {/* Column Visibility Picker */}
                            {hideableColumns.length > 0 && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                "h-9 px-3 border font-bold uppercase tracking-wider text-[10px] transition-all",
                                                hiddenColumns.size > 0
                                                    ? "bg-primary/15 border-primary/30 hover:bg-primary/20 hover:text-dark"
                                                    : "bg-background border-border text-muted-foreground hover:bg-muted hover:text-dark"
                                            )}
                                        >
                                            <SlidersHorizontal className="h-3.5 w-3.5 mr-2" />
                                            Columns
                                            {hiddenColumns.size > 0 && (
                                                <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-accent/20 text-accent px-1.5 py-0.5 text-[10px] font-bold">
                                                    {hiddenColumns.size}
                                                </span>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44 bg-background/95 backdrop-blur-xl border-white/10">
                                        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Toggle Columns</DropdownMenuLabel>
                                        <DropdownMenuSeparator className="bg-white/5" />
                                        {hideableColumns.map((col) => (
                                            <DropdownMenuCheckboxItem
                                                key={col.header}
                                                checked={!hiddenColumns.has(col.header)}
                                                onCheckedChange={() => toggleColumnVisibility(col.header)}
                                                className="text-sm cursor-pointer"
                                            >
                                                {col.header}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                        {hiddenColumns.size > 0 && (
                                            <>
                                                <DropdownMenuSeparator className="bg-white/5" />
                                                <button
                                                    onClick={() => setHiddenColumns(new Set())}
                                                    className="w-full text-left text-[11px] text-muted-foreground hover:text-foreground px-2 py-1.5 transition-colors"
                                                >
                                                    Reset all
                                                </button>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>
                )}

                {/* --- Bulk Action Bar --- */}
                {selectedIds.length > 0 && bulkActions && (
                    <div className="flex items-center gap-2 p-2 px-4 rounded-lg bg-primary/5 border border-primary/10 animate-in fade-in slide-in-from-top-1">
                        <span className="text-sm font-medium text-primary mr-2">
                            {selectedIds.length} selected
                        </span>
                        <div className="h-4 w-[1px] bg-primary/20 mx-2" />
                        {bulkActions.map((action, idx) => (
                            <Button
                                key={idx}
                                variant={action.variant || "outline"}
                                size="sm"
                                onClick={() => handleBulkAction(action)}
                                className="h-8 text-xs gap-2"
                            >
                                {action.icon && <action.icon className="h-3.5 w-3.5" />}
                                {action.label}
                            </Button>
                        ))}
                    </div>
                )}

                {/* --- Table --- */}
                <div className="rounded-md border border-border bg-muted/5 overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : displayData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            {emptyIcon || <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />}
                            <h3 className="text-lg font-bold">{emptyTitle}</h3>
                            {emptyDescription && (
                                <p className="text-muted-foreground max-w-sm mt-2">
                                    {emptyDescription}
                                </p>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-muted/20">
                                <TableRow className="hover:bg-transparent border-border">
                                    {bulkActions && (
                                        <TableHead className="w-[40px]">
                                            <Checkbox
                                                checked={isAllSelected}
                                                onCheckedChange={toggleSelectAll}
                                            />
                                        </TableHead>
                                    )}
                                    {displayColumns.map((column, idx) => (
                                        <TableHead
                                            key={idx}
                                            className={cn(
                                                "font-heading uppercase text-xs font-bold tracking-wider",
                                                column.headerClassName
                                            )}
                                        >
                                            {column.sortable && column.accessorKey ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="-ml-3 h-8 group hover:bg-muted/50 hover:text-foreground transition-colors"
                                                    onClick={() => handleSort(column.accessorKey as string)}
                                                >
                                                    <span>{column.header}</span>
                                                    {sortConfig?.key === column.accessorKey ? (
                                                        <ArrowUpDown className={cn("ml-2 h-3 w-3 text-primary", sortConfig.direction === 'desc' && "rotate-180 transition-transform")} />
                                                    ) : (
                                                        <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground/30 group-hover:text-primary/70 transition-colors" />
                                                    )}
                                                </Button>
                                            ) : (
                                                column.header
                                            )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayData.map((item) => {
                                    const id = String(item[rowIdKey]);
                                    const isSelected = selectedIds.includes(id);

                                    return (
                                        <TableRow
                                            key={id}
                                            className={cn(
                                                "group hover:bg-muted/60 border-border transition-colors",
                                                isSelected && "bg-primary/10",
                                                onRowClick && "cursor-pointer"
                                            )}
                                            onClick={() => onRowClick && onRowClick(item)}
                                        >
                                            {bulkActions && (
                                                <TableCell onClick={(e) => e.stopPropagation()}>
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => toggleSelectRow(id)}
                                                    />
                                                </TableCell>
                                            )}
                                            {displayColumns.map((column, idx) => (
                                                <TableCell key={idx} className={column.className}>
                                                    {column.render ? (
                                                        column.render(item)
                                                    ) : (
                                                        formatValue(
                                                            column.accessorKey ? getNestedValue(item, String(column.accessorKey)) : null,
                                                            column.type,
                                                            { ...column, badgeConfig: column.badgeConfig }
                                                        )
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* --- Pagination --- */}
                {totalPages > 1 && (() => {
                    const pageSize2 = isExternalPagination ? (externalPagination.pageSize || 10) : pageSize;
                    const rangeStart = (currentPage - 1) * pageSize2 + 1;
                    const rangeEnd = Math.min(currentPage * pageSize2, isExternalPagination ? (externalPagination.totalPages * pageSize2) : totalItems);

                    // Build page numbers with ellipsis
                    const buildPages = (cur: number, total: number): (number | '...')[] => {
                        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
                        const pages: (number | '...')[] = [];
                        const showLeft = cur > 4;
                        const showRight = cur < total - 3;
                        pages.push(1);
                        if (showLeft) pages.push('...');
                        const rangeS = showLeft ? Math.max(2, cur - 1) : 2;
                        const rangeE = showRight ? Math.min(total - 1, cur + 1) : total - 1;
                        for (let i = rangeS; i <= rangeE; i++) pages.push(i);
                        if (showRight) pages.push('...');
                        pages.push(total);
                        return pages;
                    };

                    const pages = buildPages(currentPage, totalPages);
                    const goTo = (p: number) => isExternalPagination
                        ? externalPagination.onPageChange(p)
                        : setInternalPage(p);

                    return (
                        <div className="flex items-center justify-between pt-4 border-t border-border">
                            <p className="text-sm text-muted-foreground">
                                Page <span className="font-bold text-foreground">{currentPage}</span> of{" "}
                                <span className="font-bold text-foreground">{totalPages}</span>
                                {!isExternalPagination && (
                                    <> &nbsp;·&nbsp; <span className="font-bold text-foreground">{rangeStart}–{Math.min(rangeEnd, totalItems)}</span> of <span className="font-bold text-foreground">{totalItems}</span></>
                                )}
                            </p>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => goTo(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="h-8 w-8 p-0 bg-background border border-border text-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                                >
                                    ‹
                                </Button>
                                {pages.map((p, i) =>
                                    p === '...' ? (
                                        <span key={`dots-${i}`} className="h-8 w-8 flex items-center justify-center text-muted-foreground text-sm">…</span>
                                    ) : (
                                        <Button
                                            key={p}
                                            variant={p === currentPage ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => goTo(p as number)}
                                            className={cn(
                                                "h-8 w-8 p-0 text-sm font-medium transition-all border",
                                                p === currentPage
                                                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 shadow-sm shadow-primary/20"
                                                    : "bg-background border-border text-foreground hover:bg-muted hover:text-foreground"
                                            )}
                                        >
                                            {p}
                                        </Button>
                                    )
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => goTo(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="h-8 w-8 p-0 bg-background border border-border text-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                                >
                                    ›
                                </Button>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* --- Internal Confirmation Modal --- */}
            <ConfirmationModal
                isOpen={confirmation.isOpen}
                onOpenChange={(open) => {
                    if (!open && confirmation.isProcessing) return;
                    setConfirmation(prev => ({ ...prev, isOpen: open }));
                }}
                title={confirmation.title}
                description={confirmation.description}
                onConfirm={() => executeAction(confirmation.action)}
                isDeleting={confirmation.isProcessing}
                variant={confirmation.variant}
            />
        </div>

    );
}
