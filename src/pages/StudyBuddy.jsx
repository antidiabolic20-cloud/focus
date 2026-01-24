import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/UI/GlassCard';
import { NeonButton } from '../components/UI/NeonButton';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { User, BookOpen, MessageSquare, Search, X, Check, Handshake, Loader, UserPlus, Users, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { friendService } from '../services/friendService';

export default function StudyBuddy() {
    const { user, profile } = useAuth();
    const [activeTab, setActiveTab] = useState('find'); // 'find', 'buddies', 'requests'

    // Find Partner State
    const [status, setStatus] = useState('inactive');
    const [partners, setPartners] = useState([]);
    const [loadingPartners, setLoadingPartners] = useState(false);
    const [topics, setTopics] = useState('');

    // Friends State
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]); // Incoming
    const [sentRequests, setSentRequests] = useState([]); // Outgoing
    const [loadingFriends, setLoadingFriends] = useState(false);

    useEffect(() => {
        if (user) {
            checkUserStatus();
            fetchFriendsData();
            // Initial fetch if active
            fetchPartners();
        }
    }, [user]);

    // --- Friend System Logic ---

    async function fetchFriendsData() {
        if (!user) return;
        setLoadingFriends(true);
        try {
            const allData = await friendService.getFriendsAndRequests(user.id);

            const myFriends = [];
            const incoming = [];
            const outgoing = [];

            allData.forEach(item => {
                if (item.status === 'accepted') {
                    // Determine which profile is the friend
                    const friendProfile = item.user_id === user.id ? item.receiver : item.sender;
                    myFriends.push({ ...item, friendProfile });
                } else if (item.status === 'pending') {
                    if (item.user_id === user.id) {
                        outgoing.push({ ...item, friendProfile: item.receiver });
                    } else {
                        incoming.push({ ...item, friendProfile: item.sender });
                    }
                }
            });

            setFriends(myFriends);
            setRequests(incoming);
            setSentRequests(outgoing);
        } catch (error) {
            console.error("Error fetching friends:", error);
        } finally {
            setLoadingFriends(false);
        }
    }

    async function handleAddBuddy(partnerId) {
        try {
            await friendService.sendRequest(partnerId, user.id);
            fetchFriendsData(); // Refresh to update UI state
            // Optionally update local partner state to show "Pending" immediately
            setPartners(prev => prev.map(p =>
                p.user_id === partnerId ? { ...p, friendshipStatus: 'sent_pending' } : p
            ));
        } catch (error) {
            console.error(error);
            alert("Failed to send request");
        }
    }

    async function handleAccept(requestId) {
        try {
            await friendService.acceptRequest(requestId);
            fetchFriendsData();
        } catch (error) {
            console.error(error);
        }
    }

    async function handleRemove(requestId) {
        try {
            await friendService.removeFriend(requestId);
            fetchFriendsData();
        } catch (error) {
            console.error(error);
        }
    }


    // --- Existing Match Logic ---

    async function checkUserStatus() {
        try {
            const { data } = await supabase.from('partner_requests').select('*').eq('user_id', user.id).maybeSingle();
            if (data?.status === 'active') {
                setStatus('active');
                setTopics(data.looking_for?.join(', ') || '');
            } else {
                setStatus('inactive');
            }
        } catch (err) { console.error(err); }
    }

    async function fetchPartners() {
        try {
            setLoadingPartners(true);
            const { data } = await supabase
                .from('partner_requests')
                .select(`*, profile:profiles(*)`)
                .eq('status', 'active')
                .neq('user_id', user.id);

            if (data) {
                // Get fresh friend status to mark buttons correctly
                const allFriendData = await friendService.getFriendsAndRequests(user.id);

                const scoredPartners = data.map(p => {
                    // Calculate Score
                    let score = 0;
                    const mySubjects = profile?.subjects_of_interest || [];
                    const theirSubjects = p.profile?.subjects_of_interest || [];
                    const theirRequest = p.looking_for || [];

                    const overlap1 = theirRequest.filter(t => mySubjects.some(s => s.toLowerCase().includes(t.toLowerCase()))).length;
                    const overlap2 = theirSubjects.filter(s => mySubjects.some(m => m.toLowerCase().includes(s.toLowerCase()))).length;

                    if (p.profile?.study_style && profile?.study_style && p.profile.study_style === profile.study_style) score += 30;
                    score += (overlap1 * 20) + (overlap2 * 10);

                    // Determine Friendship Status
                    let fStatus = 'none';
                    const friendship = allFriendData.find(f =>
                        (f.user_id === user.id && f.friend_id === p.user_id) ||
                        (f.friend_id === user.id && f.user_id === p.user_id)
                    );

                    if (friendship) {
                        if (friendship.status === 'accepted') fStatus = 'accepted';
                        else if (friendship.status === 'pending') {
                            fStatus = friendship.user_id === user.id ? 'sent_pending' : 'received_pending';
                        }
                    }

                    return { ...p, matchScore: Math.min(score, 100), friendshipStatus: fStatus };
                }).sort((a, b) => b.matchScore - a.matchScore);

                setPartners(scoredPartners);
            }
        } catch (err) {
            console.error("Error fetching partners:", err);
        } finally {
            setLoadingPartners(false);
        }
    }

    async function handleStartSearching() {
        try {
            const topicList = topics.split(',').map(s => s.trim()).filter(Boolean);
            const { error } = await supabase.from('partner_requests').upsert({
                user_id: user.id,
                status: 'active',
                looking_for: topicList
            });
            if (error) throw error;
            setStatus('active');
            fetchPartners();
        } catch (err) { alert('Failed to start searching'); }
    }

    async function handleStopSearching() {
        try {
            const { error } = await supabase.from('partner_requests').update({ status: 'inactive' }).eq('user_id', user.id);
            if (error) throw error;
            setStatus('inactive');
        } catch (err) { alert('Failed to stop searching'); }
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[rgb(var(--text-main))] flex items-center gap-3">
                        <Handshake className="w-8 h-8 text-primary" />
                        Study Buddy
                    </h1>
                    <p className="text-gray-400 mt-1">Connect, Collaborate, and Conquer together.</p>
                </div>

                {/* Status Toggle (Only visible in Find tab) */}
                {activeTab === 'find' && (
                    status === 'active' ? (
                        <button onClick={handleStopSearching} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors">
                            <X className="w-4 h-4" /> Stop Searching
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <input
                                value={topics}
                                onChange={(e) => setTopics(e.target.value)}
                                placeholder="Topics (e.g. Math, Physics)"
                                className="bg-background-lighter border border-glass-border rounded-xl px-4 py-2 text-sm text-[rgb(var(--text-main))] focus:border-primary outline-none min-w-[200px]"
                            />
                            <NeonButton onClick={handleStartSearching}>
                                <Search className="w-4 h-4 mr-2" /> Find
                            </NeonButton>
                        </div>
                    )
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10 pb-1">
                <button
                    onClick={() => setActiveTab('find')}
                    className={cn("px-4 py-2 text-sm font-bold transition-all relative", activeTab === 'find' ? "text-primary" : "text-gray-400 hover:text-gray-200")}
                >
                    Find Match
                    {activeTab === 'find' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"></div>}
                </button>
                <button
                    onClick={() => { setActiveTab('buddies'); fetchFriendsData(); }}
                    className={cn("px-4 py-2 text-sm font-bold transition-all relative flex items-center gap-2", activeTab === 'buddies' ? "text-primary" : "text-gray-400 hover:text-gray-200")}
                >
                    My Buddies
                    <span className="bg-white/10 text-xs px-1.5 rounded-full">{friends.length}</span>
                    {activeTab === 'buddies' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"></div>}
                </button>
                <button
                    onClick={() => { setActiveTab('requests'); fetchFriendsData(); }}
                    className={cn("px-4 py-2 text-sm font-bold transition-all relative flex items-center gap-2", activeTab === 'requests' ? "text-primary" : "text-gray-400 hover:text-gray-200")}
                >
                    Requests
                    {requests.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">{requests.length}</span>}
                    {activeTab === 'requests' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"></div>}
                </button>
            </div>

            {/* TAB CONTENT: FIND PARTNERS */}
            {activeTab === 'find' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loadingPartners ? (
                        <div className="col-span-full py-20 text-center text-gray-500 flex flex-col items-center">
                            <Loader className="w-8 h-8 animate-spin mb-4" /> Scanning...
                        </div>
                    ) : partners.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white/5 rounded-2xl border border-white/5">
                            <User className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-[rgb(var(--text-main))] font-bold text-lg">No active partners found</h3>
                        </div>
                    ) : (
                        partners.map((p) => (
                            <GlassCard key={p.user_id} className="p-6 relative overflow-hidden group hover:border-primary/30 transition-all">
                                {p.matchScore > 0 && (
                                    <div className="absolute top-2 right-2 bg-primary/20 border border-primary/30 rounded-lg px-2 py-1">
                                        <span className="text-xs font-bold text-primary-light">{p.matchScore}% Match</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-4 mb-4">
                                    <img
                                        src={p.profile?.avatar_url || `https://ui-avatars.com/api/?name=${p.profile?.username}&background=random`}
                                        className="w-12 h-12 rounded-full border-2 border-primary/50"
                                    />
                                    <div>
                                        <h3 className="font-bold text-[rgb(var(--text-main))]">{p.profile?.username}</h3>
                                        <p className="text-xs text-gray-400">{p.profile?.academic_goals?.[0] || 'Student'}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        {p.looking_for?.map((tag, i) => (
                                            <span key={i} className="bg-white/5 px-2 py-1 rounded text-gray-300">{tag}</span>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <Link to={`/profile/${p.user_id}`} className="text-xs text-gray-400 hover:text-white">View Profile</Link>

                                        {p.friendshipStatus === 'accepted' ? (
                                            <span className="text-green-400 text-xs flex items-center gap-1 font-bold"><Check className="w-3 h-3" /> Buddy</span>
                                        ) : p.friendshipStatus === 'sent_pending' ? (
                                            <span className="text-yellow-400 text-xs flex items-center gap-1 font-bold"><Clock className="w-3 h-3" /> Sent</span>
                                        ) : p.friendshipStatus === 'received_pending' ? (
                                            <span className="text-blue-400 text-xs flex items-center gap-1 font-bold"><Clock className="w-3 h-3" /> Check Requests</span>
                                        ) : (
                                            <button
                                                onClick={() => handleAddBuddy(p.user_id)}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 hover:bg-primary text-primary hover:text-white text-xs font-bold rounded-lg transition-all"
                                            >
                                                <UserPlus className="w-3 h-3" /> Add Buddy
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </GlassCard>
                        ))
                    )}
                </div>
            )}

            {/* TAB CONTENT: MY BUDDIES */}
            {activeTab === 'buddies' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {friends.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white/5 rounded-2xl">
                            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-gray-300">You haven't added any buddies yet.</h3>
                            <p className="text-gray-500 text-sm mt-1">Go to 'Find Match' to connect with others!</p>
                        </div>
                    ) : (
                        friends.map((f) => (
                            <GlassCard key={f.id} className="p-5 flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <img
                                            src={f.friendProfile?.avatar_url || `https://ui-avatars.com/api/?name=${f.friendProfile?.username}`}
                                            className="w-12 h-12 rounded-full border-2 border-glass-border"
                                        />
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-black"></div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[rgb(var(--text-main))]">{f.friendProfile?.username}</h4>
                                        <p className="text-xs text-green-400">Online</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link to={`/messages/${f.friendProfile?.id}`}>
                                        <button className="p-2 bg-white/5 hover:bg-primary/20 rounded-full text-gray-400 hover:text-primary transition-colors">
                                            <MessageSquare className="w-4 h-4" />
                                        </button>
                                    </Link>
                                    <button
                                        onClick={() => { if (confirm('Remove friend?')) handleRemove(f.id); }}
                                        className="p-2 bg-white/5 hover:bg-red-500/20 rounded-full text-gray-400 hover:text-red-400 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </GlassCard>
                        ))
                    )}
                </div>
            )}

            {/* TAB CONTENT: REQUESTS */}
            {activeTab === 'requests' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Incoming */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-400 text-sm uppercase tracking-wider">Incoming Requests</h3>
                        {requests.length === 0 ? (
                            <p className="text-gray-600 text-sm italic">No pending requests.</p>
                        ) : (
                            requests.map(r => (
                                <GlassCard key={r.id} className="p-4 flex items-center justify-between bg-black/40">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={r.friendProfile?.avatar_url || `https://ui-avatars.com/api/?name=${r.friendProfile?.username}`}
                                            className="w-10 h-10 rounded-full"
                                        />
                                        <span className="font-bold text-[rgb(var(--text-main))]">{r.friendProfile?.username}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleAccept(r.id)} className="p-2 bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-white rounded-lg transition-all">
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleRemove(r.id)} className="p-2 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-all">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </GlassCard>
                            ))
                        )}
                    </div>

                    {/* Outgoing */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-400 text-sm uppercase tracking-wider">Sent Requests</h3>
                        {sentRequests.length === 0 ? (
                            <p className="text-gray-600 text-sm italic">No sent requests.</p>
                        ) : (
                            sentRequests.map(r => (
                                <GlassCard key={r.id} className="p-4 flex items-center justify-between bg-white/5 opacity-70">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={r.friendProfile?.avatar_url || `https://ui-avatars.com/api/?name=${r.friendProfile?.username}`}
                                            className="w-10 h-10 rounded-full grayscale"
                                        />
                                        <span className="font-bold text-gray-300">{r.friendProfile?.username}</span>
                                    </div>
                                    <button onClick={() => handleRemove(r.id)} className="text-xs text-red-400 hover:underline">
                                        Cancel
                                    </button>
                                </GlassCard>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
