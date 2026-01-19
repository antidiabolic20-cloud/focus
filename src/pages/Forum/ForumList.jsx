import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../components/UI/GlassCard';
import { supabase } from '../../lib/supabase';
import { MessageSquare, Clock, ArrowRight, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

export default function ForumList() {
    const [threads, setThreads] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');

    useEffect(() => {
        fetchForumData();
    }, []);

    async function fetchForumData() {
        try {
            setLoading(true);

            // Fetch Categories
            const { data: catData } = await supabase
                .from('categories')
                .select('*');

            if (catData) setCategories(catData);

            // Fetch Threads (with author info if available)
            const { data: threadData, error } = await supabase
                .from('threads')
                .select(`
          *,
          author:profiles(username, avatar_url),
          category:categories(name, color, slug)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setThreads(threadData || []);
        } catch (error) {
            console.error('Error fetching forum data:', error.message);
        } finally {
            setLoading(false);
        }
    }

    const filteredThreads = activeCategory === 'all'
        ? threads
        : threads.filter(t => t.category?.slug === activeCategory);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Discussion Forums</h1>
                    <p className="text-gray-400 mt-2">Join the community and ask questions.</p>
                </div>
                <Link to="/forums/create" className="bg-primary hover:bg-primary-glow text-white px-6 py-2.5 rounded-lg font-medium shadow-neon-purple transition-all">
                    Start Discussion
                </Link>
            </div>

            {/* Category Filters */}
            <div className="flex gap-4 overflow-x-auto pb-4">
                <button
                    onClick={() => setActiveCategory('all')}
                    className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border",
                        activeCategory === 'all'
                            ? "bg-primary text-white border-primary shadow-neon-purple/20"
                            : "bg-background-lighter text-gray-400 border-glass-border hover:border-primary/50 hover:text-white"
                    )}
                >
                    All Topics
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.slug)}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border",
                            activeCategory === cat.slug
                                ? "bg-primary text-white border-primary shadow-neon-purple/20"
                                : "bg-background-lighter text-gray-400 border-glass-border hover:border-primary/50 hover:text-white"
                        )}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Thread List */}
            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-20 text-gray-500">Loading community discussions...</div>
                ) : filteredThreads.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">No discussions found in this category.</div>
                ) : (
                    filteredThreads.map((thread) => (
                        <Link key={thread.id} to={`/forums/${thread.id}`}>
                            <GlassCard className="group cursor-pointer hover:border-primary/30 p-5 transition-all">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={cn(
                                                "text-xs px-2 py-0.5 rounded-full border bg-white/5",
                                                "text-primary border-primary/20"
                                            )}>
                                                {thread.category?.name || 'General'}
                                            </span>
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(thread.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors mb-2">
                                            {thread.title}
                                        </h3>
                                        <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                                            {thread.body}
                                        </p>

                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <div className="w-5 h-5 rounded-full bg-gray-700 overflow-hidden">
                                                    {/* Avatar Placeholder */}
                                                    {thread.author?.avatar_url ? (
                                                        <img src={thread.author.avatar_url} alt="User" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-700 text-xs text-white">
                                                            {thread.author?.username?.[0] || 'U'}
                                                        </div>
                                                    )}
                                                </div>
                                                <span>{thread.author?.username || 'Anonymous'}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                0 replies
                                            </div>
                                        </div>
                                    </div>

                                    <div className="hidden md:flex flex-col items-end gap-2 text-gray-500">
                                        <div className="flex items-center gap-1 text-xs">
                                            <TrendingUp className="w-3.5 h-3.5" />
                                            {thread.views || 0} views
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
