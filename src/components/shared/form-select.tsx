"use client";

import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Control, FieldPath, FieldValues } from "react-hook-form";
import { ReactNode } from "react";

interface FormSelectProps<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
    control: Control<TFieldValues>;
    name: TName;
    label: string;
    placeholder?: string;
    options: { label: string; value: string; imageUrl?: string | null }[];
    description?: string;
    containerClassName?: string;
    className?: string;
    disabled?: boolean;
    icon?: ReactNode;
}

export function FormSelect<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
    control,
    name,
    label,
    placeholder,
    options,
    description,
    containerClassName,
    className,
    disabled,
    icon,
}: FormSelectProps<TFieldValues, TName>) {
    return (
        <FormField
            control={control}
            name={name}
            render={({ field, fieldState }) => (
                <FormItem className={cn("flex flex-col", containerClassName)}>
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">
                        <div className="flex items-center gap-2">
                            {icon && <span className="text-muted-foreground">{icon}</span>}
                            {label}
                        </div>
                    </FormLabel>
                    <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={disabled}
                    >
                        <FormControl>
                            <SelectTrigger
                                className={cn(
                                    "bg-background border-input shadow-xs hover:border-ring/50 hover:bg-accent/10 hover:text-foreground focus:ring-2 focus:ring-ring/50 transition-all font-medium h-10",
                                    fieldState.error && "border-destructive focus:ring-destructive/50",
                                    className
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <SelectValue placeholder={placeholder || `Select ${label.toLowerCase()}`} />
                                </div>
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass-card">
                            {options.map((option) => (
                                <SelectItem key={option.value} value={option.value} className="focus:bg-accent focus:text-accent-foreground cursor-pointer transition-colors py-2.5">
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
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {description && <FormDescription>{description}</FormDescription>}
                    <FormMessage className="text-[10px] font-bold uppercase tracking-tight text-destructive ml-1" />
                </FormItem>
            )}
        />
    );
}
