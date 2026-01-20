import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GlassCard } from '../../components/UI/GlassCard';
import { NeonButton } from '../../components/UI/NeonButton';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { MessageSquare, Clock, User, Send } from 'lucide-react';
import { cn } from '../../lib/utils';
import { UserBadge } from '../../components/UI/UserBadge';

export default function ThreadView() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [thread, setThread] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchThreadData();
    }, [id]);

    async function fetchThreadData() {
        try {
            setLoading(true);
            // Fetch Thread
            const { data: threadData, error: threadError } = await supabase
                .from('threads')
                .select(`*, author:profiles(username, avatar_url, level, badges), category:categories(name, color)`)
                .eq('id', id)
                .single();

            if (threadError) throw threadError;
            setThread(threadData);

            // Increment views
            await supabase.rpc('increment_view', { row_id: id });
            await supabase.from('threads').update({ views: (threadData.views || 0) + 1 }).eq('id', id);

            // Fetch Comments
            fetchComments();

        } catch (err) {
            console.error("Error fetching thread:", err);
            navigate('/forums'); // Fallback
        } finally {
            setLoading(false);
        }
    }

    async function fetchComments() {
        const { data } = await supabase
            .from('comments')
            .select(`*, author:profiles(username, avatar_url, badges)`)
            .eq('thread_id', id)
            .order('created_at', { ascending: true });

        if (data) setComments(data);
    }

    async function handlePostComment(e) {
        e.preventDefault();
        if (!newComment.trim() || !user) return;

        try {
            setSubmitting(true);
            const { error } = await supabase.from('comments').insert({
                body: newComment,
                thread_id: id,
                author_id: user.id
            });

            if (error) throw error;

            setNewComment('');
            fetchComments();
        } catch (err) {
            console.error("Error posting comment", err);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <div className="text-center text-gray-500 py-10">Loading discussion...</div>;
    if (!thread) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Thread Content */}
            <GlassCard className="p-8">
                <div className="flex items-center gap-4 mb-6">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        {thread.category?.name}
                    </span>
                    <span className="text-gray-500 text-sm flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(thread.created_at).toLocaleDateString()}
                    </span>
                </div>

                <h1 className="text-3xl font-bold text-white mb-6">{thread.title}</h1>
                <div className="prose prose-invert max-w-none text-gray-300 mb-8 whitespace-pre-wrap">
                    {thread.body}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-glass-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary p-0.5">
                            <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                                {thread.author?.avatar_url ? (
                                    <img src={thread.author.avatar_url} alt="Author" />
                                ) : (
                                    <User className="w-5 h-5 text-gray-400" />
                                )}
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-white">{thread.author?.username}</p>
                                <UserBadge badges={thread.author?.badges} />
                            </div>
                            <p className="text-xs text-primary">Level {thread.author?.level || 1}</p>
                        </div>
                    </div>

                    {/* Could add like/share buttons here */}
                </div>
            </GlassCard>

            {/* Comments Section */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    {comments.length} Comments
                </h3>

                {/* Comment List */}
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <GlassCard key={comment.id} className="p-6 bg-glass/50">
                            <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden">
                                        {comment.author?.avatar_url ? (
                                            <img src={comment.author.avatar_url} alt="User" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-700 text-xs text-white">
                                                {comment.author?.username?.[0] || 'U'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-baseline justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-white text-sm">{comment.author?.username}</span>
                                            <UserBadge badges={comment.author?.badges} />
                                        </div>
                                        <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{comment.body}</p>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>

                {/* Add Comment Form */}
                {user ? (
                    <GlassCard className="p-6">
                        <form onSubmit={handlePostComment} className="flex gap-4">
                            <div className="flex-shrink-0 pt-2">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="text-xs font-bold text-primary">ME</span>
                                </div>
                            </div>
                            <div className="flex-1 space-y-4">
                                <textarea
                                    className="w-full bg-background-lighter border border-glass-border rounded-lg px-4 py-3 text-white focus:border-primary outline-none resize-none"
                                    rows={3}
                                    placeholder="Add to the discussion..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                />
                                <div className="flex justify-end">
                                    <NeonButton type="submit" size="sm" disabled={submitting}>
                                        <Send className="w-4 h-4 mr-2" />
                                        {submitting ? 'Posting...' : 'Post Comment'}
                                    </NeonButton>
                                </div>
                            </div>
                        </form>
                    </GlassCard>
                ) : (
                    <div className="text-center py-8 bg-white/5 rounded-xl border border-glass-border">
                        <p className="text-gray-400 mb-4">Log in to join the conversation.</p>
                        <NeonButton onClick={() => navigate('/login')}>Login Now</NeonButton>
                    </div>
                )}
            </div>
        </div>
    );
}
