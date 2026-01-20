import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../components/UI/GlassCard';
import { NeonButton } from '../../components/UI/NeonButton';
import { supabase } from '../../lib/supabase';
import { Clock, BarChart, AlertCircle, Play, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { CustomTestModal } from '../../components/MockTests/CustomTestModal';

export default function TestList() {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [showAIModal, setShowAIModal] = useState(false);

    useEffect(() => {
        fetchTests();
    }, []);

    async function fetchTests() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('tests')
                .select(`
          *,
          category:categories(name, color, slug)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTests(data || []);
        } catch (error) {
            console.error('Error fetching tests:', error);
        } finally {
            setLoading(false);
        }
    }

    const filteredTests = filter === 'all'
        ? tests
        : tests.filter(t => t.category?.slug === filter || t.difficulty.toLowerCase() === filter);

    // Get unique categories and difficulties for filter chips
    const filters = ['all', 'Easy', 'Medium', 'Hard'];

    return (
        <div className="space-y-8 relative">
            {showAIModal && <CustomTestModal onClose={() => setShowAIModal(false)} />}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Mock Tests</h1>
                    <p className="text-gray-400 mt-2">Challenge yourself and track your progress.</p>
                </div>
                <NeonButton
                    onClick={() => setShowAIModal(true)}
                    className="bg-gradient-to-r from-pink-500 to-violet-600 border-none text-white shadow-lg hover:shadow-pink-500/25"
                >
                    <Sparkles className="w-5 h-5 mr-2 animate-pulse" /> AI Test Generator
                </NeonButton>
            </div>

            {/* Filters */}
            <div className="flex gap-3 overflow-x-auto pb-2">
                {filters.map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                            filter === f
                                ? "bg-primary text-white border-primary shadow-neon-purple/20"
                                : "bg-background-lighter text-gray-400 border-glass-border hover:text-white"
                        )}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-20 text-gray-500">Loading tests...</div>
                ) : filteredTests.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-gray-500">
                        No tests found matching your criteria.
                    </div>
                ) : filteredTests.map((test) => (
                    <GlassCard key={test.id} className="flex flex-col h-full hover:border-primary/50 transition-colors group relative overflow-hidden">
                        {/* Decorational Gradient */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>

                        <div className="mb-4">
                            <span className={cn(
                                "text-xs px-2 py-1 rounded-full border mb-3 inline-block font-medium",
                                // Simple color logic based on difficulty for now
                                test.difficulty === 'Easy' ? "text-green-400 border-green-500/20 bg-green-500/10" :
                                    test.difficulty === 'Medium' ? "text-yellow-400 border-yellow-500/20 bg-yellow-500/10" :
                                        "text-red-400 border-red-500/20 bg-red-500/10"
                            )}>
                                {test.difficulty}
                            </span>
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{test.title}</h3>
                            <p className="text-gray-400 text-sm line-clamp-2">{test.description}</p>
                        </div>

                        <div className="mt-auto pt-6 border-t border-glass-border space-y-4">
                            <div className="flex items-center justify-between text-sm text-gray-400">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    {test.duration_minutes} min
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <BarChart className="w-4 h-4" />
                                    {test.category?.name || 'General'}
                                </div>
                            </div>

                            <Link to={`/tests/${test.id}`} className="block">
                                <NeonButton className="w-full justify-center group-hover:shadow-neon-purple/50">
                                    Start Test <Play className="w-4 h-4 ml-2 fill-current" />
                                </NeonButton>
                            </Link>
                        </div>
                    </GlassCard>
                ))}
            </div>
        </div>
    );
}
