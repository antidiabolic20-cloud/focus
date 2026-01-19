import React from 'react';
import { cn } from '../../lib/utils';

export function GlassCard({ children, className, ...props }) {
    return (
        <div
            className={cn(
                "glass-panel rounded-xl p-6 transition-all duration-300 hover:shadow-neon-purple/20",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
