import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/UI/GlassCard';
import { NeonButton } from '../components/UI/NeonButton';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Mail, Award, Calendar, TrendingUp, Zap, Clock, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { UserBadge } from '../components/UI/UserBadge';

export default function Profile() {
    const { user, profile } = useAuth();
    const [editing, setEditing] = useState(false);
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(true);
    const [results, setResults] = useState([]);
    const [badges, setBadges] = useState([]);
    const [stats, setStats] = useState({
        avgScore: 0,
        highestScore: 0,
        totalTests: 0,
        xpProgress: 0
    });

    useEffect(() => {
        if (profile) {
            setUsername(profile.username);
            // Calculate XP progress (each level is 100 XP)
            const progress = profile.xp % 100;
            setStats(prev => ({ ...prev, xpProgress: progress }));

            // Set badges directly from profile if available, or fetch
            if (profile.badges) {
                setBadges(profile.badges);
            } else {
                // Fallback fetch if not in context yet
                fetchBadges();
            }
        }
    }, [profile]);

    async function fetchBadges() {
        const { data } = await supabase.from('profiles').select('badges').eq('id', user.id).single();
        if (data && data.badges) setBadges(data.badges);
    }

    useEffect(() => {
        if (user) {
            fetchUserStats();
        }
    }, [user]);

    async function fetchUserStats() {
        try {
            setStatsLoading(true);
            const { data, error } = await supabase
                .from('results')
                .select(`
                    *,
                    test:tests(title, category:categories(name, color))
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data && data.length > 0) {
                const total = data.length;
                const scores = data.map(r => Number(r.percentage));
                const avg = Math.round(scores.reduce((a, b) => a + b, 0) / total);
                const highest = Math.max(...scores);

                setResults(data);
                setStats(prev => ({
                    ...prev,
                    avgScore: avg,
                    highestScore: highest,
                    totalTests: total
                }));
            }
        } catch (err) {
            console.error("Error fetching stats:", err);
        } finally {
            setStatsLoading(false);
        }
    }

    async function handleUpdateProfile() {
        try {
            setLoading(true);
            const { error } = await supabase
                .from('profiles')
                .update({ username })
                .eq('id', user.id);

            if (error) throw error;
            setEditing(false);
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert('Error updating profile');
        } finally {
            setLoading(false);
        }
    }

    if (!user) return (
        <div className="flex flex-col items-center justify-center py-20">
            <User className="w-16 h-16 text-gray-600 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Not Logged In</h2>
            <p className="text-gray-400 mb-6">Please log in to view and manage your profile.</p>
            <Link to="/login">
                <NeonButton>Go to Login</NeonButton>
            </Link>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            {/* Profile Header Card */}
            <GlassCard className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -ml-32 -mb-32"></div>

                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="relative group">
                        <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-primary via-accent to-secondary p-1 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                            <div className="w-full h-full rounded-[1.4rem] bg-background-lighter overflow-hidden flex items-center justify-center -rotate-3 group-hover:rotate-0 transition-transform duration-500 border border-white/10">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-6xl font-bold text-primary-glow">
                                        {(profile?.username || user.email)[0].toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-background-lighter border border-glass-border rounded-xl px-3 py-1 shadow-xl">
                            <span className="text-xs font-bold text-primary-glow flex items-center gap-1">
                                <Award className="w-3 h-3" /> LVL {profile?.level || 1}
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div className="space-y-1">
                            {/* Badges Display */}
                            <div className="flex justify-center md:justify-start mb-2">
                                <UserBadge badges={badges} />
                            </div>

                            {editing ? (
                                <div className="flex gap-2">
                                    <input
                                        className="bg-background-lighter border border-primary/50 rounded-lg px-4 py-2 text-white text-2xl font-bold w-full focus:outline-none focus:ring-2 ring-primary/20"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        autoFocus
                                    />
                                    <NeonButton size="sm" onClick={handleUpdateProfile} disabled={loading}>Save</NeonButton>
                                    <button
                                        onClick={() => setEditing(false)}
                                        className="text-gray-400 hover:text-white px-2"
                                    >Cancel</button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center md:justify-start gap-4">
                                    <h2 className="text-4xl font-black text-white tracking-tight">{profile?.username || 'Future Genius'}</h2>
                                    <button
                                        onClick={() => setEditing(true)}
                                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                    >
                                        <User className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center justify-center md:justify-start gap-4 text-gray-400 text-sm">
                                <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {user.email}</span>
                                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Joined {new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                            </div>
                        </div>

                        {/* XP Section */}
                        <div className="max-w-md">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-yellow-500 fill-current" /> XP Mastery
                                </span>
                                <span className="text-sm font-bold text-white">{profile?.xp || 0} / {((profile?.level || 1) * 100)} XP</span>
                            </div>
                            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <div
                                    className="h-full bg-gradient-to-r from-primary via-accent to-secondary shadow-neon-purple transition-all duration-1000 ease-out"
                                    style={{ width: `${stats.xpProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Content Sheets */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Stats Cards */}
                <div className="lg:col-span-1 space-y-4">
                    <GlassCard className="p-4 flex items-center justify-between border-primary/20 bg-primary/5">
                        <div className="p-3 bg-primary/20 rounded-xl text-primary">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div className="text-right">
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-tighter">Avg Score</p>
                            <p className="text-2xl font-black text-white">{statsLoading ? '...' : `${stats.avgScore}%`}</p>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-4 flex items-center justify-between border-accent/20 bg-accent/5">
                        <div className="p-3 bg-accent/20 rounded-xl text-accent">
                            <Award className="w-6 h-6" />
                        </div>
                        <div className="text-right">
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-tighter">Highest</p>
                            <p className="text-2xl font-black text-white">{statsLoading ? '...' : `${stats.highestScore}%`}</p>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-4 flex items-center justify-between border-secondary/20 bg-secondary/5">
                        <div className="p-3 bg-secondary/20 rounded-xl text-secondary">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div className="text-right">
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-tighter">Tests Taken</p>
                            <p className="text-2xl font-black text-white">{statsLoading ? '...' : stats.totalTests}</p>
                        </div>
                    </GlassCard>
                </div>

                {/* History Table */}
                <div className="lg:col-span-3">
                    <GlassCard className="h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Clock className="w-5 h-5 text-primary" /> Recent Test Activity
                            </h3>
                            <Link to="/tests" className="text-sm text-primary hover:underline transition-all">Take more tests</Link>
                        </div>

                        {statsLoading ? (
                            <div className="py-10 text-center text-gray-500">Retrieving your achievements...</div>
                        ) : results.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-600">
                                    <Award className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">No test history yet</p>
                                    <p className="text-gray-500 text-sm mt-1">Complete your first test to see your performance here!</p>
                                </div>
                                <Link to="/tests">
                                    <NeonButton size="sm">Browse Mock Tests</NeonButton>
                                </Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-gray-500 text-xs uppercase tracking-widest border-b border-white/5">
                                            <th className="pb-4 font-bold">Test Title</th>
                                            <th className="pb-4 font-bold">Category</th>
                                            <th className="pb-4 font-bold">Score</th>
                                            <th className="pb-4 font-bold">Date</th>
                                            <th className="pb-4 text-right font-bold">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {results.map((res) => (
                                            <tr key={res.id} className="group hover:bg-white/[0.02] transition-colors">
                                                <td className="py-4 font-medium text-white group-hover:text-primary transition-colors">
                                                    {res.test?.title}
                                                </td>
                                                <td className="py-4">
                                                    <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-gray-400 capitalize">
                                                        {res.test?.category?.name || 'General'}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn(
                                                            "text-sm font-bold",
                                                            res.percentage >= 80 ? "text-green-400" :
                                                                res.percentage >= 50 ? "text-yellow-400" : "text-red-400"
                                                        )}>
                                                            {res.percentage}%
                                                        </span>
                                                        <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden hidden sm:block">
                                                            <div
                                                                className={cn(
                                                                    "h-full",
                                                                    res.percentage >= 80 ? "bg-green-500" :
                                                                        res.percentage >= 50 ? "bg-yellow-500" : "bg-red-500"
                                                                )}
                                                                style={{ width: `${res.percentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-sm text-gray-500">
                                                    {new Date(res.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="py-4 text-right">
                                                    <Link to={`/tests/${res.test_id}`}>
                                                        <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                                                            <ChevronRight className="w-4 h-4" />
                                                        </button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}

