import React, { useState, useEffect } from 'react';
import { GlassCard } from '../UI/GlassCard';
import { NeonButton } from '../UI/NeonButton';
import { supabase } from '../../lib/supabase';
import { X, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function InviteModal({ user, onClose }) {
    const { user: currentUser } = useAuth();
    const [myGroups, setMyGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inviting, setInviting] = useState(null); // ID of group being invited to
    const [status, setStatus] = useState({}); // { groupId: 'success' | 'error' }

    useEffect(() => {
        fetchMyGroups();
    }, []);

    async function fetchMyGroups() {
        try {
            setLoading(true);
            // Fetch groups where current user is admin
            const { data, error } = await supabase
                .from('group_members')
                .select(`
                    group:groups (id, name, description)
                `)
                .eq('user_id', currentUser.id)
                .eq('role', 'admin');

            if (error) throw error;
            setMyGroups(data.map(d => d.group) || []);
        } catch (error) {
            console.error("Error fetching admin groups:", error);
        } finally {
            setLoading(false);
        }
    }

    async function sendInvite(groupId) {
        try {
            setInviting(groupId);
            const { error } = await supabase
                .from('group_invites')
                .insert({
                    group_id: groupId,
                    inviter_id: currentUser.id,
                    invitee_id: user.id,
                    status: 'pending'
                });

            if (error) {
                if (error.code === '23505') {
                    alert("This user is already invited or a member of this group!");
                } else {
                    throw error;
                }
            }

            setStatus(prev => ({ ...prev, [groupId]: 'success' }));
        } catch (error) {
            console.error(error);
            setStatus(prev => ({ ...prev, [groupId]: 'error' }));
        } finally {
            setInviting(null);
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <GlassCard className="w-full max-w-md p-6 bg-background border-primary/20 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Invite {user.username}</h2>
                        <p className="text-xs text-gray-400">Select a group to invite them to.</p>
                    </div>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {loading ? (
                        <div className="text-center py-10 text-gray-500">Loading your groups...</div>
                    ) : myGroups.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-gray-400 text-sm">You aren't an admin of any groups.</p>
                            <Link to="/groups" onClick={onClose} className="text-primary text-xs hover:underline mt-2 inline-block">Create a Group</Link>
                        </div>
                    ) : (
                        myGroups.map(group => (
                            <div key={group.id} className="p-4 rounded-xl bg-white/5 border border-glass-border flex justify-between items-center group hover:border-primary/30 transition-all">
                                <div>
                                    <h4 className="text-sm font-bold text-white">{group.name}</h4>
                                    <p className="text-[10px] text-gray-500 line-clamp-1">{group.description || 'Study Squad'}</p>
                                </div>

                                {status[group.id] === 'success' ? (
                                    <div className="flex items-center gap-1 text-green-500 text-xs font-bold">
                                        <CheckCircle className="w-4 h-4" /> Sent
                                    </div>
                                ) : status[group.id] === 'error' ? (
                                    <div className="flex items-center gap-1 text-red-500 text-xs font-bold">
                                        <AlertCircle className="w-4 h-4" /> Failed
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => sendInvite(group.id)}
                                        disabled={inviting === group.id}
                                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                    >
                                        {inviting === group.id ? 'Sending...' : 'Invite'}
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </GlassCard>
        </div>
    );
}
