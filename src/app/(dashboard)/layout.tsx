"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    CreditCard,
    Users,
    Settings,
    Menu,
    LogOut,
    ChevronDown,
    Armchair,
    FileText,
    UserCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ThemeToggleSimple } from "@/components/layout/ThemeToggle";
import { useAuthStore } from "@/stores/authStore";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { OfflineIndicator } from "@/components/layout/offline-indicator";
import { GlobalSearch } from "@/components/layout/global-search";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Logo } from "@/components/ui/logo";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarRail,
    SidebarTrigger
} from "@/components/ui/sidebar";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Orders", href: "/orders", icon: ShoppingCart },
    { name: "Inventory", href: "/inventory", icon: Package },
    { name: "Payments", href: "/payments", icon: CreditCard },
    { name: "Clients", href: "/clients", icon: Users },
    { name: "Fabric & Furniture", href: "/types", icon: Armchair },
    { name: "Reports", href: "/reports", icon: FileText },
];

const adminNavigation = [
    { name: "User Management", href: "/users", icon: UserCircle },
    { name: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, setUser, logout } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasHydrated, setHasHydrated] = useState(false);

    useEffect(() => {
        setHasHydrated(true);
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch("/api/auth/me");
                const result = await response.json();
                if (result.success) {
                    setUser(result.data);
                } else {
                    router.push("/login");
                }
            } catch (error) {
                router.push("/login");
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();

        // Register Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(registration => {
                    console.log('SW registered: ', registration);
                }).catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
            });
        }
    }, [setUser, router]);

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            logout();
            router.push("/login");
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Logo size={48} className="animate-pulse" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    const isAdmin = user?.role === "Admin";

    const NavLinks = ({ mobile = false }: { mobile?: boolean }) => {
        if (!hasHydrated) return <div className="animate-pulse space-y-4 px-4 pt-4"><div className="h-10 bg-muted/20 rounded-sm" /><div className="h-10 bg-muted/20 rounded-sm" /><div className="h-10 bg-muted/20 rounded-sm" /></div>;

        return (
            <>
                <div className="space-y-1.5">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => mobile && setSidebarOpen(false)}
                                className={cn(
                                    "group flex items-center gap-3.5 px-4 py-3 rounded-sm text-sm font-bold transition-all duration-300 relative overflow-hidden",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 glow-primary"
                                        : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                )}
                            >
                                <item.icon className={cn(
                                    "h-5 w-5 transition-transform duration-300",
                                    !isActive && "group-hover:scale-110 group-hover:-rotate-6",
                                    isActive && "scale-110"
                                )} />
                                <span className="tracking-tight">{item.name}</span>
                            </Link>
                        );
                    })}
                </div>

                {isAdmin && (
                    <>
                        <div className="my-8 px-4">
                            <div className="h-[1px] bg-linear-to-r from-transparent via-muted-foreground/20 to-transparent" />
                        </div>
                        <div className="space-y-1.5">
                            <p className="px-5 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3 opacity-60">
                                Management
                            </p>
                            {adminNavigation.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => mobile && setSidebarOpen(false)}
                                        className={cn(
                                            "group flex items-center gap-3.5 px-4 py-3 rounded-sm text-sm font-bold transition-all duration-300 relative overflow-hidden",
                                            isActive
                                                ? "bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20 glow-secondary"
                                                : "text-muted-foreground hover:bg-secondary/10 hover:text-secondary"
                                        )}
                                    >
                                        <item.icon className={cn(
                                            "h-5 w-5 transition-transform duration-300",
                                            !isActive && "group-hover:scale-110 group-hover:rotate-6",
                                            isActive && "scale-110"
                                        )} />
                                        <span className="tracking-tight">{item.name}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </>
                )}
            </>
        );
    };

    return (
        <SidebarProvider defaultOpen={true}>
            <div className="flex min-h-screen bg-background w-full">
                {/* Modern Modular Sidebar */}
                <Sidebar variant="glass" collapsible="icon">
                    <SidebarHeader className="py-8 transition-all duration-500 group-data-[collapsible=icon]:py-6">
                        <div className="flex items-center gap-3 px-4 transition-all duration-500 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
                            <Logo size={42} className="hover-scale shrink-0" />
                            <div className="flex flex-col transition-all duration-500 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:hidden overflow-hidden">
                                <span className="font-heading font-black text-xl tracking-tighter text-primary truncate leading-none">
                                    WoodLedger
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1 truncate opacity-60">
                                    Enterprise
                                </span>
                            </div>
                        </div>
                    </SidebarHeader>

                    <SidebarContent className="px-3 gap-6">
                        <SidebarGroup>
                            <SidebarGroupLabel className="px-3">Main Menu</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu className="gap-1.5">
                                    {navigation.map((item) => {
                                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                                        return (
                                            <SidebarMenuItem key={item.name}>
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={isActive}
                                                    tooltip={item.name}
                                                    className={cn(
                                                        "group h-12 px-3 transition-all duration-300 rounded-sm font-bold",
                                                        isActive
                                                            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-lg shadow-primary/20 glow-primary hover:bg-sidebar-accent/90"
                                                            : "text-muted-foreground hover:bg-sidebar-accent/10 hover:text-sidebar-accent-foreground"
                                                    )}
                                                >
                                                    <Link href={item.href} className="group-data-[collapsible=icon]:gap-0">
                                                        <item.icon className={cn(
                                                            "h-5 w-5 transition-transform duration-300",
                                                            isActive ? "scale-110 -rotate-3" : "group-hover/menu-item:scale-110 group-hover/menu-item:-rotate-6"
                                                        )} />
                                                        <span className="tracking-tight transition-all duration-500 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:hidden overflow-hidden">{item.name}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        {isAdmin && (
                            <SidebarGroup>
                                <SidebarGroupLabel className="px-3">Management</SidebarGroupLabel>
                                <SidebarGroupContent>
                                    <SidebarMenu className="gap-1.5">
                                        {adminNavigation.map((item) => {
                                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                                            return (
                                                <SidebarMenuItem key={item.name}>
                                                    <SidebarMenuButton
                                                        asChild
                                                        isActive={isActive}
                                                        tooltip={item.name}
                                                        className={cn(
                                                            "group h-12 px-3 transition-all duration-300 rounded-sm font-bold",
                                                            isActive
                                                                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-lg shadow-primary/20 glow-primary hover:bg-sidebar-accent/90"
                                                                : "text-muted-foreground hover:bg-sidebar-accent/10 hover:text-sidebar-accent-foreground"
                                                        )}
                                                    >
                                                        <Link href={item.href} className="group-data-[collapsible=icon]:gap-0">
                                                            <item.icon className={cn(
                                                                "h-5 w-5 transition-transform duration-300",
                                                                isActive ? "scale-110 rotate-3" : "group-hover/menu-item:scale-110 group-hover/menu-item:rotate-6"
                                                            )} />
                                                            <span className="tracking-tight transition-all duration-500 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:hidden overflow-hidden">{item.name}</span>
                                                        </Link>
                                                    </SidebarMenuButton>
                                                </SidebarMenuItem>
                                            );
                                        })}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        )}
                    </SidebarContent>

                    <SidebarFooter className="p-4 transition-all duration-500 group-data-[collapsible=icon]:p-0">
                        <div className="flex items-center gap-3 p-3 rounded-sm bg-primary/5 border border-primary/10 transition-all hover:bg-primary/10 group overflow-hidden group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:gap-0">
                            <Avatar className="h-10 w-10 border-2 border-primary/20 shrink-0 shadow-sm transition-transform group-hover:scale-105">
                                <AvatarFallback className="bg-primary text-primary-foreground font-black text-xs">
                                    {user?.name?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col flex-1 min-w-0 transition-all duration-500 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:hidden overflow-hidden">
                                <p className="text-sm font-bold truncate tracking-tight text-primary/90">{user?.name}</p>
                                <p className="text-[8px] font-medium uppercase tracking-widest text-muted-foreground truncate opacity-60 leading-none mt-1">{user?.role}</p>
                            </div>
                        </div>
                    </SidebarFooter>
                    <SidebarRail />
                </Sidebar>

                {/* Mobile sidebar placeholder - handled by SidebarProvider sheet automatically if integrated properly, 
                    but we keep our Sheet for backward compatibility if needed, though modular Sidebar handles it usually. */}

                {/* Main content area */}
                <div className="flex-1 flex flex-col min-h-screen min-w-0">
                    {/* Top header - Enhanced glassmorphism */}
                    <header className="sticky top-0 z-40 flex h-20 items-center gap-4 border-b bg-background/40 dark:bg-zinc-950/40 backdrop-blur-3xl px-4 lg:px-8 border-primary/10">
                        <div className="flex items-center gap-2">
                            <SidebarTrigger className="h-10 w-10 hover-scale bg-muted/20 border border-muted/50 rounded-sm text-primary" />
                            <div className="h-8 w-[1px] bg-muted/50 mx-2 lg:hidden" />
                            <div className="flex items-center gap-2 lg:hidden">
                                <Logo size={32} />
                            </div>
                        </div>

                        <div className="flex-1 max-w-lg hidden md:block">
                            <GlobalSearch />
                        </div>
                        <div className="flex-1" />

                        {/* Right side actions - Premium placement */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 p-1 bg-muted/30 rounded-sm border border-muted/50 backdrop-blur-xl">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="hover-scale"><OfflineIndicator /></div>
                                        </TooltipTrigger>
                                        <TooltipContent>Network Status</TooltipContent>
                                    </Tooltip>

                                    <ThemeToggleSimple />

                                    <NotificationCenter userId={user?.id} />
                                </TooltipProvider>
                            </div>

                            <div className="h-8 w-[1px] bg-muted/50 mx-1 hidden sm:block" />

                            {/* User dropdown - Modernized */}
                            {!hasHydrated ? (
                                <div className="h-10 w-32 bg-muted/20 animate-pulse rounded-sm" />
                            ) : (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-12 flex items-center gap-3 px-3 rounded-sm hover:bg-primary/10 hover:text-dark transition-all border border-transparent hover:border-primary/20 group">
                                            <div className="relative">
                                                <Avatar className="h-9 w-9 border-2 border-primary group-hover:border-primary transition-all">
                                                    <AvatarFallback className="bg-primary/10 text-dark font-bold">
                                                        {user?.name?.charAt(0) || "U"}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </div>
                                            <div className="flex flex-col items-start hidden lg:flex">
                                                <span className="text-sm font-bold leading-none tracking-tight">{user?.name}</span>
                                                <span className="text-[8px] font-medium text-muted-foreground uppercase tracking-widest mt-1 opacity-60 leading-none">{user?.role}</span>
                                            </div>
                                            <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-64 p-2 rounded-sm glass-card border-none shadow-2xl">
                                        <DropdownMenuLabel className="p-3">
                                            <div className="flex flex-col gap-0">
                                                <span className="text-base font-bold tracking-tight">{user?.name}</span>
                                                <span className="text-xs font-medium text-muted-foreground opacity-60">{user?.email}</span>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator className="bg-muted/50 mx-1" />
                                        <div className="p-1 space-y-1">
                                            <DropdownMenuItem asChild className="rounded-sm h-11 px-3 cursor-pointer">
                                                <Link href="/settings/profile" className="flex items-center gap-3">
                                                    <UserCircle className="h-4 w-4 text-primary" />
                                                    <span className="font-bold text-sm">Profile Details</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild className="rounded-sm h-11 px-3 cursor-pointer">
                                                <Link href="/settings" className="flex items-center gap-3">
                                                    <Settings className="h-4 w-4 text-primary" />
                                                    <span className="font-bold text-sm">System Settings</span>
                                                </Link>
                                            </DropdownMenuItem>
                                        </div>
                                        <DropdownMenuSeparator className="bg-muted/50 mx-1" />
                                        <div className="p-1">
                                            <DropdownMenuItem onClick={handleLogout} className="rounded-sm h-11 px-3 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                <LogOut className="h-4 w-4 text-dark" />
                                                <span className="font-bold text-sm">Logout Securely</span>
                                            </DropdownMenuItem>
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </header>

                    {/* Page content */}
                    <main className="flex-grow bg-linear-to-b from-background to-muted/10">
                        <div className="mx-auto space-y-8 min-h-full">
                            {children}
                        </div>
                    </main>
                </div>
            </div >
        </SidebarProvider >
    );
}
