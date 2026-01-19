import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GlassCard } from '../../components/UI/GlassCard';
import { NeonButton } from '../../components/UI/NeonButton';
import { supabase } from '../../lib/supabase';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signUp } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);

            // 1. Sign up with Supabase Auth
            const { data: { user }, error: authError } = await signUp({
                email,
                password,
            });

            if (authError) throw authError;

            if (user) {
                // 2. Create Profile entry manually (if not using SQL trigger)
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([
                        { id: user.id, username, avatar_url: '' }
                    ]);

                if (profileError) {
                    console.error("Profile creation error", profileError);
                    // Proceed anyway, can handle later
                }
            }

            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        FOCUS
                    </h1>
                    <p className="text-gray-400 mt-2">Join the Elite Community.</p>
                </div>

                <GlassCard className="p-8 border-primary/20 shadow-neon-purple/20">
                    <h2 className="text-2xl font-bold text-white mb-6">Create Account</h2>
                    {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-4 text-sm">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Username</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-background-lighter border border-glass-border rounded-lg px-4 py-2.5 text-white focus:border-primary focus:shadow-neon-purple/20 outline-none transition-all"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                className="w-full bg-background-lighter border border-glass-border rounded-lg px-4 py-2.5 text-white focus:border-primary focus:shadow-neon-purple/20 outline-none transition-all"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Password</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                className="w-full bg-background-lighter border border-glass-border rounded-lg px-4 py-2.5 text-white focus:border-primary focus:shadow-neon-purple/20 outline-none transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <NeonButton type="submit" className="w-full justify-center" disabled={loading}>
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </NeonButton>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-400">
                        Already have an account? <Link to="/login" className="text-primary hover:text-primary-glow">Login</Link>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
