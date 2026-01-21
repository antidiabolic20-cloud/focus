import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../../components/UI/GlassCard';
import { NeonButton } from '../../components/UI/NeonButton';
import { Swords, Zap, Users, Loader } from 'lucide-react';
import { battleService } from '../../services/battleService';
import { useAuth } from '../../context/AuthContext';

export default function BattleLobby() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState('');

    const handleFindMatch = async () => {
        if (!user) return;
        setSearching(true);
        setError('');

        try {
            // Simulate scanning effect
            await new Promise(r => setTimeout(r, 1500));

            const { battle, role } = await battleService.findOrCreateBattle(user.id);
            navigate(`/battle/${battle.id}`);
        } catch (err) {
            console.error(err);
            setError('Failed to join matchmaking. Please try again.');
            setSearching(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 animate-in fade-in duration-700">
            <div className="text-center mb-12">
                <h1 className="text-5xl font-black italic bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent mb-4">
                    FOCUS BATTLE
                </h1>
                <p className="text-xl text-gray-400">1v1 Real-Time Knowledge Duels</p>
            </div>

            <GlassCard className="max-w-md w-full p-8 relative overflow-hidden flex flex-col items-center border-glass-border">
                {searching ? (
                    <div className="flex flex-col items-center py-10">
                        <div className="relative w-32 h-32 mb-8">
                            {/* Radar Animation */}
                            <div className="absolute inset-0 border-4 border-primary rounded-full animate-ping opacity-20"></div>
                            <div className="absolute inset-0 border-4 border-primary rounded-full animate-ping opacity-40 delay-150"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Users className="w-12 h-12 text-primary animate-pulse" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Finding Opponent...</h2>
                        <p className="text-gray-400 text-sm">Scanning nearby scholars</p>
                    </div>
                ) : (
                    <>
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center mb-8 shadow-neon-purple shadow-lg transform hover:scale-110 transition-transform duration-300">
                            <Swords className="w-12 h-12 text-white" />
                        </div>

                        <div className="space-y-4 w-full">
                            <NeonButton
                                onClick={handleFindMatch}
                                className="w-full py-4 text-lg font-bold bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 border-none justify-center"
                            >
                                <Zap className="w-5 h-5 mr-2 fill-current" />
                                QUICK MATCH
                            </NeonButton>

                            <p className="text-xs text-center text-gray-500 mt-4">
                                Winner takes 50 XP. Loser takes 10 XP.
                            </p>
                        </div>

                        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                    </>
                )}
            </GlassCard>
        </div>
    );
}
