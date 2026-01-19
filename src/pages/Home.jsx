import React, { useEffect, useState } from 'react';
import { GlassCard } from '../components/UI/GlassCard';
import { NeonButton } from '../components/UI/NeonButton';
import { Play, MessageSquare, TrendingUp, Trophy, ArrowRight, Zap } from 'lucide-react'; // Replaced Fire with Zap for XP
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Home() {
    const { user, profile } = useAuth();
    const [popularTopics, setPopularTopics] = useState([]);
    const [upcomingTests, setUpcomingTests] = useState([]);
    const [stats, setStats] = useState({
        avgScore: 0,
        rank: '-',
        totalTests: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);

                // 1. Fetch Popular Threads
                const { data: threads } = await supabase
                    .from('threads')
                    .select(`
            id, title, created_at, category:categories(name, color),
            author:profiles(username),
            replies:comments(count)
          `)
                    .order('created_at', { ascending: false })
                    .limit(3);

                if (threads) {
                    // Transform to get reply count if needed, or just use length
                    const formatted = threads.map(t => ({
                        ...t,
                        reply_count: t.replies?.[0]?.count || 0 // If using count aggregate
                    }));
                    setPopularTopics(threads);
                }

                // 2. Fetch Tests
                const { data: tests } = await supabase
                    .from('tests')
                    .select(`*, category:categories(name)`)
                    .limit(3);
                if (tests) setUpcomingTests(tests);

                // 3. User Specific Stats (only if logged in)
                if (user) {
                    // Calculate Rank (simple count of people with more XP)
                    const { count, error: rankError } = await supabase
                        .from('profiles')
                        .select('id', { count: 'exact', head: true })
                        .gt('xp', profile?.xp || 0);

                    // Average Score
                    const { data: results } = await supabase
                        .from('results')
                        .select('percentage')
                        .eq('user_id', user.id);

                    const avg = results?.length
                        ? Math.round(results.reduce((acc, curr) => acc + curr.percentage, 0) / results.length)
                        : 0;

                    setStats({
                        avgScore: avg,
                        rank: rankError ? '-' : (count + 1),
                        totalTests: results?.length || 0
                    });
                }

            } catch (error) {
                console.error("Dashboard Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [user, profile]);

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white">
                        Hello, {profile?.username || 'Student'} 👋
                    </h1>
                    <p className="text-gray-400 mt-2">Ready to crush your goals today?</p>
                </div>
                <Link to="/tests">
                    <NeonButton className="flex items-center gap-2">
                        <Play className="w-4 h-4" /> Start Practice
                    </NeonButton>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="w-24 h-24 text-primary" />
                    </div>
                    <h3 className="text-gray-400 font-medium">Average Score</h3>
                    <div className="mt-4">
                        <span className="text-4xl font-bold text-white">{stats.avgScore}%</span>
                        <span className="text-gray-500 text-sm ml-2">in {stats.totalTests} tests</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full mt-4 overflow-hidden">
                        <div
                            className="bg-primary h-full shadow-neon-purple transition-all duration-1000"
                            style={{ width: `${stats.avgScore}%` }}
                        ></div>
                    </div>
                </GlassCard>

                <GlassCard className="relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Trophy className="w-24 h-24 text-accent" />
                    </div>
                    <h3 className="text-gray-400 font-medium">Global Rank</h3>
                    <div className="mt-4">
                        <span className="text-4xl font-bold text-white">#{stats.rank}</span>
                        <span className="text-gray-500 text-sm ml-2">by XP</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-4">{user ? "Keep learning to improve!" : "Log in to see rank"}</p>
                </GlassCard>

                <GlassCard className="flex flex-col justify-between bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                    <div>
                        <h3 className="text-white font-medium">Total XP</h3>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-3xl font-bold text-primary-glow">{profile?.xp || 0}</span>
                            <Zap className="w-6 h-6 text-yellow-400 fill-current" />
                        </div>
                    </div>
                    <Link to="/leaderboard" className="w-full mt-4 block">
                        <NeonButton variant="secondary" className="w-full text-sm">
                            View Leaderboard
                        </NeonButton>
                    </Link>
                </GlassCard>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">Popular Discussions</h2>
                        <Link to="/forums" className="text-sm text-primary hover:text-primary-glow transition-colors">View All</Link>
                    </div>
                    <div className="space-y-4">
                        {popularTopics.length === 0 ? (
                            <GlassCard className="p-4 text-center text-gray-400">
                                No active discussions yet. Be the first to post!
                            </GlassCard>
                        ) : popularTopics.map((topic, index) => (
                            <Link key={topic.id} to={`/forums/${topic.id}`}>
                                <GlassCard className="flex items-center justify-between p-4 hover:bg-white/5 cursor-pointer group transition-all mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-background-lighter flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <MessageSquare className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-white group-hover:text-primary transition-colors">{topic.title}</h4>
                                            <span className={cn(
                                                "text-xs px-2 py-0.5 rounded-full border bg-white/5 mt-1 inline-block",
                                                "text-primary border-primary/20"
                                            )}>
                                                {topic.category?.name || 'General'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-gray-500 text-sm">
                                        <span className="hidden sm:inline">{topic.author?.username}</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </GlassCard>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Right Column (1/3) */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">Available Tests</h2>
                    </div>
                    <GlassCard className="space-y-4">
                        {upcomingTests.length === 0 ? (
                            <div className="text-gray-400 text-sm p-2">No tests available right now.</div>
                        ) : upcomingTests.map((test, index) => (
                            <div key={index} className="p-3 rounded-lg bg-background-lighter border border-glass-border hover:border-primary/30 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-medium text-sm text-white">{test.title}</h4>
                                        <p className="text-xs text-gray-400 mt-1">{test.category?.name} • {test.duration_minutes}m</p>
                                    </div>
                                    <Link to={`/tests/${test.id}`} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary hover:text-white transition-colors">
                                        Start
                                    </Link>
                                </div>
                            </div>
                        ))}
                        <Link to="/tests" className="block w-full text-center text-sm text-gray-400 hover:text-white mt-2">
                            View All Tests
                        </Link>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
