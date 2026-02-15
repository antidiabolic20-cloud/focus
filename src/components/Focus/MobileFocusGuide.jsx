import React, { useState, useEffect } from 'react';
import { useFocus } from '../../context/FocusContext';
import { GlassCard } from '../UI/GlassCard';
import { NeonButton } from '../UI/NeonButton';
import { Smartphone, Lock, X, Check, Monitor } from 'lucide-react'; // Removed Apple, added Smartphone for iOS too
import { cn } from '../../lib/utils';

export function MobileFocusGuide() {
    const { isFocusMode } = useFocus();
    const [isOpen, setIsOpen] = useState(false);
    const [platform, setPlatform] = useState('ios'); // 'ios' | 'android'
    const [step, setStep] = useState(0);

    const [deferredPrompt, setDeferredPrompt] = useState(null);

    // Detect platform
    useEffect(() => {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        if (/android/i.test(userAgent)) {
            setPlatform('android');
        } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
            setPlatform('ios');
        }

        // Listen for install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        });
    }, []);

    // Open guide automatically when entering Focus Mode on mobile
    useEffect(() => {
        if (isFocusMode && window.innerWidth < 768) {
            setIsOpen(true);
        }
    }, [isFocusMode]);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    if (!isOpen) return null;

    const steps = {
        ios: [
            {
                title: "Install App",
                desc: "Tap 'Share' (bottom) → 'Add to Home Screen' to install fullscreen.",
                icon: <Smartphone className="w-8 h-8 text-primary" />,
                isInstallStep: true
            },
            {
                title: "Enable Guided Access",
                desc: "Go to Settings > Accessibility > Guided Access and turn it ON.",
                icon: <Smartphone className="w-8 h-8 text-primary" />
            },
            {
                title: "Lock This App",
                desc: "Triple-click the side button while in the app to lock it.",
                icon: <Check className="w-8 h-8 text-green-400" />
            }
        ],
        android: [
            {
                title: "Install App",
                desc: "Tap the button below to install the app for a better experience.",
                icon: <Smartphone className="w-8 h-8 text-primary" />,
                isInstallStep: true
            },
            {
                title: "Enable App Pinning",
                desc: "Go to Settings > Security > Advanced > App Pinning and turn it ON.",
                icon: <Smartphone className="w-8 h-8 text-green-400" />
            },
            {
                title: "Pin This App",
                desc: "Open App Switcher, tap the icon above this app, and select 'Pin'.",
                icon: <Check className="w-8 h-8 text-primary" />
            }
        ]
    };

    const currentSteps = steps[platform];

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <GlassCard className="w-full max-w-md m-4 p-6 relative overflow-hidden bg-background border-primary/20 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-[rgb(var(--text-main))] flex items-center justify-center gap-2">
                        <Lock className="w-5 h-5 text-primary" />
                        Lock Your Phone
                    </h2>
                    <p className="text-sm text-gray-400 mt-2">
                        For true focus, use {platform === 'ios' ? 'Guided Access' : 'App Pinning'} to block other apps.
                    </p>
                </div>

                {/* Platform Toggle */}
                <div className="flex bg-background-lighter rounded-lg p-1 mb-6">
                    <button
                        onClick={() => setPlatform('ios')}
                        className={cn(
                            "flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all",
                            platform === 'ios' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        <Smartphone className="w-4 h-4" /> iOS
                    </button>
                    <button
                        onClick={() => setPlatform('android')}
                        className={cn(
                            "flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all",
                            platform === 'android' ? "bg-white/10 text-green-400" : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        <Smartphone className="w-4 h-4" /> Android
                    </button>
                </div>

                {/* Steps Carousel */}
                <div className="relative min-h-[220px]">
                    <div className="text-center space-y-4 animate-in slide-in-from-right duration-300" key={step}>
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                            {currentSteps[step].icon}
                        </div>
                        <h3 className="text-lg font-bold text-white">{currentSteps[step].title}</h3>
                        <p className="text-gray-400 text-sm px-4">{currentSteps[step].desc}</p>

                        {currentSteps[step].isInstallStep && platform === 'android' && deferredPrompt && (
                            <NeonButton onClick={handleInstallClick} className="mt-2 text-sm py-2">
                                Add to Home Screen
                            </NeonButton>
                        )}
                        {currentSteps[step].isInstallStep && platform === 'ios' && (
                            <p className="text-xs text-primary mt-2 animate-pulse">
                                ↑ Tap the Share button in your browser menu
                            </p>
                        )}
                    </div>

                    {/* Dots */}
                    <div className="flex justify-center gap-2 mt-6">
                        {currentSteps.map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "w-2 h-2 rounded-full transition-all",
                                    i === step ? "bg-primary w-6" : "bg-white/20"
                                )}
                            />
                        ))}
                    </div>
                </div>

                <div className="mt-6 flex gap-3">
                    {step > 0 && (
                        <button
                            onClick={() => setStep(s => s - 1)}
                            className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 font-medium hover:bg-white/5"
                        >
                            Back
                        </button>
                    )}
                    <NeonButton
                        className="flex-1"
                        onClick={() => {
                            if (step < currentSteps.length - 1) {
                                setStep(s => s + 1);
                            } else {
                                setIsOpen(false);
                            }
                        }}
                    >
                        {step < currentSteps.length - 1 ? "Next Step" : "I'm Locked In!"}
                    </NeonButton>
                </div>

            </GlassCard>
        </div>
    );
}
