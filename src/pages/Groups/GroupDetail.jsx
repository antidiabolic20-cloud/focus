import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GlassCard } from '../../components/UI/GlassCard';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Send, Users, Shield, Copy, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { UserBadge } from '../../components/UI/UserBadge';

export default function GroupDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);

    const [group, setGroup] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!user) return;
        fetchGroupDetails();

        // Subscribe to real-time messages
        const channel = supabase
            .channel(`group_chat:${id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'group_messages',
                filter: `group_id=eq.${id}`
            }, (payload) => {
                // Fetch full author details (since payload only has IDs)
                fetchNewMessageWithAuthor(payload.new.id);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id, user]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    async function fetchNewMessageWithAuthor(msgId) {
        // First check if we already have it (optimistic)
        setMessages(prev => {
            const exists = prev.find(m => m.id === msgId);
            if (exists) return prev;
            return prev; // We still need to fetch details for others
        });

        const { data } = await supabase
            .from('group_messages')
            .select(`
                *,
                author:profiles(username, avatar_url, badges)
            `)
            .eq('id', msgId)
            .single();

        if (data) {
            setMessages(prev => {
                // Check again to avoid race conditions with optimistic updates
                const exists = prev.find(m => m.id === data.id);
                if (exists) {
                    // Update existing optimistic message with real data (like created_at from server)
                    return prev.map(m => m.id === data.id ? data : m);
                }

                // Also check if we have a temporary message that matches this content and author
                const tempMatch = prev.find(m => m.is_optimistic && m.content === data.content && m.author_id === data.author_id);
                if (tempMatch) {
                    return prev.map(m => m.id === tempMatch.id ? data : m);
                }

                return [...prev, data];
            });
        }
    }

    async function fetchGroupDetails() {
        try {
            setLoading(true);

            // 1. Get Group Info
            const { data: groupData, error: groupError } = await supabase
                .from('groups')
                .select('*')
                .eq('id', id)
                .single();

            if (groupError) throw groupError;
            setGroup(groupData);

            // 2. Load Messages
            const { data: msgData, error: msgError } = await supabase
                .from('group_messages')
                .select(`
                    *,
                    author:profiles(username, avatar_url, badges)
                `)
                .eq('group_id', id)
                .order('created_at', { ascending: true });

            if (msgError) throw msgError;
            setMessages(msgData || []);

        } catch (error) {
            console.error("Error loading group:", error);
            navigate('/groups'); // Redirect if invalid
        } finally {
            setLoading(false);
        }
    }

    async function handleSendMessage(e) {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const content = newMessage;
        const tempId = `temp-${Date.now()}`;

        // Find current user profile for optimistic state
        // We can get it from the first message author details or assume simple user object
        const authorInfo = messages.find(m => m.author_id === user.id)?.author || {
            username: user.email.split('@')[0], // Fallback
            avatar_url: null,
            badges: []
        };

        const optimisticMsg = {
            id: tempId,
            group_id: id,
            content: content,
            author_id: user.id,
            author: authorInfo,
            created_at: new Date().toISOString(),
            is_optimistic: true
        };

        try {
            setNewMessage(''); // Optimistic clear
            setMessages(prev => [...prev, optimisticMsg]);

            const { data, error } = await supabase
                .from('group_messages')
                .insert({
                    group_id: id,
                    content: content,
                    author_id: user.id
                })
                .select(`
                    *,
                    author:profiles(username, avatar_url, badges)
                `)
                .single();

            if (error) throw error;

            if (data) {
                setMessages(prev => prev.map(m => m.id === tempId ? data : m));
            }
        } catch (err) {
            console.error(err);
            setMessages(prev => prev.filter(m => m.id !== tempId));
            alert("Failed to send message");
        }
    }

    function copyInviteCode() {
        if (!group?.invite_code) return;
        navigator.clipboard.writeText(group.invite_code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    if (loading) return <div className="text-center py-20 text-gray-500">Loading Group...</div>;
    if (!group) return <div className="text-center py-20 text-red-500">Group not found.</div>;

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        {group.name}
                        {group.is_private && <Shield className="w-4 h-4 text-primary" />}
                    </h1>
                    <p className="text-gray-400 text-sm">{group.description}</p>
                </div>
                <button
                    onClick={copyInviteCode}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono border border-glass-border transition-colors cursor-pointer"
                    title="Click to copy invite code"
                >
                    <span className="text-gray-400">Invite Code:</span>
                    <span className="text-primary font-bold">{group.invite_code}</span>
                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
                </button>
            </div>

            {/* Chat Container */}
            <GlassCard className="flex-1 overflow-hidden flex flex-col p-0 relative">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-primary/20">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
                            <MessageSquare className="w-12 h-12 mb-2" /> {/* Assuming MessageSquare is available or use generic icon */}
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            const isMe = msg.author_id === user.id;
                            const showHeader = idx === 0 || messages[idx - 1].author_id !== msg.author_id;

                            return (
                                <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                                    {showHeader && (
                                        <div className="flex items-center gap-2 mb-1 ml-1">
                                            <span className="text-xs text-gray-500">{msg.author?.username || 'Unknown'}</span>
                                            <UserBadge badges={msg.author?.badges} />
                                        </div>
                                    )}
                                    <div
                                        className={cn(
                                            "max-w-[70%] px-4 py-2 rounded-2xl text-sm leading-relaxed",
                                            isMe
                                                ? "bg-primary text-white rounded-tr-none shadow-neon-purple/20"
                                                : "bg-background-lighter border border-glass-border rounded-tl-none text-gray-200"
                                        )}
                                    >
                                        {msg.content}
                                    </div>
                                    <span className="text-[10px] text-gray-600 mt-1 px-1">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="p-4 bg-background/50 border-t border-glass-border backdrop-blur-md">
                    <div className="flex gap-2">
                        <input
                            className="flex-1 bg-background-lighter border border-glass-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors placeholder:text-gray-600"
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button
                            type="button" // Actually type=submit
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                            className="bg-primary hover:bg-primary-glow text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-neon-purple/20"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </form>
            </GlassCard>
        </div>
    );
}

// Helper icon import fix if needed, assuming Lucide icons are used standardly.
import { MessageSquare } from 'lucide-react';
