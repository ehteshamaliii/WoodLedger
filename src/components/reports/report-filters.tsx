"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { addDays, startOfMonth, endOfMonth } from "date-fns";
import { Filter, RotateCcw, FileDown } from "lucide-react";

export type ReportFilterValues = {
    dateRange: { from: Date; to: Date } | undefined;
    category: string;
};

interface ReportFiltersProps {
    onFilter: (values: ReportFilterValues) => void;
    categories: { label: string; value: string }[];
    isLoading?: boolean;
}

export function ReportFilters({ onFilter, categories, isLoading }: ReportFiltersProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const form = useForm<ReportFilterValues>({
        defaultValues: {
            dateRange: {
                from: startOfMonth(new Date()),
                to: endOfMonth(new Date()),
            },
            category: "ALL",
        }
    });

    if (!mounted) {
        return (
            <div className="flex flex-col md:flex-row items-end gap-4 p-6 bg-card border rounded-sm shadow-sm h-[100px] animate-pulse" />
        );
    }

    const handleReset = () => {
        form.reset({
            dateRange: {
                from: startOfMonth(new Date()),
                to: endOfMonth(new Date()),
            },
            category: "ALL",
        });
        onFilter(form.getValues());
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onFilter)} className="flex flex-col md:flex-row items-end gap-4 p-6 bg-card border rounded-sm shadow-sm">
                <FormField
                    control={form.control}
                    name="dateRange"
                    render={({ field }) => (
                        <FormItem className="flex-1">
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground ">Date Range</FormLabel>
                            <FormControl>
                                <DateRangePicker
                                    value={field.value}
                                    onValueChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem className="w-full md:w-[200px]">
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger className="h-10 bg-background/50">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
                />

                <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading} className="h-10 font-bold px-6" variant="secondary" size="sm">
                        <Filter className="h-4 w-4 " />
                        Generate
                    </Button>
                    <Button type="button" variant="outline" size="icon" onClick={handleReset} className="h-10 w-10">
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>
            </form>
        </Form>
    );
}
