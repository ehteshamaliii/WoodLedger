"use client";

import * as React from "react";
import { X, Check, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface Option {
    label: string;
    value: string;
    imageUrl?: string | null;
}

interface MultiSelectProps {
    options: Option[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    className?: string;
}

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = "Select options...",
    className,
}: MultiSelectProps) {
    const [open, setOpen] = React.useState(false);

    const handleUnselect = (value: string) => {
        onChange(selected.filter((s) => s !== value));
    };

    const handleSelect = (value: string) => {
        if (selected.includes(value)) {
            onChange(selected.filter((s) => s !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between min-h-10 h-auto py-1 px-3 bg-background border-input shadow-xs hover:bg-accent/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 transition-all font-medium",
                        className
                    )}
                >
                    <div className="flex gap-1 flex-wrap items-center">
                        {selected.length > 0 ? (
                            selected.map((value) => {
                                const option = options.find((o) => o.value === value);
                                return (
                                    <Badge
                                        key={value}
                                        variant="secondary"
                                        className="rounded-sm px-2 py-0.5 font-medium bg-accent/20 text-accent border-accent/30 hover:bg-accent/30 transition-colors shadow-sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleUnselect(value);
                                        }}
                                    >
                                        {option?.label}
                                        <X className="ml-1.5 h-3 w-3 text-accent/70 hover:text-accent transition-colors cursor-pointer" />
                                    </Badge>
                                );
                            })
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0 glass-card border-white/10"
                align="start"
            >
                <Command className="bg-transparent">
                    <CommandInput placeholder="Search..." className="h-9 border-none focus:ring-0" />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto p-1">
                            {options.map((option) => {
                                const isSelected = selected.includes(option.value);
                                return (
                                    <CommandItem
                                        key={option.value}
                                        onSelect={() => handleSelect(option.value)}
                                        className="flex items-center justify-between px-2 py-2 cursor-pointer rounded-sm aria-selected:bg-accent/50 aria-selected:text-accent-foreground"
                                    >
                                        <div className="flex items-center gap-3">
                                            {option.imageUrl !== undefined && (
                                                <div className="h-8 w-8 rounded-sm overflow-hidden border border-border shadow-sm shrink-0 flex items-center justify-center bg-muted">
                                                    {option.imageUrl ? (
                                                        <img
                                                            src={option.imageUrl}
                                                            alt={option.label}
                                                            className="h-full w-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                e.currentTarget.parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground opacity-50 h-4 w-4"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>';
                                                            }}
                                                        />
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground opacity-50 h-4 w-4"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>
                                                    )}
                                                </div>
                                            )}
                                            <span className="font-medium">{option.label}</span>
                                        </div>
                                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
