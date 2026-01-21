import React from 'react';

export const Logo = ({ className = "", size = "normal" }) => {
    // Size variants
    const dimensions = size === 'large' ? 'w-12 h-12' : 'w-8 h-8';
    const textSize = size === 'large' ? 'text-4xl' : 'text-2xl';
    const subtextSize = size === 'large' ? 'text-sm' : 'text-[10px]';
    const gap = size === 'large' ? 'gap-4' : 'gap-3';

    return (
        <div className={`flex items-center ${gap} ${className}`}>
            <div className={`relative flex items-center justify-center ${dimensions} flex-shrink-0`}>
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-primary/40 rounded-full blur-lg animate-pulse" />

                {/* Main Logo SVG */}
                <svg
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="relative w-full h-full drop-shadow-lg"
                >
                    <defs>
                        <linearGradient id="logoGradient" x1="0" y1="100" x2="100" y2="0">
                            <stop offset="0%" stopColor="#ec4899" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                    </defs>

                    {/* Outer Target Ring */}
                    <circle cx="50" cy="50" r="45" stroke="url(#logoGradient)" strokeWidth="8" strokeOpacity="0.3" />

                    {/* Middle Ring (Split) */}
                    <path d="M50 15 A35 35 0 1 1 15 50" stroke="url(#logoGradient)" strokeWidth="6" strokeLinecap="round" />

                    {/* Center Circle */}
                    <circle cx="50" cy="50" r="18" fill="url(#logoGradient)" />

                    {/* Upward Arrow (Growth) */}
                    <path d="M50 62 L50 38 M50 38 L38 50 M50 38 L62 50" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>

            <div className="flex flex-col justify-center">
                <h1 className={`${textSize} font-bold bg-gradient-to-r from-pink-500 to-violet-600 bg-clip-text text-transparent leading-none tracking-tight`}>
                    FOCUS
                </h1>
                <p className={`${subtextSize} text-gray-500 font-medium tracking-[0.2em] uppercase`}>
                    Target Success
                </p>
            </div>
        </div>
    );
};
