"use client";

import { useConnectivity } from "@/providers/connectivity-provider";
import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function OfflineIndicator() {
    const { isOnline } = useConnectivity();

    if (isOnline) {
        return (
            <Badge variant="outline" className="text-[10px] gap-1.5 border-secondary/20 bg-secondary/10 text-secondary-foreground dark:text-secondary font-bold uppercase tracking-wider h-6">
                <Wifi className="h-3 w-3" />
                Online
            </Badge>
        );
    }

    return (
        <Badge variant="outline" className="text-[10px] gap-1.5 animate-pulse font-bold uppercase tracking-wider h-6 border-accent/20 bg-accent/10 text-accent outline-accent/40">
            <WifiOff className="h-3 w-3" />
            Offline Mode
        </Badge>
    );
}
