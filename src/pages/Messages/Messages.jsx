import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GlassCard } from '../../components/UI/GlassCard';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Send, Plus, Search, MessageSquare, ChevronLeft, Circle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { UserBadge } from '../../components/UI/UserBadge';

export default function Messages() {
    const { user, profile } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeConvId, setActiveConvId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);

    // New Chat State
    const [showNewChat, setShowNewChat] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    // Presence State
    const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
    const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
    const presenceChannelRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const messagesEndRef = useRef(null);
    const activeConvIdRef = useRef(activeConvId);

    useEffect(() => {
        activeConvIdRef.current = activeConvId;
    }, [activeConvId]);

    useEffect(() => {
        if (user) fetchConversations();

        // Subscribe to new messages for the user
        const channel = supabase
            .channel(`public:direct_messages`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'direct_messages'
            }, (payload) => {
                handleRealtimeMessage(payload.new);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user]);

    // Presence channel for active conversation
    useEffect(() => {
        if (!activeConvId || !user) return;

        // Clean up previous presence channel
        if (presenceChannelRef.current) {
            supabase.removeChannel(presenceChannelRef.current);
        }

        const presenceChannel = supabase.channel(`presence:dm:${activeConvId}`, {
            config: { presence: { key: user.id } }
        });

        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const state = presenceChannel.presenceState();
                const otherUser = conversations.find(c => c.id === activeConvId)?.otherUser;
                if (otherUser) {
                    const otherPresence = state[otherUser.id];
                    setIsOtherUserOnline(!!otherPresence && otherPresence.length > 0);
                    const isTyping = otherPresence?.[0]?.isTyping || false;
                    setIsOtherUserTyping(isTyping);
                }
            })
            .on('presence', { event: 'join' }, ({ key }) => {
                const otherUser = conversations.find(c => c.id === activeConvId)?.otherUser;
                if (key === otherUser?.id) setIsOtherUserOnline(true);
            })
            .on('presence', { event: 'leave' }, ({ key }) => {
                const otherUser = conversations.find(c => c.id === activeConvId)?.otherUser;
                if (key === otherUser?.id) {
                    setIsOtherUserOnline(false);
                    setIsOtherUserTyping(false);
                }
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await presenceChannel.track({
                        online_at: new Date().toISOString(),
                        isTyping: false
                    });
                }
            });

        presenceChannelRef.current = presenceChannel;

        return () => {
            if (presenceChannelRef.current) {
                supabase.removeChannel(presenceChannelRef.current);
                presenceChannelRef.current = null;
            }
        };
    }, [activeConvId, user, conversations]);

    // Handle typing broadcast
    const handleInputChange = useCallback((e) => {
        const value = e.target.value;
        setNewMessage(value);

        if (presenceChannelRef.current) {
            presenceChannelRef.current.track({
                online_at: new Date().toISOString(),
                isTyping: value.length > 0
            });

            // Clear typing after 2 seconds of inactivity
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                if (presenceChannelRef.current) {
                    presenceChannelRef.current.track({
                        online_at: new Date().toISOString(),
                        isTyping: false
                    });
                }
            }, 2000);
        }
    }, []);

    useEffect(() => {
        if (activeConvId) {
            fetchMessages(activeConvId);
            markAsRead(activeConvId);
        }
    }, [activeConvId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    async function handleRealtimeMessage(msg) {
        // Use ref to check current active conversation without stale closure
        if (activeConvIdRef.current && msg.conversation_id === activeConvIdRef.current) {
            setMessages(prev => {
                const exists = prev.find(m => m.id === msg.id);
                if (exists) return prev;
                return [...prev, msg];
            });
            // Mark as read if we are looking at this conversation
            if (msg.sender_id !== user.id) {
                markAsRead(activeConvIdRef.current);
            }
        }

        // Update the conversation's last_message_at in the list
        setConversations(prev => {
            let convFound = false;
            const updated = prev.map(c => {
                if (c.id === msg.conversation_id) {
                    convFound = true;
                    return { ...c, last_message_at: msg.created_at };
                }
                return c;
            });

            if (convFound) {
                return updated.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
            } else {
                // If it's a new conversation, we might need to fetch it or ignoring it until refresh
                // For now just return updated to be safe, but ideally we should fetch the new conv if not found
                // We'll leave that for a more robust refactor if needed.
                return updated;
            }
        });
    }

    async function fetchConversations() {
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select(`
                    id, last_message_at,
                    user1:profiles!user1_id(id, username, avatar_url, badges),
                    user2:profiles!user2_id(id, username, avatar_url, badges)
                `)
                .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
                .order('last_message_at', { ascending: false });

            if (error) throw error;

            const formatted = data.map(c => {
                const other = c.user1.id === user.id ? c.user2 : c.user1;
                return { ...c, otherUser: other };
            });

            setConversations(formatted);
            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    }

    async function fetchMessages(convId) {
        const { data } = await supabase
            .from('direct_messages')
            .select('*')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true });
        setMessages(data || []);
    }

    async function markAsRead(convId) {
        await supabase
            .from('direct_messages')
            .update({ is_read: true })
            .eq('conversation_id', convId)
            .neq('sender_id', user.id);
    }

    async function sendMessage(e) {
        e.preventDefault();
        if (!newMessage.trim() || !activeConvId) return;

        const content = newMessage;
        const tempId = `temp-${Date.now()}`;
        const optimisticMsg = {
            id: tempId,
            conversation_id: activeConvId,
            sender_id: user.id,
            content: content,
            created_at: new Date().toISOString(),
            is_optimistic: true // Flag to identify temp messages
        };

        try {
            setNewMessage('');
            // Optimistic Update
            setMessages(prev => [...prev, optimisticMsg]);

            // Update conversation list order optimistically
            setConversations(prev => {
                return prev.map(c => {
                    if (c.id === activeConvId) {
                        return { ...c, last_message_at: optimisticMsg.created_at };
                    }
                    return c;
                }).sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
            });

            const { data, error } = await supabase
                .from('direct_messages')
                .insert({
                    conversation_id: activeConvId,
                    sender_id: user.id,
                    content
                })
                .select()
                .single();

            if (error) throw error;

            // Replace optimistic message with real one
            if (data) {
                setMessages(prev => prev.map(m => m.id === tempId ? data : m));
            }

            await supabase
                .from('conversations')
                .update({ last_message_at: new Date().toISOString() })
                .eq('id', activeConvId);

        } catch (err) {
            console.error(err);
            // Revert optimistic update on error
            setMessages(prev => prev.filter(m => m.id !== tempId));
            alert("Failed to send message");
        }
    }

    async function searchUsers(q) {
        setSearchTerm(q);
        if (q.length < 2) {
            setSearchResults([]);
            return;
        }

        const { data } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, badges')
            .ilike('username', `%${q}%`)
            .neq('id', user.id)
            .eq('allow_dms', true)
            .limit(5);

        setSearchResults(data || []);
    }

    async function startConversation(otherUser) {
        let convId;
        const exists = conversations.find(c => c.otherUser.id === otherUser.id);

        if (exists) {
            convId = exists.id;
        } else {
            const id1 = user.id < otherUser.id ? user.id : otherUser.id;
            const id2 = user.id < otherUser.id ? otherUser.id : user.id;

            const { data, error } = await supabase
                .from('conversations')
                .insert({ user1_id: id1, user2_id: id2 })
                .select()
                .single();

            if (error && error.code === '23505') {
                fetchConversations();
                return;
            }
            if (data) convId = data.id;
        }

        if (convId) {
            setActiveConvId(convId);
            setShowNewChat(false);
            setSearchTerm('');
            fetchConversations();
        }
    }

    return (
        <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] flex flex-col md:flex-row gap-6 relative">
            {/* Sidebar List */}
            <GlassCard className={cn(
                "w-full md:w-1/3 flex flex-col p-0 overflow-hidden",
                activeConvId && "hidden md:flex"
            )}>
                <div className="p-4 border-b border-glass-border flex justify-between items-center bg-background/50">
                    <h2 className="font-bold text-white">Messages</h2>
                    <button
                        onClick={() => setShowNewChat(true)}
                        className="p-2 bg-primary/20 hover:bg-primary/40 rounded-full text-primary transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {conversations.map(c => (
                        <div
                            key={c.id}
                            onClick={() => setActiveConvId(c.id)}
                            className={cn(
                                "p-4 border-b border-glass-border cursor-pointer hover:bg-white/5 transition-colors flex items-center gap-3",
                                activeConvId === c.id ? "bg-white/10" : ""
                            )}
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                {c.otherUser.username[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                    <h4 className="text-[rgb(var(--text-main))] font-medium truncate">{c.otherUser.username}</h4>
                                    <span className="text-[10px] text-gray-500">
                                        {new Date(c.last_message_at).toLocaleDateString()}
                                    </span>
                                </div>
                                {c.otherUser.badges && c.otherUser.badges.length > 0 && (
                                    <div className="flex gap-1 mt-1">
                                        {c.otherUser.badges.slice(0, 1).map(b => (
                                            <span key={b} className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                                {b}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {conversations.length === 0 && (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            No conversations yet. Start one!
                        </div>
                    )}
                </div>
            </GlassCard >

            {/* Chat Area */}
            < GlassCard className={
                cn(
                    "flex-1 flex flex-col p-0 overflow-hidden relative",
                    !activeConvId && "hidden md:flex"
                )
            }>
                {
                    activeConvId ? (
                        <>
                            {/* Header */}
                            < div className="p-3 md:p-4 border-b border-glass-border bg-background/50 backdrop-blur-md flex items-center gap-3" >
                                <button
                                    onClick={() => setActiveConvId(null)}
                                    className="p-2 -ml-2 text-gray-400 hover:text-[rgb(var(--text-main))] md:hidden"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <div className="relative">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                        {conversations.find(c => c.id === activeConvId)?.otherUser.username[0].toUpperCase()}
                                    </div>
                                    {isOtherUserOnline && (
                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-[rgb(var(--text-main))] font-bold flex items-center gap-2 truncate">
                                        {conversations.find(c => c.id === activeConvId)?.otherUser.username}
                                        <span className="hidden sm:inline">
                                            <UserBadge badges={conversations.find(c => c.id === activeConvId)?.otherUser.badges} />
                                        </span>
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        {isOtherUserTyping ? (
                                            <span className="text-primary animate-pulse">typing...</span>
                                        ) : isOtherUserOnline ? (
                                            <span className="text-green-400">Online</span>
                                        ) : (
                                            <span>Offline</span>
                                        )}
                                    </p>
                                </div>
                            </div >

                            {/* Messages */}
                            < div className="flex-1 overflow-y-auto p-4 space-y-3" >
                                {
                                    messages.map((msg, i) => {
                                        const isMe = msg.sender_id === user.id;
                                        return (
                                            <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                                                <div className={cn(
                                                    "max-w-[85%] md:max-w-[70%] px-4 py-2 rounded-2xl text-sm",
                                                    isMe ? "bg-primary text-white rounded-tr-none" : "bg-background-lighter border border-glass-border text-[rgb(var(--text-main))] rounded-tl-none"
                                                )}>
                                                    {msg.content}
                                                    <div className={cn("text-[9px] mt-1 text-right opacity-70", isMe ? "text-white" : "text-gray-500")}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                }
                                < div ref={messagesEndRef} />
                            </div >

                            {/* Input */}
                            < form onSubmit={sendMessage} className="p-3 md:p-4 border-t border-glass-border bg-background/50" >
                                <div className="flex gap-2">
                                    <input
                                        className="flex-1 bg-background-lighter border border-glass-border rounded-xl px-4 py-2 text-sm text-[rgb(var(--text-main))] focus:outline-none focus:border-primary"
                                        placeholder="Type a message..."
                                        value={newMessage}
                                        onChange={handleInputChange}
                                    />
                                    <button disabled={!newMessage.trim()} type="submit" className="p-2 md:p-3 bg-primary rounded-xl text-white hover:bg-primary-glow transition-all disabled:opacity-50">
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </form >
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                            <p>Select a conversation to start chatting</p>
                        </div>
                    )}
            </GlassCard >

            {/* New Chat Modal */}
            {
                showNewChat && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <GlassCard className="w-full max-w-md p-6 bg-background">
                            <h3 className="text-xl font-bold text-[rgb(var(--text-main))] mb-4">New Message</h3>
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    className="w-full bg-background-lighter border border-glass-border rounded-lg pl-9 pr-4 py-2 text-[rgb(var(--text-main))] focus:outline-none focus:border-primary"
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => searchUsers(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {searchResults.map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => startConversation(u)}
                                        className="w-full text-left p-3 rounded-lg hover:bg-white/10 flex items-center gap-3 transition-colors text-gray-300 hover:text-[rgb(var(--text-white))]"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                            {u.username[0].toUpperCase()}
                                        </div>
                                        <span className="truncate flex-1 text-[rgb(var(--text-main))]">{u.username}</span>
                                        {u.badges && u.badges.length > 0 && (
                                            <span className="text-[10px] text-yellow-400 border border-yellow-500/30 px-1.5 rounded-full">
                                                {u.badges[0]}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-end mt-4">
                                <button onClick={() => setShowNewChat(false)} className="text-gray-400 hover:text-[rgb(var(--text-main))]">Cancel</button>
                            </div>
                        </GlassCard>
                    </div>
                )
            }
        </div >
    );
}
