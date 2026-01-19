import React from 'react';
import { cn } from '../../lib/utils';

export function NeonButton({ children, variant = 'primary', className, ...props }) {
    const variants = {
        primary: "bg-primary text-white shadow-neon-purple hover:bg-primary-glow",
        secondary: "bg-secondary text-white shadow-neon-blue hover:bg-secondary-glow",
        outline: "border border-primary text-primary hover:bg-primary/10",
        ghost: "text-gray-400 hover:text-white hover:bg-white/5"
    };

    return (
        <button
            className={cn(
                "px-6 py-2.5 rounded-lg font-medium transition-all duration-300 transform active:scale-95",
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
