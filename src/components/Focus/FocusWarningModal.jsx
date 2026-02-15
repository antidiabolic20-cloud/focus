import React from 'react';
import { useFocus } from '../../context/FocusContext';
import { AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export function FocusWarningModal() {
    const { isWarningActive, dismissWarning } = useFocus();

    if (!isWarningActive) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-lg animate-in fade-in duration-300">
            <div className="max-w-md w-full mx-4 bg-background-lighter border-2 border-red-500 rounded-2xl p-8 shadow-[0_0_50px_rgba(239,68,68,0.5)] text-center relative overflow-hidden">
                {/* Pulse Effect */}
                <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>

                <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="p-4 bg-red-500/20 rounded-full animate-bounce">
                        <AlertTriangle className="w-12 h-12 text-red-500" />
                    </div>

                    <h2 className="text-2xl font-bold text-red-500 uppercase tracking-widest">Distraction Detected!</h2>

                    <p className="text-gray-400">
                        You left the app while in <span className="text-primary font-bold">Success Mode</span>.
                        <br />
                        Stay focused on your goals. Don't let distractions win.
                    </p>

                    <button
                        onClick={dismissWarning}
                        className="mt-4 px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all hover:scale-105 hover:shadow-lg flex items-center gap-2"
                    >
                        <XCircle className="w-5 h-5" />
                        I'm Back, Sorry!
                    </button>
                </div>
            </div>
        </div>
    );
}
