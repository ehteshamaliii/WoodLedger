"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAuthStore } from "@/stores/authStore";
import { Logo } from "@/components/ui/logo";

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get("redirect") || "/dashboard";
    const { setUser } = useAuthStore();

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setError(null);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!result.success) {
                setError(result.error || "Login failed");
                return;
            }

            setUser(result.data);
            router.push(redirect);
            router.refresh();
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
        }
    };

    return (
        <div className="w-full max-w-md page-enter">
            <div className="flex flex-col items-center justify-center gap-4 mb-10">
                <Logo size={80} className="hover-scale" />
                <div className="text-center">
                    <h1 className="text-4xl font-heading font-bold tracking-tight text-primary">
                        WoodLedger
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1">Premium Furniture Management</p>
                </div>
            </div>

            <Card className="glass-card !p-0 overflow-hidden border-none">
                <CardHeader className="text-center pt-8 pb-4">
                    <CardTitle className="text-3xl font-bold">Welcome back</CardTitle>
                    <CardDescription className="text-base">Sign in to your account to continue</CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-6 px-8">
                        {error && (
                            <div className="p-4 text-sm font-medium text-accent bg-accent/10 border border-accent/20 rounded-sm transition-all animate-in fade-in slide-in-from-top-1">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2.5">
                            <Label htmlFor="email" className="text-sm font-bold ml-1 uppercase tracking-wider opacity-70">
                                Email Address
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@company.com"
                                {...register("email")}
                                className={`h-12 rounded-xl bg-background/50 border-muted-foreground/20 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${errors.email ? "border-accent ring-accent/20" : ""}`}
                            />
                            {errors.email && (
                                <p className="text-xs font-medium text-accent ml-1">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between ml-1">
                                <Label htmlFor="password" className="text-sm font-bold uppercase tracking-wider opacity-70">
                                    Password
                                </Label>
                                <Link href="/forgot-password" className="text-xs font-bold text-primary hover:underline">
                                    Forgot?
                                </Link>
                            </div>
                            <div className="relative group">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    {...register("password")}
                                    className={`h-12 rounded-xl bg-background/50 border-muted-foreground/20 focus:ring-2 focus:ring-primary/20 focus:border-primary pr-12 transition-all ${errors.password ? "border-accent ring-accent/20" : ""}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors duration-200"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-xs font-medium text-accent ml-1">{errors.password.message}</p>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-6 p-8 pt-6">
                        <Button type="submit" className="w-full h-12 rounded-xl font-bold text-base shadow-lg shadow-primary/20 hover-scale glow-primary transition-all" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                "Sign in"
                            )}
                        </Button>

                        <div className="space-y-4 w-full">
                            <p className="text-sm font-medium text-muted-foreground text-center">
                                Don't have an account?{" "}
                                <Link href="/register" className="text-primary font-bold hover:underline">
                                    Get Started
                                </Link>
                            </p>

                            <div className="pt-4 border-t border-muted/20">
                                <div className="p-3 bg-muted/30 rounded-xl border border-muted/50">
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1 text-center opacity-60">
                                        Default Access
                                    </p>
                                    <p className="text-xs text-center font-medium opacity-80">
                                        admin@woodledger.com / admin123
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardFooter>
                </form>
            </Card>

            <div className="mt-8 flex justify-center">
                <Link href="/" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2">
                    <span>←</span> Back to homepage
                </Link>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <Suspense fallback={<div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
