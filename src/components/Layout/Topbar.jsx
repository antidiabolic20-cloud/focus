import { useTheme } from '../../context/ThemeContext';
import { Search, Bell, Menu, Sun, Moon, Check, MessageSquare, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Link, useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export function Topbar({ onMenuClick }) {
    const { user, profile } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [showNotifications, setShowNotifications] = useState(false);
    const navigate = useNavigate();

    return (
        <header className="h-20 fixed top-0 right-0 left-0 md:left-64 bg-background/80 backdrop-blur-md border-b border-glass-border z-40 px-4 md:px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 text-gray-400 hover:text-white md:hidden"
                >
                    <Menu className="w-6 h-6" />
                </button>

                {/* Search Bar - Hidden on small mobile */}
                <div className="hidden sm:block w-48 lg:w-96 relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full bg-background-lighter border border-glass-border rounded-xl pl-10 pr-4 py-2 text-sm text-[rgb(var(--text-main))] focus:outline-none focus:border-primary/50 transition-all"
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3 md:gap-6">
                <button
                    onClick={toggleTheme}
                    className="p-2 text-gray-400 hover:text-[rgb(var(--text-main))] transition-colors"
                    title="Toggle Theme"
                >
                    {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                </button>

                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative text-gray-400 hover:text-[rgb(var(--text-main))] transition-colors p-2"
                    >
                        <Bell className="w-6 h-6" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background animate-pulse">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)}></div>
                            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-background-lighter border border-glass-border rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in duration-200">
                                <div className="p-4 border-b border-glass-border flex justify-between items-center bg-background/50">
                                    <h3 className="font-bold text-[rgb(var(--text-main))]">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-xs text-primary hover:text-primary-glow font-medium flex items-center gap-1"
                                        >
                                            <Check className="w-3 h-3" /> Mark all read
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-[400px] overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500 text-sm">
                                            No notifications yet
                                        </div>
                                    ) : (
                                        notifications.map(n => (
                                            <div
                                                key={n.id}
                                                onClick={() => {
                                                    markAsRead(n.id);
                                                    if (n.link) {
                                                        navigate(n.link);
                                                        setShowNotifications(false);
                                                    }
                                                }}
                                                className={cn(
                                                    "p-4 border-b border-glass-border cursor-pointer transition-colors hover:bg-white/5 flex gap-3",
                                                    !n.is_read ? "bg-primary/5" : ""
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                                                    n.type === 'message' ? "bg-blue-500/20 text-blue-400" :
                                                        n.type === 'comment' ? "bg-purple-500/20 text-purple-400" :
                                                            "bg-yellow-500/20 text-yellow-400"
                                                )}>
                                                    {n.type === 'message' ? <MessageSquare className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <p className={cn(
                                                            "text-sm font-medium leading-none",
                                                            !n.is_read ? "text-[rgb(var(--text-main))]" : "text-gray-400"
                                                        )}>{n.title}</p>
                                                        {!n.is_read && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.content}</p>
                                                    <p className="text-[10px] text-gray-600 mt-2">
                                                        {new Date(n.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {notifications.length > 0 && (
                                    <div className="p-3 bg-background/50 border-t border-glass-border text-center">
                                        <button className="text-xs text-gray-500 hover:text-[rgb(var(--text-main))] font-medium uppercase tracking-wider">
                                            View All Activity
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {user ? (
                    <div className="flex items-center gap-3 pl-3 md:pl-6 border-l border-glass-border">
                        <div className="text-right hidden lg:block">
                            <p className="text-sm font-medium text-[rgb(var(--text-main))]">{profile?.username || 'Student'}</p>
                            <p className="text-xs text-primary">Level {profile?.level || 1}</p>
                        </div>
                        <Link to="/profile" className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-primary to-secondary p-0.5 cursor-pointer hover:scale-105 transition-transform">
                            <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-xs font-bold text-[rgb(var(--text-main))] uppercase">{profile?.username?.[0] || 'U'}</div>
                                )}
                            </div>
                        </Link>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 pl-6 border-l border-glass-border">
                        <Link to="/login" className="text-sm font-medium text-gray-400 hover:text-[rgb(var(--text-main))]">Login</Link>
                    </div>
                )}
            </div>
        </header>
    );
}
