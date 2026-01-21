import React, { useEffect, useState } from 'react';
import { GlassCard } from '../components/UI/GlassCard';
import { PerformanceRadar } from '../components/Analytics/PerformanceRadar';
import { ActivityChart } from '../components/Analytics/ActivityChart';
import { analyticsService } from '../services/analyticsService';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Clock, Target, Zap, LayoutDashboard, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Analytics() {
    const { user } = useAuth();
    const [performanceData, setPerformanceData] = useState([]);
    const [activityData, setActivityData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        async function loadAnalytics() {
            try {
                setLoading(true);
                const [perf, activity, stats] = await Promise.all([
                    analyticsService.getTopicPerformance(user.id),
                    analyticsService.getActivityTimeline(user.id),
                    analyticsService.getSummaryStats(user.id)
                ]);
                setPerformanceData(perf);
                setActivityData(activity);
                setSummary(stats);
            } catch (error) {
                console.error("Error loading analytics:", error);
            } finally {
                setLoading(false);
            }
        }

        loadAnalytics();
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[rgb(var(--text-main))]">Performance Analytics</h1>
                    <p className="text-gray-400 mt-2">Visualize your progress and mastery 🚀</p>
                </div>
                <Link to="/">
                    <button className="flex items-center gap-2 px-4 py-2 bg-background-lighter border border-glass-border rounded-xl text-sm text-gray-400 hover:text-white transition-colors">
                        <LayoutDashboard className="w-4 h-4" /> Back to Dashboard
                    </button>
                </Link>
            </div>

            {/* Stats Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatMetric title="Total Tests" value={summary?.totalTests || 0} icon={LayoutDashboard} color="text-blue-400" />
                <StatMetric title="Avg Score" value={`${summary?.avgScore || 0}%`} icon={Target} color="text-purple-400" />
                <StatMetric title="Avg Time / Test" value={`${summary?.avgTimeMinutes || 0}m`} icon={Clock} color="text-pink-400" />
                <StatMetric title="Consistency" value={`${summary?.consistency || 0}%`} icon={TrendingUp} color="text-emerald-400" />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Topic Mastery */}
                <GlassCard className="p-6 overflow-hidden">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
                            <Zap className="w-5 h-5 fill-current" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Topic Mastery</h3>
                    </div>
                    <PerformanceRadar data={performanceData} />
                    <p className="mt-4 text-sm text-gray-500 text-center italic">
                        Aggregated score across different subject categories.
                    </p>
                </GlassCard>

                {/* Score Timeline */}
                <GlassCard className="p-6 overflow-hidden">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-pink-500/20 text-pink-400 rounded-lg">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Score History</h3>
                    </div>
                    <ActivityChart data={activityData} />
                    <p className="mt-4 text-sm text-gray-500 text-center italic">
                        Your performance trend over your recent test attempts.
                    </p>
                </GlassCard>
            </div>

            {/* Insights Section */}
            <GlassCard className="p-8 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <h3 className="text-lg font-bold text-white mb-4">Focus Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <InsightItem
                            label="Strongest Subject"
                            value={performanceData.length ? performanceData.sort((a, b) => b.score - a.score)[0].subject : 'N/A'}
                        />
                        <InsightItem
                            label="Recent Improvement"
                            value={activityData.length > 2 ? `${activityData[activityData.length - 1].score - activityData[activityData.length - 2].score}%` : 'Not enough data'}
                        />
                    </div>
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                        <p className="text-sm text-gray-300 leading-relaxed">
                            <span className="text-primary font-bold">Pro Tip:</span> Your topic mastery is highest in {performanceData.length ? performanceData.sort((a, b) => b.score - a.score)[0].subject : 'your studies'}! Try generating a "Hard" difficulty test in your weakest area to boost your consistency score.
                        </p>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}

function StatMetric({ title, value, icon: Icon, color }) {
    return (
        <GlassCard className="p-6 group hover:bg-white/5 transition-all">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">{title}</span>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform origin-left">{value}</div>
        </GlassCard>
    );
}

function InsightItem({ label, value }) {
    return (
        <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-glass-border">
            <span className="text-sm text-gray-400">{label}</span>
            <span className="text-sm font-bold text-primary">{value}</span>
        </div>
    );
}
