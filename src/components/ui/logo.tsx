import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    size?: number | string;
    variant?: "default" | "white" | "dark";
}

export const Logo: React.FC<LogoProps> = ({ className, size = 40, variant = "default" }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn("transition-all duration-300", className)}
        >
            <defs>
                <linearGradient id="logo-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFF" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#FFF" stopOpacity="0" />
                </linearGradient>
                <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Background Shape - Subtle hex/structural frame */}
            <path
                d="M50 5 L89 27.5 V72.5 L50 95 L11 72.5 V27.5 L50 5Z"
                fill="currentColor"
                className="text-primary/5 dark:text-primary/10"
            />

            {/* Stylized 'W' Planks - Single Primary Color */}
            {/* Left Plank */}
            <path
                d="M25 35L38 75H50L37 35H25Z"
                fill="var(--primary)"
                filter="url(#logo-glow)"
            />
            {/* Inner Left */}
            <path
                d="M38 75L45 55H57L50 75H38Z"
                fill="var(--primary)"
                fillOpacity="0.8"
            />
            {/* Inner Right */}
            <path
                d="M45 55L52 35H64L57 55H45Z"
                fill="var(--primary)"
                fillOpacity="0.6"
            />
            {/* Right Plank */}
            <path
                d="M52 35L65 75H77L64 35H52Z"
                fill="var(--primary)"
                filter="url(#logo-glow)"
            />

            {/* Glossy Overlay */}
            <path
                d="M25 35L38 75H45L32 35H25Z"
                fill="url(#logo-gradient-2)"
            />
            <path
                d="M52 35L65 75H72L59 35H52Z"
                fill="url(#logo-gradient-2)"
            />
        </svg>
    );
};
