import React, { useEffect, useState } from 'react';
import { GlassCard } from '../components/UI/GlassCard';
import { supabase } from '../lib/supabase';
import { Trophy, Medal, Crown, Zap, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export default function Leaderboard() {
    const { user } = useAuth();
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    async function fetchLeaderboard() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, avatar_url, xp, level')
                .order('xp', { ascending: false })
                .limit(50);

            if (error) throw error;
            setLeaders(data || []);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    }

    function getUnsplashAvatar(username) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(username || 'User')}&background=random`;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4 mb-12">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent inline-flex items-center gap-3">
                    <Trophy className="w-10 h-10 text-yellow-400 fill-current" />
                    Hall of Fame
                </h1>
                <p className="text-gray-400">Compete with the best. Rise to the top.</p>
            </div>

            <GlassCard className="overflow-hidden">
                {loading ? (
                    <div className="text-center py-20 text-gray-500">Loading rankings...</div>
                ) : leaders.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">No data available yet.</div>
                ) : (
                    <div className="space-y-2">
                        {/* Header */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-glass-border">
                            <div className="col-span-1 text-center">#</div>
                            <div className="col-span-7">Student</div>
                            <div className="col-span-2 text-center">Level</div>
                            <div className="col-span-2 text-right">XP</div>
                        </div>

                        {/* Rows */}
                        {leaders.map((leader, index) => {
                            const isCurrentUser = user && leader.id === user.id;
                            const rank = index + 1;
                            let rankIcon = null;
                            if (rank === 1) rankIcon = <Crown className="w-5 h-5 text-yellow-400 fill-current" />;
                            else if (rank === 2) rankIcon = <Medal className="w-5 h-5 text-gray-300 fill-current" />;
                            else if (rank === 3) rankIcon = <Medal className="w-5 h-5 text-amber-600 fill-current" />;

                            return (
                                <div
                                    key={leader.id}
                                    className={cn(
                                        "grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors",
                                        isCurrentUser ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-white/5",
                                        rank <= 3 ? "bg-gradient-to-r from-white/5 to-transparent" : ""
                                    )}
                                >
                                    <div className="col-span-1 text-center font-bold text-[rgb(var(--text-main))] flex justify-center">
                                        {rankIcon || <span className="text-gray-500">#{rank}</span>}
                                    </div>

                                    <div className="col-span-7 flex items-center gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full p-0.5",
                                            rank === 1 ? "bg-gradient-to-tr from-yellow-400 to-orange-500" :
                                                rank === 2 ? "bg-gradient-to-tr from-gray-300 to-gray-500" :
                                                    rank === 3 ? "bg-gradient-to-tr from-amber-600 to-amber-800" :
                                                        "bg-gray-700"
                                        )}>
                                            <div className="w-full h-full rounded-full bg-background overflow-hidden flex items-center justify-center">
                                                {leader.avatar_url ? (
                                                    <img src={leader.avatar_url} alt={leader.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="text-xs font-bold text-white uppercase">{leader.username?.[0] || 'U'}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <p className={cn("font-medium", isCurrentUser ? "text-primary" : "text-[rgb(var(--text-main))]")}>
                                                {leader.username || 'Anonymous'} {isCurrentUser && "(You)"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="col-span-2 text-center text-sm font-medium text-gray-400">
                                        Lvl {leader.level || 1}
                                    </div>

                                    <div className="col-span-2 text-right font-bold text-[rgb(var(--text-main))] flex items-center justify-end gap-1">
                                        {leader.xp || 0}
                                        <Zap className="w-3 h-3 text-yellow-400 fill-current" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
