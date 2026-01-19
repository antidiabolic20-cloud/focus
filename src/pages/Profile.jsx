import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/UI/GlassCard';
import { NeonButton } from '../components/UI/NeonButton';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Mail, Award, Calendar } from 'lucide-react';

export default function Profile() {
    const { user, profile } = useAuth();
    const [editing, setEditing] = useState(false);
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile) setUsername(profile.username);
    }, [profile]);

    async function handleUpdateProfile() {
        try {
            setLoading(true);
            const { error } = await supabase
                .from('profiles')
                .update({ username })
                .eq('id', user.id);

            if (error) throw error;
            setEditing(false);
            window.location.reload(); // Simple reload to refresh context
        } catch (error) {
            console.error(error);
            alert('Error updating profile');
        } finally {
            setLoading(false);
        }
    }

    if (!user) return <div className="text-white">Please log in to view profile.</div>;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white">My Profile</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* User Info Card */}
                <GlassCard className="md:col-span-1 text-center space-y-6">
                    <div className="relative inline-block">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-primary to-secondary p-1 mx-auto">
                            <div className="w-full h-full rounded-full bg-background overflow-hidden flex items-center justify-center">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-12 h-12 text-gray-500" />
                                )}
                            </div>
                        </div>
                        <div className="absolute bottom-0 right-0 bg-background rounded-full p-1 border border-glass-border">
                            <span className="block w-4 h-4 bg-green-500 rounded-full border-2 border-background"></span>
                        </div>
                    </div>

                    <div>
                        {editing ? (
                            <input
                                className="bg-background-lighter border border-glass-border rounded px-2 py-1 text-center text-white w-full"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        ) : (
                            <h2 className="text-xl font-bold text-white">{profile?.username || 'Scholar'}</h2>
                        )}
                        <p className="text-gray-400 text-sm mt-1">{user.email}</p>
                    </div>

                    <div className="flex gap-2 justify-center">
                        {editing ? (
                            <>
                                <NeonButton size="sm" onClick={handleUpdateProfile} disabled={loading}>Save</NeonButton>
                                <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-white">Cancel</button>
                            </>
                        ) : (
                            <NeonButton variant="outline" onClick={() => setEditing(true)}>Edit Profile</NeonButton>
                        )}
                    </div>
                </GlassCard>

                {/* Stats & Activity */}
                <div className="md:col-span-2 space-y-6">
                    <GlassCard>
                        <h3 className="text-lg font-bold text-white mb-4">Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-background-lighter border border-glass-border flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg text-primary">
                                    <Award className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs">Level</p>
                                    <p className="text-xl font-bold text-white">{profile?.level || 1}</p>
                                </div>
                            </div>
                            <div className="p-4 rounded-lg bg-background-lighter border border-glass-border flex items-center gap-4">
                                <div className="p-3 bg-secondary/10 rounded-lg text-secondary">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs">Joined</p>
                                    <p className="text-xl font-bold text-white">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard>
                        <h3 className="text-lg font-bold text-white mb-4">Recent Tests</h3>
                        <p className="text-gray-400 text-sm">No tests taken yet.</p>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
