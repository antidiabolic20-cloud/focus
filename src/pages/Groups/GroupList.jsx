import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/UI/GlassCard';
import { NeonButton } from '../../components/UI/NeonButton';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Users, Search, ArrowRight, Hash, Mail } from 'lucide-react';

export default function GroupList() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [myGroups, setMyGroups] = useState([]);
    const [pendingInvites, setPendingInvites] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showCreate, setShowCreate] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [joinCode, setJoinCode] = useState('');

    useEffect(() => {
        if (user) {
            fetchGroups();
            fetchInvites();
        }
    }, [user]);

    async function fetchInvites() {
        try {
            const { data, error } = await supabase
                .from('group_invites')
                .select(`
                    id,
                    group:groups (id, name, description),
                    inviter:profiles!inviter_id (username)
                `)
                .eq('invitee_id', user.id)
                .eq('status', 'pending');

            if (error) throw error;
            setPendingInvites(data || []);
        } catch (err) {
            console.error(err);
        }
    }

    async function handleInviteAction(inviteId, groupId, action) {
        try {
            if (action === 'accepted') {
                // 1. Join group
                const { error: joinError } = await supabase
                    .from('group_members')
                    .insert({ group_id: groupId, user_id: user.id, role: 'member' });
                if (joinError) throw joinError;
            }

            // 2. Update invite status
            const { error: inviteError } = await supabase
                .from('group_invites')
                .update({ status: action })
                .eq('id', inviteId);

            if (inviteError) throw inviteError;

            // 3. Refresh
            fetchInvites();
            fetchGroups();
        } catch (err) {
            console.error(err);
            alert("Action failed.");
        }
    }

    async function fetchGroups() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('group_members')
                .select(`
                    group:groups (
                        id, name, description, created_at, created_by,
                        members:group_members(count)
                    )
                `)
                .eq('user_id', user.id);

            if (error) throw error;
            setMyGroups(data.map(d => d.group) || []);
        } catch (error) {
            console.error("Error fetching groups:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateGroup(e) {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        try {
            // Generate simple 6-char code
            const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

            const { data: group, error: groupError } = await supabase
                .from('groups')
                .insert({
                    name: newGroupName,
                    description: newGroupDesc,
                    created_by: user.id,
                    invite_code: inviteCode
                })
                .select()
                .single();

            if (groupError) throw groupError;

            // Add creator as admin
            const { error: memberError } = await supabase
                .from('group_members')
                .insert({
                    group_id: group.id,
                    user_id: user.id,
                    role: 'admin'
                });

            if (memberError) throw memberError;

            setShowCreate(false);
            setNewGroupName('');
            setNewGroupDesc('');
            fetchGroups(); // Refresh list
            navigate(`/groups/${group.id}`);

        } catch (error) {
            console.error(error);
            alert("Failed to create group.");
        }
    }

    async function handleJoinGroup() {
        if (!joinCode.trim()) return;
        try {
            // Find group by code
            const { data: group, error: findError } = await supabase
                .from('groups')
                .select('id')
                .eq('invite_code', joinCode.toUpperCase())
                .single();

            if (findError || !group) {
                alert("Invalid Invite Code");
                return;
            }

            // Check if already member
            const { data: existing } = await supabase
                .from('group_members')
                .select('id')
                .eq('group_id', group.id)
                .eq('user_id', user.id)
                .single();

            if (existing) {
                alert("You are already a member!");
                return;
            }

            // Join
            const { error: joinError } = await supabase
                .from('group_members')
                .insert({
                    group_id: group.id,
                    user_id: user.id,
                    role: 'member'
                });

            if (joinError) throw joinError;

            setJoinCode('');
            fetchGroups();
            navigate(`/groups/${group.id}`);

        } catch (error) {
            console.error(error);
            alert("Error joining group");
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Study Groups</h1>
                <NeonButton onClick={() => setShowCreate(true)} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Create Group
                </NeonButton>
            </div>

            {/* Pending Invites */}
            {pendingInvites.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                        <Mail className="w-5 h-5" /> Pending Invitations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingInvites.map(invite => (
                            <GlassCard key={invite.id} className="p-4 flex items-center justify-between border-primary/30">
                                <div>
                                    <h4 className="font-bold text-white text-sm">{invite.group.name}</h4>
                                    <p className="text-xs text-gray-500">Invited by <span className="text-primary">{invite.inviter.username}</span></p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleInviteAction(invite.id, invite.group.id, 'accepted')}
                                        className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500 text-green-500 hover:text-white rounded-lg text-xs font-bold transition-all"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => handleInviteAction(invite.id, invite.group.id, 'rejected')}
                                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-lg text-xs font-bold transition-all"
                                    >
                                        Decline
                                    </button>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            )}

            {/* Join Section */}
            <GlassCard className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Join a Group</h3>
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            className="w-full bg-background-lighter border border-glass-border rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                            placeholder="Enter Invite Code (e.g. X7K9P2)"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                        />
                    </div>
                    <NeonButton variant="secondary" onClick={handleJoinGroup}>Join</NeonButton>
                </div>
            </GlassCard>

            {/* Group List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myGroups.map(group => (
                    <GlassCard key={group.id} className="group hover:bg-white/5 transition-all cursor-pointer relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users className="w-20 h-20 text-primary" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{group.name}</h3>
                            <p className="text-gray-400 text-sm mt-2 line-clamp-2 h-10">{group.description || 'No description provided.'}</p>

                            <div className="flex items-center justify-between mt-6">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Users className="w-4 h-4" />
                                    <span>{group.members && group.members[0] ? group.members[0].count : '?'} Members</span>
                                </div>
                                <Link to={`/groups/${group.id}`}>
                                    <button className="p-2 rounded-lg bg-white/5 hover:bg-primary/20 text-gray-400 group-hover:text-primary transition-all">
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {myGroups.length === 0 && !loading && (
                <div className="text-center py-20 text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>You haven't joined any groups yet.</p>
                </div>
            )}

            {/* Create Modal (Simple Overlay) */}
            {showCreate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <GlassCard className="w-full max-w-md p-6 bg-background border-primary/20">
                        <h2 className="text-2xl font-bold text-white mb-6">Create New Group</h2>
                        <form onSubmit={handleCreateGroup} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Group Name</label>
                                <input
                                    className="w-full bg-background-lighter border border-glass-border rounded-lg px-4 py-2 text-white outline-none focus:border-primary"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    placeholder="Physics Masters 2026"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Description</label>
                                <textarea
                                    className="w-full bg-background-lighter border border-glass-border rounded-lg px-4 py-2 text-white outline-none focus:border-primary h-24"
                                    value={newGroupDesc}
                                    onChange={(e) => setNewGroupDesc(e.target.value)}
                                    placeholder="A place to discuss kinematics and dynamics..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <NeonButton type="submit">Create Group</NeonButton>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
