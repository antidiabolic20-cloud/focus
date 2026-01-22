import React, { useState } from 'react';
import { GlassCard } from '../UI/GlassCard';
import { Download, Heart, FileText, Image, MoreVertical, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { UserBadge } from '../UI/UserBadge';

export function ResourceCard({ resource, onLike, onDelete }) {
    const { user } = useAuth();
    const [downloading, setDownloading] = useState(false);
    const [isLiked, setIsLiked] = useState(resource.is_liked);
    const [likesCount, setLikesCount] = useState(resource.likes_count);

    const isAuthor = user?.id === resource.author_id;

    const handleDownload = async () => {
        try {
            setDownloading(true);
            const { data, error } = await supabase.storage
                .from('resource_entries')
                .download(resource.file_url);

            if (error) throw error;

            // Increment download count (optimistic for UI, but separate update for DB)
            await supabase.rpc('increment_downloads', { row_id: resource.id });

            const url = window.URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', resource.title);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Download failed:', error);
            alert('Download failed. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    const handleLike = async () => {
        if (!user) return;

        // Optimistic update
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);

        try {
            if (newIsLiked) {
                await supabase.from('resource_likes').insert({ resource_id: resource.id, user_id: user.id });
                // Also update count in resources table (RPC usually better but simple update works for now)
                await supabase.rpc('increment_likes', { row_id: resource.id });
            } else {
                await supabase.from('resource_likes').delete().eq('resource_id', resource.id).eq('user_id', user.id);
                await supabase.rpc('decrement_likes', { row_id: resource.id });
            }
        } catch (error) {
            console.error('Like failed:', error);
            // Revert
            setIsLiked(!newIsLiked);
            setLikesCount(prev => !newIsLiked ? prev + 1 : prev - 1);
        }
    };

    return (
        <GlassCard className="group relative overflow-hidden transition-all hover:scale-[1.02] hover:shadow-neon-purple/20">
            <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    {resource.file_type === 'application/pdf' ? <FileText className="w-6 h-6" /> : <Image className="w-6 h-6" />}
                </div>
                {isAuthor && (
                    <button
                        onClick={() => onDelete(resource.id)}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            <h3 className="font-bold text-white mb-1 truncate" title={resource.title}>{resource.title}</h3>
            <p className="text-sm text-gray-400 mb-4 line-clamp-2 h-10">{resource.description}</p>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-glass-border">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleLike}
                        className={cn(
                            "flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg transition-colors",
                            isLiked ? "text-pink-500 bg-pink-500/10" : "text-gray-400 hover:bg-white/5"
                        )}
                    >
                        <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-current")} />
                        {likesCount}
                    </button>
                    <span className="text-xs text-gray-500">{resource.downloads} downloads</span>
                </div>

                <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="p-2 bg-white/5 hover:bg-primary hover:text-white text-gray-400 rounded-lg transition-all"
                >
                    <Download className="w-4 h-4" />
                </button>
            </div>

            <div className="absolute top-4 right-4 text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-glass-border">
                {resource.subject}
            </div>
        </GlassCard>
    );
}
