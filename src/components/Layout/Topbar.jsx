import { useTheme } from '../../context/ThemeContext';
import { Search, Bell, Menu, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export function Topbar({ onMenuClick }) {
    const { user, profile } = useAuth();
    const { theme, toggleTheme } = useTheme();

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

                <button className="relative text-gray-400 hover:text-[rgb(var(--text-main))] transition-colors p-2">
                    <Bell className="w-6 h-6" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border border-background shadow-neon-purple"></span>
                </button>

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
