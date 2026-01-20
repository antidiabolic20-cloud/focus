import React from 'react';
import { cn } from '../../lib/utils';
import { Trophy, Zap, Beaker, Calculator } from 'lucide-react';

export function UserBadge({ badges, className }) {
    if (!badges || badges.length === 0) return null;

    // Helper to get badge style based on name
    const getBadgeStyle = (badgeName) => {
        const lower = badgeName.toLowerCase();
        if (lower.includes('mathematician')) return {
            icon: Calculator,
            classes: "bg-red-500/10 text-red-400 border-red-500/20"
        };
        if (lower.includes('physicist')) return {
            icon: Zap,
            classes: "bg-blue-500/10 text-blue-400 border-blue-500/20"
        };
        if (lower.includes('chemistry') || lower.includes('flask') || lower.includes('alchemist')) return {
            icon: Beaker,
            classes: "bg-purple-500/10 text-purple-400 border-purple-500/20"
        };
        return {
            icon: Trophy,
            classes: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
        };
    };

    return (
        <div className={cn("flex flex-wrap gap-1", className)}>
            {badges.map((badge, idx) => {
                const style = getBadgeStyle(badge);
                const Icon = style.icon;

                return (
                    <span
                        key={idx}
                        className={cn(
                            "flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-medium tracking-wide uppercase",
                            style.classes
                        )}
                        title={badge}
                    >
                        <Icon className="w-3 h-3" />
                        {badge}
                    </span>
                );
            })}
        </div>
    );
}
