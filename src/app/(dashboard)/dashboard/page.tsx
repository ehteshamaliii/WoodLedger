"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import {
    Package,
    Plus,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";


import { DynamicDashboard } from "@/components/dashboard/dynamic-dashboard";
import { Layout, X, RotateCcw } from "lucide-react";

export default function DashboardPage() {
    const { user } = useAuthStore();
    const { toast } = useToast();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const fetchData = async () => {
        try {
            const res = await fetch("/api/dashboard/stats");
            const result = await res.json();
            if (result.success) {
                setData(result.data);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load dashboard data.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAiSuggestions = async () => {
        try {
            setIsAnalyzing(true);
            const res = await fetch("/api/ai/pricing-suggestions");
            const result = await res.json();
            if (result.success) {
                setAiSuggestions(result.data);
                toast({
                    title: "AI Analysis Complete",
                    description: "Smart pricing suggestions updated.",
                });
            }
        } catch (error) {
            toast({
                title: "AI Error",
                description: "Failed to generate suggestions.",
                variant: "destructive",
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSaveLayout = async (widgets: any[]) => {
        try {
            const res = await fetch("/api/dashboard/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ widgets }),
            });
            const result = await res.json();
            if (result.success) {
                toast({
                    title: "Layout Saved",
                    description: "Your personalized dashboard has been updated.",
                });
            }
        } catch (error) {
            toast({
                title: "Save Failed",
                description: "Failed to persist dashboard configuration.",
                variant: "destructive",
            });
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="h-[70vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse">Gathering business insights...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    // Role-based visibility
    const isSales = user?.role === "Sales" || user?.role === "Admin";
    const isInventory = user?.role === "Inventory" || user?.role === "Admin";

    return (
        <div className="p-4 md:p-8 pt-6 space-y-10 page-enter">
            {/* Header with Quick Actions & Edit Toggle */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold tracking-tight font-heading bg-linear-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                        Dashboard
                    </h1>
                    <p className="text-muted-foreground text-sm flex items-center gap-2 sm:text-base">
                        Welcome back, <span className="font-bold text-primary">{user?.name}</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span className="text-xs uppercase tracking-widest font-bold opacity-60">System Online</span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Dashboard Controls */}
                    <div className="flex bg-muted/30 p-1 rounded-sm border">
                        <Button
                            variant={isEditing ? "secondary" : "ghost"}
                            size="sm"
                            className={cn("h-8 md:px-3 !p-2 rounded-sm font-bold md:text-[10px] text-[0px] uppercase tracking-widest transition-all gap-0 md:gap-2", isEditing && "shadow-sm")}
                            onClick={() => setIsEditing(!isEditing)}
                        >
                            {isEditing ? (
                                <>
                                    <X className="h-3.5 w-3.5" />
                                    Close Editor
                                </>
                            ) : (
                                <>
                                    <Layout className="h-3.5 w-3.5" />
                                    Edit Layout
                                </>
                            )}
                        </Button>
                    </div>

                    {!isEditing ? (
                        <div className="flex gap-3 animate-in fade-in slide-in-from-right-4 duration-500">
                            {isSales && (
                                <Link href="/orders/create">
                                    <Button variant="secondary" size="lg" className="h-11 px-6 rounded-sm font-bold shadow-lg shadow-secondary/10 hover-scale group">
                                        <Plus className="h-5 w-5 bg-secondary-foreground/10 rounded-md p-0.5 group-hover:rotate-90 transition-transform" />
                                        New Order
                                    </Button>
                                </Link>
                            )}
                            {isInventory && (
                                <Link href="/inventory">
                                    <Button size="lg" variant="outline" className="h-11 px-6 rounded-sm font-bold bg-background/50 backdrop-blur shadow-sm hover-scale">
                                        <Package className="h-5 w-5 opacity-60" />
                                        Add Stock
                                    </Button>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="flex gap-3 animate-in fade-in slide-in-from-right-4 duration-500">
                            <Button
                                variant="outline"
                                size="lg"
                                className="h-11 px-6 rounded-sm font-bold opacity-50 hover:opacity-100"
                                onClick={() => window.location.reload()}
                            >
                                <RotateCcw className="h-4 w-4" />
                                Reset Current
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Dynamic Dashboard Grid */}
            <DynamicDashboard
                data={data}
                isEditing={isEditing}
                aiSuggestions={aiSuggestions}
                isAnalyzing={isAnalyzing}
                onFetchAiSuggestions={fetchAiSuggestions}
                onSaveLayout={handleSaveLayout}
            />
        </div >
    );
}
