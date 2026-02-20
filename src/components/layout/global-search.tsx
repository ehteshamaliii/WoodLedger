"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    Calculator,
    Calendar,
    CreditCard,
    Search,
    Settings,
    Smile,
    User,
    Package,
    ShoppingCart,
} from "lucide-react";

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command";

export function GlobalSearch() {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center rounded-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 border border-muted/50 bg-muted/20 hover:bg-primary/10 hover:border-primary/30 hover:text-primary text-muted-foreground relative w-full justify-start text-sm shadow-sm backdrop-blur-md h-10 px-3 py-2 sm:pr-12 md:w-40 lg:w-64 group"
            >
                <Search className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                <span className="opacity-50 group-hover:opacity-100 transition-opacity">Search...</span>
                <kbd className="pointer-events-none absolute right-2 top-2 hidden h-6 select-none items-center gap-1 rounded-[2px] border border-muted/50 bg-background/50 px-1.5 font-mono text-[10px] font-bold text-muted-foreground opacity-70 sm:flex shadow-sm group-hover:border-primary/20 group-hover:text-primary/70 transition-colors">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Type a command or search..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup heading="Suggestions">
                        <CommandItem onSelect={() => runCommand(() => router.push("/orders/new"))}>
                            <ShoppingCart className=" h-4 w-4" />
                            <span>Create New Order</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/inventory/new"))}>
                            <Package className=" h-4 w-4" />
                            <span>Add Stock Item</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/payments/new"))}>
                            <CreditCard className=" h-4 w-4" />
                            <span>Record Payment</span>
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Navigation">
                        <CommandItem onSelect={() => runCommand(() => router.push("/orders"))}>
                            <ShoppingCart className=" h-4 w-4" />
                            <span>Orders</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/inventory"))}>
                            <Package className=" h-4 w-4" />
                            <span>Inventory</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/clients"))}>
                            <User className=" h-4 w-4" />
                            <span>Clients</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push("/payments"))}>
                            <CreditCard className=" h-4 w-4" />
                            <span>Payments</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
}
