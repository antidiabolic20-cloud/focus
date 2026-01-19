import React from 'react';
import { Search, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export function Topbar() {
    const { user, profile } = useAuth();

    return (
        <header className="h-20 fixed top-0 right-0 left-64 bg-background/80 backdrop-blur-md border-b border-glass-border z-40 px-8 flex items-center justify-between">
            {/* Search Bar */}
            <div className="w-96 relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input
                    type="text"
                    placeholder="Search topics, tests..."
                    className="w-full bg-background-lighter border border-glass-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 focus:shadow-neon-purple/20 transition-all placeholder:text-gray-600"
                />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-6">
                <button className="relative text-gray-400 hover:text-white transition-colors">
                    <Bell className="w-6 h-6" />
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-accent rounded-full border-2 border-background shadow-neon-purple"></span>
                </button>

                {user ? (
                    <div className="flex items-center gap-3 pl-6 border-l border-glass-border">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-medium text-white">{profile?.username || 'Student'}</p>
                            <p className="text-xs text-primary">Level {profile?.level || 1}</p>
                        </div>
                        <Link to="/profile" className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary p-0.5 cursor-pointer hover:scale-105 transition-transform">
                            <div className="w-full h-full rounded-full bg-background border-2 border-transparent overflow-hidden flex items-center justify-center">
                                {/* Avatar */}
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="User" />
                                ) : (
                                    <div className="text-xs font-bold text-white uppercase">{profile?.username?.[0] || 'U'}</div>
                                )}
                            </div>
                        </Link>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 pl-6 border-l border-glass-border">
                        <Link to="/login" className="text-sm font-medium text-gray-400 hover:text-white">Login</Link>
                    </div>
                )}
            </div>
        </header>
    );
}
