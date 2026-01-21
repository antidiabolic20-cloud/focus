import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/UI/GlassCard';
import { NeonButton } from '../components/UI/NeonButton';
import { supabase } from '../lib/supabase';
import { Search, Users, Shield, Award, UserPlus, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { UserBadge } from '../components/UI/UserBadge';
import { useAuth } from '../context/AuthContext';
import { InviteModal } from '../components/Groups/InviteModal';

export default function Community() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showInviteModal, setShowInviteModal] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('xp', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    }

    const filteredUsers = users.filter(u =>
        u.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Student Community</h1>
                    <p className="text-gray-400 mt-2">Connect with fellow learners and form study squads.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        className="w-full bg-background-lighter border border-glass-border rounded-lg pl-9 pr-4 py-2 text-white focus:outline-none focus:border-primary transition-all"
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-48 bg-white/5 animate-pulse rounded-2xl border border-glass-border"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map((user) => (
                        <GlassCard key={user.id} className="group hover:border-primary/50 transition-all">
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-white/10 flex items-center justify-center relative flex-shrink-0">
                                    {user.avatar_url ? (
                                        <img src={user.avatar_url} className="w-full h-full object-cover rounded-2xl" />
                                    ) : (
                                        <span className="text-2xl font-bold text-primary">{user.username?.[0].toUpperCase()}</span>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 bg-background border border-glass-border rounded-lg px-1.5 py-0.5 text-[10px] font-bold text-accent">
                                        Lvl {user.level || 1}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-white truncate">{user.username}</h3>
                                        <UserBadge badges={user.badges} />
                                    </div>
                                    <p className="text-xs text-gray-500 mb-4">{user.xp || 0} Total XP</p>

                                    <div className="flex gap-2">
                                        <Link to={`/profile/${user.id}`} className="flex-1">
                                            <button className="w-full py-2 bg-white/5 hover:bg-white/10 border border-glass-border rounded-lg text-xs font-medium text-gray-300 transition-all flex items-center justify-center gap-2">
                                                <ExternalLink className="w-3 h-3" /> Profile
                                            </button>
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setSelectedUser(user);
                                                setShowInviteModal(true);
                                            }}
                                            className="flex-1 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-lg text-xs font-medium text-primary transition-all flex items-center justify-center gap-2"
                                        >
                                            <UserPlus className="w-3 h-3" /> Invite
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}

            {!loading && filteredUsers.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>No students found matching "{searchTerm}"</p>
                </div>
            )}

            {showInviteModal && selectedUser && (
                <InviteModal
                    user={selectedUser}
                    onClose={() => setShowInviteModal(false)}
                />
            )}
        </div>
    );
}
