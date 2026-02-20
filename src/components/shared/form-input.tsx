"use client";

import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ComponentProps, ReactNode } from "react";
import { Control, FieldPath, FieldValues } from "react-hook-form";

interface FormInputProps<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends Omit<ComponentProps<"input">, "name" | "form" | "defaultValue"> {
    control: Control<TFieldValues>;
    name: TName;
    label?: string;
    description?: string;
    containerClassName?: string;
    icon?: ReactNode;
    type?: string;
    textareaProps?: ComponentProps<typeof Textarea>;
}

export function FormInput<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
    control,
    name,
    label,
    description,
    containerClassName,
    className,
    icon,
    type,
    textareaProps,
    ...props
}: FormInputProps<TFieldValues, TName>) {
    return (
        <FormField
            control={control}
            name={name}
            render={({ field, fieldState }) => (
                <FormItem className={cn("flex flex-col", containerClassName)}>
                    {label && (
                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">
                            {label}
                        </FormLabel>
                    )}
                    <FormControl>
                        {type === "textarea" ? (
                            <Textarea
                                {...field}
                                {...textareaProps}
                                className={cn(
                                    "bg-background border-input shadow-xs hover:border-ring/50 hover:bg-accent/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 transition-all font-medium min-h-[100px]",
                                    fieldState.error && "border-destructive focus-visible:ring-destructive/50",
                                    className
                                )}
                            />
                        ) : (
                            <div className="relative">
                                {icon && (
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                                        {icon}
                                    </div>
                                )}
                                <Input
                                    {...field}
                                    {...props}
                                    type={type}
                                    className={cn(
                                        "bg-background border-input shadow-xs hover:border-ring/50 hover:bg-accent/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 transition-all font-medium h-10",
                                        icon && "pl-10",
                                        fieldState.error && "border-destructive focus-visible:ring-destructive/50",
                                        className
                                    )}
                                    onChange={(e) => {
                                        const val = type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value;
                                        field.onChange(val);
                                        props.onChange?.(e);
                                    }}
                                />
                            </div>
                        )}
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold uppercase tracking-tight text-destructive ml-1" />
                </FormItem>
            )}
        />
    );
}
