import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/UI/GlassCard';
import { NeonButton } from '../components/UI/NeonButton';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { User, BookOpen, MessageSquare, Search, X, Check, Handshake, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function StudyBuddy() {
    const { user, profile } = useAuth();
    const [status, setStatus] = useState('inactive'); // 'inactive' | 'active'
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [topics, setTopics] = useState('');

    useEffect(() => {
        if (user) {
            checkUserStatus();
            fetchPartners();
        }
    }, [user]);

    async function checkUserStatus() {
        try {
            const { data, error } = await supabase
                .from('partner_requests')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (data?.status === 'active') {
                setStatus('active');
                setTopics(data.looking_for?.join(', ') || '');
            } else {
                setStatus('inactive');
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function fetchPartners() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('partner_requests')
                .select(`
                    *,
                    profile:profiles(*)
                `)
                .eq('status', 'active')
                .neq('user_id', user.id); // Exclude self

            if (data) {
                // Client-side Match Scoring
                const scoredPartners = data.map(p => {
                    let score = 0;
                    const mySubjects = profile?.subjects_of_interest || [];
                    const theirSubjects = p.profile?.subjects_of_interest || [];
                    const theirRequest = p.looking_for || [];

                    // Match on topics looked for
                    const overlap1 = theirRequest.filter(t => mySubjects.some(s => s.toLowerCase().includes(t.toLowerCase()))).length;

                    // Match on general interests
                    const overlap2 = theirSubjects.filter(s => mySubjects.some(m => m.toLowerCase().includes(s.toLowerCase()))).length;

                    // Match on study style (exact match)
                    if (p.profile?.study_style && profile?.study_style && p.profile.study_style === profile.study_style) {
                        score += 30; // High bonus for same style
                    }

                    score += (overlap1 * 20) + (overlap2 * 10);
                    return { ...p, matchScore: Math.min(score, 100) }; // Cap at 100
                }).sort((a, b) => b.matchScore - a.matchScore);

                setPartners(scoredPartners);
            }
        } catch (err) {
            console.error("Error fetching partners:", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleStartSearching() {
        try {
            const topicList = topics.split(',').map(s => s.trim()).filter(Boolean);

            // Insert or Update request
            const { error } = await supabase
                .from('partner_requests')
                .upsert({
                    user_id: user.id,
                    status: 'active',
                    looking_for: topicList
                });

            if (error) throw error;
            setStatus('active');
            fetchPartners(); // Refresh list
        } catch (err) {
            alert('Failed to start searching');
        }
    }

    async function handleStopSearching() {
        try {
            const { error } = await supabase
                .from('partner_requests')
                .update({ status: 'inactive' })
                .eq('user_id', user.id);

            if (error) throw error;
            setStatus('inactive');
        } catch (err) {
            alert('Failed to stop searching');
        }
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Handshake className="w-8 h-8 text-primary" />
                        Study Buddy Matcher
                    </h1>
                    <p className="text-gray-400 mt-1">Find your perfect study partner based on goals and interests.</p>
                </div>

                {status === 'active' ? (
                    <button
                        onClick={handleStopSearching}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors"
                    >
                        <X className="w-4 h-4" /> Stop Searching
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <input
                            value={topics}
                            onChange={(e) => setTopics(e.target.value)}
                            placeholder="What are you studying today?"
                            className="bg-background-lighter border border-glass-border rounded-xl px-4 py-2 text-sm text-white focus:border-primary outline-none min-w-[250px]"
                        />
                        <NeonButton onClick={handleStartSearching}>
                            <Search className="w-4 h-4 mr-2" /> Find Buddy
                        </NeonButton>
                    </div>
                )}
            </div>

            {/* Match List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center text-gray-500 flex flex-col items-center">
                        <Loader className="w-8 h-8 animate-spin mb-4" />
                        Scanning for partners...
                    </div>
                ) : partners.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white/5 rounded-2xl border border-white/5">
                        <User className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-white font-bold text-lg">No active partners found</h3>
                        <p className="text-gray-500">Be the first to start a study group!</p>
                    </div>
                ) : (
                    partners.map((partner) => (
                        <GlassCard key={partner.user_id} className="p-6 relative overflow-hidden group hover:border-primary/30 transition-all">
                            {/* Match Score Badge */}
                            {partner.matchScore > 0 && (
                                <div className="absolute top-2 right-2 bg-primary/20 border border-primary/30 rounded-lg px-2 py-1">
                                    <span className="text-xs font-bold text-primary-light">{partner.matchScore}% Match</span>
                                </div>
                            )}

                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent p-0.5">
                                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                        {partner.profile?.avatar_url ? (
                                            <img src={partner.profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xl font-bold text-white">{partner.profile?.username?.[0]}</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{partner.profile?.username}</h3>
                                    <p className="text-xs text-gray-400 truncate max-w-[150px]">
                                        {partner.profile?.academic_goals?.[0] || 'Student'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <span className="text-xs text-gray-500 uppercase font-bold">Currently Studying</span>
                                    <div className="flex flex-wrap gap-2">
                                        {partner.looking_for?.map((tag, i) => (
                                            <span key={i} className="text-xs bg-white/5 px-2 py-1 rounded text-gray-300 border border-white/5">{tag}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                    <span className="text-xs text-gray-500">
                                        {partner.profile?.study_style ? (
                                            <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {partner.profile.study_style}</span>
                                        ) : 'Flexible Style'}
                                    </span>

                                    <Link to={`/profile/${partner.user_id}`}>
                                        <button className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary-glow text-white text-xs font-bold rounded-lg transition-all">
                                            Connect <MessageSquare className="w-3 h-3" />
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </GlassCard>
                    ))
                )}
            </div>
        </div>
    );
}
