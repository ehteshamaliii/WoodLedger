import * as React from "react";
import { format, getMonth, getYear, setMonth, setYear } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface DatePickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    placeholder?: string;
    className?: string;
}

export function DatePicker({
    date,
    setDate,
    placeholder = "Pick a date",
    className,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false);
    const [month, setMonthState] = React.useState<Date | undefined>(date);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        if (date) {
            setMonthState(date);
        } else {
            setMonthState(new Date());
        }
    }, [date]);

    if (!mounted) {
        return (
            <Button
                variant={"outline"}
                className={cn(
                    "w-full justify-start text-left font-normal bg-background border-input shadow-xs h-10 py-0 px-3",
                    className
                )}
                disabled
            >
                <CalendarIcon className="h-4 w-4 text-primary opacity-80 shrink-0 mr-2" />
                <span>{placeholder}</span>
            </Button>
        );
    }

    const currentMonth = month || new Date();

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => currentYear - 50 + i);

    const handleMonthChange = (monthIndex: string) => {
        const newMonth = setMonth(currentMonth, parseInt(monthIndex));
        setMonthState(newMonth);
    };

    const handleYearChange = (year: string) => {
        const newMonth = setYear(currentMonth, parseInt(year));
        setMonthState(newMonth);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal bg-background border-input shadow-xs hover:bg-accent/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 transition-[color,box-shadow] h-10 py-0 px-3",
                        !date && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="h-4 w-4 text-primary opacity-80 shrink-0 mr-2" />
                    {date ? format(date, "PPP") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 glass-card border-white/10" align="start">
                <div className="flex items-center justify-between p-3 border-b border-white/5 space-x-2">
                    <Select
                        value={getMonth(currentMonth).toString()}
                        onValueChange={handleMonthChange}
                    >
                        <SelectTrigger className="w-[120px] h-8 bg-transparent border-white/10 hover:bg-accent/20">
                            <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                            {months.map((m, index) => (
                                <SelectItem key={m} value={index.toString()}>
                                    {m}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={getYear(currentMonth).toString()}
                        onValueChange={handleYearChange}
                    >
                        <SelectTrigger className="w-[90px] h-8 bg-transparent border-white/10 hover:bg-accent/20">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                            <div className="max-h-[200px] overflow-y-auto">
                                {years.map((year) => (
                                    <SelectItem key={year} value={year.toString()}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </div>
                        </SelectContent>
                    </Select>
                </div>
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                        setDate(newDate);
                        setOpen(false);
                    }}
                    month={currentMonth}
                    onMonthChange={setMonthState}
                    initialFocus
                    className="p-3"
                />
            </PopoverContent>
        </Popover>
    );
}
