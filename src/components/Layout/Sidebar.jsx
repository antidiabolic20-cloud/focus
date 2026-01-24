import React from 'react';
import { Logo } from '../UI/Logo';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, FileText, User, Settings, LogOut, Users, Mail, X, BarChart2, Swords, Trophy, Flame, Library, Headphones, Handshake, ShoppingBag } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export function Sidebar({ isOpen, onClose }) {
    const { signOut, streak } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Swords, label: 'Battle', path: '/battle' },
        { icon: Users, label: 'Community', path: '/community' },
        { icon: Mail, label: 'Messages', path: '/messages' },
        { icon: BarChart2, label: 'Analytics', path: '/analytics' },
        { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
        { icon: MessageSquare, label: 'Forums', path: '/forums' },
        { icon: Users, label: 'Groups', path: '/groups' },
        { icon: Library, label: 'Resources', path: '/resources' },
        { icon: Headphones, label: 'Focus Dojo', path: '/focus' },
        { icon: Handshake, label: 'Study Buddy', path: '/study-buddy' },
        { icon: ShoppingBag, label: 'XP Shop', path: '/shop' },
        { icon: FileText, label: 'Mock Tests', path: '/tests' },
        { icon: User, label: 'Profile', path: '/profile' },
    ];

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={cn(
                "w-64 h-screen fixed left-0 top-0 bg-background/95 backdrop-blur-xl border-r border-glass-border flex flex-col z-50 transition-transform duration-300 md:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 flex items-center justify-between">
                    <Logo />
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-[rgb(var(--text-main))] md:hidden">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Streak Banner */}
                <div className="px-4 mb-2">
                    <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-3 flex items-center gap-3">
                        <div className="p-2 bg-orange-500/20 rounded-lg">
                            <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium">Daily Streak</p>
                            <p className="text-sm font-bold text-[rgb(var(--text-main))]">{streak} Days 🔥</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => onClose()}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-primary/10 text-primary shadow-neon-purple/20"
                                    : "text-gray-400 hover:bg-white/5 hover:text-[rgb(var(--text-main))]"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-glass-border space-y-2">
                    <button className="flex items-center gap-3 px-4 py-3 w-full text-gray-400 hover:text-[rgb(var(--text-main))] hover:bg-white/5 rounded-xl transition-colors">
                        <Settings className="w-5 h-5" />
                        <span className="font-medium">Settings</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

