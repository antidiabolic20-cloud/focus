import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../components/UI/GlassCard';
import { Play, Pause, RotateCcw, Plus, Check, Trash2, Headphones, Music, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../lib/utils';

export default function FocusDojo() {
    // Timer State
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState('focus'); // focus, short, long

    // Task State
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');

    // Audio State
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const audioRef = useRef(new Audio('https://stream.zeno.fm/0r0xa792kwzuv')); // Lofi Girl Stream or similar free stream

    // Timer Logic
    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            new Audio('/notification.mp3').play().catch(() => { }); // Simple beep if available, or just stop
            // Auto switch modes logic could go here
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    // Audio Logic
    useEffect(() => {
        audioRef.current.volume = volume;
        if (isPlaying) {
            audioRef.current.play().catch(e => {
                console.error("Audio play failed", e);
                setIsPlaying(false);
            });
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying, volume]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        if (mode === 'focus') setTimeLeft(25 * 60);
        else if (mode === 'short') setTimeLeft(5 * 60);
        else setTimeLeft(15 * 60);
    };

    const switchMode = (newMode) => {
        setMode(newMode);
        setIsActive(false);
        if (newMode === 'focus') setTimeLeft(25 * 60);
        else if (newMode === 'short') setTimeLeft(5 * 60);
        else setTimeLeft(15 * 60);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const addTask = (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;
        setTasks([...tasks, { id: Date.now(), text: newTask, completed: false }]);
        setNewTask('');
    };

    const toggleTask = (id) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const deleteTask = (id) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Headphones className="w-8 h-8 text-primary" />
                Focus Dojo
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Timer Section */}
                <GlassCard className="p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden group">
                    {/* Background Pulse Animation */}
                    <div className={cn(
                        "absolute inset-0 bg-primary/5 blur-3xl transition-all duration-1000",
                        isActive && "bg-primary/20 animate-pulse"
                    )} />

                    <div className="relative z-10 flex flex-col items-center w-full">
                        {/* Mode Selectors */}
                        <div className="flex gap-2 mb-12 bg-black/20 p-1.5 rounded-full">
                            {['focus', 'short', 'long'].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => switchMode(m)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize",
                                        mode === m
                                            ? "bg-primary text-white shadow-lg"
                                            : "text-gray-400 hover:text-white"
                                    )}
                                >
                                    {m === 'short' ? 'Short Break' : m === 'long' ? 'Long Break' : 'Focus Mode'}
                                </button>
                            ))}
                        </div>

                        {/* Clock Display */}
                        <div className={cn(
                            "text-8xl sm:text-9xl font-mono font-bold tracking-tighter mb-12 transition-colors duration-300",
                            isActive ? "text-white" : "text-gray-400"
                        )}>
                            {formatTime(timeLeft)}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-6">
                            <button
                                onClick={toggleTimer}
                                className={cn(
                                    "w-16 h-16 rounded-full flex items-center justify-center transition-all bg-primary hover:bg-primary-glow text-white shadow-lg hover:scale-105 active:scale-95",
                                    isActive && "bg-amber-500 hover:bg-amber-600"
                                )}
                            >
                                {isActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                            </button>

                            <button
                                onClick={resetTimer}
                                className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all"
                            >
                                <RotateCcw className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </GlassCard>

                <div className="space-y-6">
                    {/* Music Player */}
                    <GlassCard className="p-6 relative overflow-hidden">
                        <div className="relative z-10 flex items-center gap-4">
                            <div className={cn(
                                "w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center transition-all",
                                isPlaying && "animate-pulse"
                            )}>
                                <Music className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-white">Lofi & Chill</h3>
                                <p className="text-xs text-gray-400">Focus Beats / Hip Hop</p>
                            </div>
                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                            >
                                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                            </button>
                        </div>
                        {/* Simple Visualizer Bars */}
                        {isPlaying && (
                            <div className="absolute  bottom-0 left-0 right-0 h-1 flex items-end justify-center gap-1 opacity-50 px-6 pb-6">
                                {[...Array(20)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-1 bg-primary rounded-t-sm animate-bounce"
                                        style={{
                                            height: `${Math.random() * 100}%`,
                                            animationDuration: `${0.5 + Math.random()}s`
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </GlassCard>

                    {/* Task List */}
                    <GlassCard className="p-6 flex-1 h-full min-h-[300px] flex flex-col">
                        <h3 className="font-bold text-white mb-4">Session Goals</h3>

                        <form onSubmit={addTask} className="flex gap-2 mb-6">
                            <input
                                value={newTask}
                                onChange={(e) => setNewTask(e.target.value)}
                                placeholder="Add a task for this session..."
                                className="flex-1 bg-background-lighter border border-glass-border rounded-lg px-4 py-2 text-sm text-white focus:border-primary outline-none"
                            />
                            <button type="submit" className="p-2 bg-primary hover:bg-primary-glow text-white rounded-lg transition-colors">
                                <Plus className="w-4 h-4" />
                            </button>
                        </form>

                        <div className="space-y-2 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                            {tasks.length === 0 && (
                                <p className="text-center text-gray-500 text-sm py-8">No tasks yet. Stay focused!</p>
                            )}
                            {tasks.map(task => (
                                <div key={task.id} className="group flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                    <button
                                        onClick={() => toggleTask(task.id)}
                                        className={cn(
                                            "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                            task.completed ? "bg-green-500 border-green-500" : "border-gray-500 hover:border-gray-400"
                                        )}
                                    >
                                        {task.completed && <Check className="w-3 h-3 text-white" />}
                                    </button>
                                    <span className={cn(
                                        "flex-1 text-sm transition-all",
                                        task.completed ? "text-gray-500 line-through" : "text-gray-200"
                                    )}>
                                        {task.text}
                                    </span>
                                    <button
                                        onClick={() => deleteTask(task.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
