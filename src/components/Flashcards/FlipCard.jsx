import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export function FlipCard({ front, back, revealed, onReveal }) {
    return (
        <div
            className="w-full cursor-pointer"
            style={{ perspective: '1200px' }}
            onClick={!revealed ? onReveal : undefined}
        >
            <div
                className="relative w-full transition-transform duration-700"
                style={{
                    transformStyle: 'preserve-3d',
                    transform: revealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    minHeight: '280px',
                }}
            >
                {/* FRONT */}
                <div
                    className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-8 text-center"
                    style={{
                        backfaceVisibility: 'hidden',
                        background: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(255,255,255,0.04) 100%)',
                        border: '1px solid rgba(124,58,237,0.3)',
                        boxShadow: '0 0 40px rgba(124,58,237,0.08)',
                    }}
                >
                    <span className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-6 opacity-70">Question</span>
                    <p className="text-2xl font-bold text-white leading-relaxed">{front}</p>
                    <p className="text-sm text-gray-500 mt-8 animate-pulse">Click to reveal answer</p>
                </div>

                {/* BACK */}
                <div
                    className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-8 text-center"
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(255,255,255,0.04) 100%)',
                        border: '1px solid rgba(16,185,129,0.3)',
                        boxShadow: '0 0 40px rgba(16,185,129,0.08)',
                    }}
                >
                    <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-6 opacity-70">Answer</span>
                    <p className="text-xl font-semibold text-white leading-relaxed">{back}</p>
                </div>
            </div>
        </div>
    );
}
