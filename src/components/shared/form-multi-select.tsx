"use client";

import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import { cn } from "@/lib/utils";
import { Control, FieldPath, FieldValues } from "react-hook-form";
import { ReactNode } from "react";

interface FormMultiSelectProps<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
    control: Control<TFieldValues>;
    name: TName;
    label: string;
    placeholder?: string;
    options: Option[];
    description?: string;
    containerClassName?: string;
    className?: string;
    disabled?: boolean;
    icon?: ReactNode;
}

export function FormMultiSelect<
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
}: FormMultiSelectProps<TFieldValues, TName>) {
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
                    <FormControl>
                        <MultiSelect
                            options={options}
                            selected={field.value || []}
                            onChange={field.onChange}
                            placeholder={placeholder || `Select ${label.toLowerCase()}`}
                            className={cn(
                                fieldState.error && "border-destructive focus:ring-destructive/50",
                                className
                            )}
                        />
                    </FormControl>
                    {description && <FormDescription>{description}</FormDescription>}
                    <FormMessage className="text-[10px] font-bold uppercase tracking-tight text-destructive ml-1" />
                </FormItem>
            )}
        />
    );
}
