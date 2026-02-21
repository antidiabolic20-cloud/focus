import React from 'react';
import { GlassCard } from '../UI/GlassCard';
import { NeonButton } from '../UI/NeonButton';
import { BookOpen, Zap, Trash2, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

export function DeckCard({ deck, stats, onDelete }) {
    const masteryPercent = stats?.masteryPercent ?? 0;
    const dueToday = stats?.dueToday ?? 0;
    const total = stats?.total ?? deck.card_count ?? 0;

    const accentColor = deck.color || '#7c3aed';

    return (
        <GlassCard className="flex flex-col h-full group relative overflow-hidden hover:border-purple-500/40 transition-all">
            {/* Color accent glow */}
            <div
                className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl -mr-20 -mt-20 opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ backgroundColor: accentColor }}
            />

            {/* Header */}
            <div className="flex items-start justify-between mb-3 relative">
                <div
                    className="p-2.5 rounded-xl"
                    style={{ backgroundColor: `${accentColor}22`, border: `1px solid ${accentColor}44` }}
                >
                    <BookOpen className="w-5 h-5" style={{ color: accentColor }} />
                </div>
                <button
                    onClick={() => onDelete(deck.id)}
                    className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Info */}
            <div className="flex-1 relative">
                {deck.subject && (
                    <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full mb-2 inline-block"
                        style={{ backgroundColor: `${accentColor}22`, color: accentColor, border: `1px solid ${accentColor}33` }}
                    >
                        {deck.subject}
                    </span>
                )}
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-300 transition-colors leading-snug">
                    {deck.title}
                </h3>
                {deck.description && (
                    <p className="text-gray-400 text-sm line-clamp-2">{deck.description}</p>
                )}
            </div>

            {/* Stats */}
            <div className="mt-4 space-y-3">
                {/* Mastery bar */}
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">{total} cards</span>
                        <span className="text-emerald-400 font-medium">{masteryPercent}% mastered</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${masteryPercent}%`,
                                background: 'linear-gradient(90deg, #10b981, #34d399)',
                            }}
                        />
                    </div>
                </div>

                {/* Due today badge */}
                {dueToday > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5">
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span><strong>{dueToday}</strong> cards due for review</span>
                    </div>
                )}

                {/* Study button */}
                <Link to={`/flashcards/${deck.id}`}>
                    <button
                        className={cn(
                            "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200",
                            "text-white border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 hover:border-purple-500/60 hover:shadow-[0_0_20px_rgba(124,58,237,0.2)]"
                        )}
                    >
                        <Play className="w-4 h-4 fill-current" />
                        Study Now
                    </button>
                </Link>
            </div>
        </GlassCard>
    );
}
