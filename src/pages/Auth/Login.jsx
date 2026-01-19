import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GlassCard } from '../../components/UI/GlassCard';
import { NeonButton } from '../../components/UI/NeonButton';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signIn } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            const { error } = await signIn({ email, password });
            if (error) throw error;
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
                    <p className="text-gray-400 mt-2">Welcome back, Scholar.</p>
                </div>

                <GlassCard className="p-8 border-primary/20 shadow-neon-purple/20">
                    <h2 className="text-2xl font-bold text-white mb-6">Login</h2>
                    {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-4 text-sm">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-5">
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
                                className="w-full bg-background-lighter border border-glass-border rounded-lg px-4 py-2.5 text-white focus:border-primary focus:shadow-neon-purple/20 outline-none transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <NeonButton type="submit" className="w-full justify-center" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </NeonButton>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-400">
                        Don't have an account? <Link to="/register" className="text-primary hover:text-primary-glow">Sign up</Link>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
