import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { GlassCard } from '../../components/UI/GlassCard';
import { NeonButton } from '../../components/UI/NeonButton';
import { battleService } from '../../services/battleService';
import { useAuth } from '../../context/AuthContext';
import { Shield, Zap, CheckCircle, XCircle, Trophy } from 'lucide-react';
import { cn } from '../../lib/utils';
import confetti from 'canvas-confetti';

export default function BattleArena() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [battle, setBattle] = useState(null);
    const [myProgress, setMyProgress] = useState(null);
    const [opponentProgress, setOpponentProgress] = useState(null);
    const [questions, setQuestions] = useState([]);

    const [gameState, setGameState] = useState('loading'); // loading, waiting_opponent, active, finished
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(5); // 5s freeze on wrong answer
    const [isFrozen, setIsFrozen] = useState(false);
    const [result, setResult] = useState(null); // win/loss
    const [startingIn, setStartingIn] = useState(null); // null or number for countdown

    // Realtime subscription ref
    const channelRef = useRef(null);

    useEffect(() => {
        if (!user || !id) return;

        loadBattle();

        // Subscribe to Battle Progress changes
        const channel = supabase.channel(`battle_${id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'battle_progress',
                filter: `battle_id=eq.${id}`
            }, (payload) => {
                const newData = payload.new;
                if (newData.user_id === user.id) {
                    setMyProgress(newData);
                } else {
                    setOpponentProgress(newData);
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'battles',
                filter: `id=eq.${id}`
            }, (payload) => {
                setBattle(prev => ({ ...prev, ...payload.new }));
                if (payload.new.status === 'active' && gameState === 'waiting_opponent') {
                    startCountdown();
                }
            })
            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id, user]);

    // Check wait status
    useEffect(() => {
        if (battle) {
            // STRICT CHECK: Only active if BOTH players exist
            if (battle.opponent_id && battle.status === 'active') {
                if (gameState !== 'active') startCountdown();
            } else if (battle.status === 'completed') {
                finishGame(battle.winner_id === user.id);
            } else {
                setGameState('waiting_opponent');
            }
        }
    }, [battle]);

    // ... (rest of code) ...

    function startCountdown() {
        setStartingIn(3);
        const timer = setInterval(() => {
            setStartingIn(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setGameState('active');
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    }

    if (gameState === 'waiting_opponent') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
                <h2 className="text-2xl font-bold text-white">Waiting for Opponent...</h2>
                <p className="text-gray-400 mt-2">The battle will start automatically.</p>
                <div className="mt-8 p-4 bg-white/5 rounded-lg text-sm text-gray-500">
                    Room ID: {id}
                </div>
            </div>
        );
    }

    if (startingIn) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-pulse">
                <h1 className="text-9xl font-black text-white drop-shadow-[0_0_30px_rgba(255,0,0,0.8)]">
                    {startingIn}
                </h1>
                <p className="text-xl text-red-500 font-bold mt-4">GET READY!</p>
            </div>
        );
    }

    async function loadBattle() {
        try {
            const data = await battleService.getBattleDetails(id);
            setBattle(data);
            setQuestions(data.questions);

            // Fetch initial progress
            const { data: progress } = await supabase.from('battle_progress').select('*').eq('battle_id', id);

            const myP = progress.find(p => p.user_id === user.id);
            const opP = progress.find(p => p.user_id !== user.id);

            if (myP) {
                setMyProgress(myP);
                setCurrentQIndex(myP.current_question_index);
            }
            if (opP) setOpponentProgress(opP);

        } catch (error) {
            console.error(error);
        }
    }

    async function handleAnswer(optionIndex) {
        if (isFrozen) return;

        const currentQ = questions[currentQIndex];
        const isCorrect = optionIndex === currentQ.correct_option;

        if (isCorrect) {
            const nextIndex = currentQIndex + 1;
            setCurrentQIndex(nextIndex);

            // Optimistic update
            const newScore = (myProgress?.score || 0) + 10;
            setMyProgress(prev => ({ ...prev, current_question_index: nextIndex, score: newScore }));

            await battleService.updateProgress(myProgress.id, {
                current_question_index: nextIndex,
                score: newScore
            });

            // Check Win Condition
            if (nextIndex >= questions.length) {
                handleWin();
            }
        } else {
            // Freeze penalty
            setIsFrozen(true);
            let freezeTime = 3;
            setTimeLeft(freezeTime);
            const timer = setInterval(() => {
                freezeTime--;
                setTimeLeft(freezeTime);
                if (freezeTime <= 0) {
                    clearInterval(timer);
                    setIsFrozen(false);
                }
            }, 1000);
        }
    }

    async function handleWin() {
        setGameState('finished');
        setResult('win');
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

        await supabase.from('battles').update({
            status: 'completed',
            winner_id: user.id
        }).eq('id', id);

        // Award XP
        await supabase.rpc('increment_xp', { user_id: user.id, amount: 50 });
    }

    function finishGame(isWinner) {
        setGameState('finished');
        setResult(isWinner ? 'win' : 'loss');
    }

    if (!battle || !myProgress) return <div className="text-white text-center pt-20">Loading Arena...</div>;



    if (gameState === 'finished') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in zoom-in duration-500">
                {result === 'win' ? (
                    <>
                        <Trophy className="w-24 h-24 text-yellow-500 mb-6 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                        <h1 className="text-5xl font-black text-white mb-2">VICTORY!</h1>
                        <p className="text-xl text-yellow-400 font-bold mb-8">+50 XP Earned</p>
                    </>
                ) : (
                    <>
                        <XCircle className="w-24 h-24 text-red-500 mb-6" />
                        <h1 className="text-5xl font-black text-gray-400 mb-2">DEFEAT</h1>
                        <p className="text-xl text-gray-500 font-bold mb-8">Better luck next time.</p>
                    </>
                )}
                <NeonButton onClick={() => navigate('/battle')}>Back to Lobby</NeonButton>
            </div>
        );
    }

    const currentQ = questions[currentQIndex];
    if (!currentQ && gameState === 'active') return <div>Error loading question</div>;

    return (
        <div className="max-w-6xl mx-auto p-4 flex flex-col md:flex-row gap-6 min-h-[80vh]">
            {/* Left: Player (You) */}
            <div className="w-full md:w-1/4 p-4 border border-glass-border bg-background/50 rounded-2xl flex flex-col items-center">
                <img src={battle.player1?.id === user.id ? battle.player1.avatar_url : battle.player2?.avatar_url || 'https://via.placeholder.com/150'} className="w-20 h-20 rounded-full border-4 border-green-500 mb-4" />
                <h3 className="font-bold text-white text-lg">
                    {battle.player1?.id === user.id ? battle.player1?.username : battle.player2?.username} <span className="text-gray-400 text-sm">(You)</span>
                </h3>
                <div className="w-full bg-gray-800 h-6 rounded-full mt-4 overflow-hidden relative">
                    <div
                        className="bg-green-500 h-full transition-all duration-500"
                        style={{ width: `${((currentQIndex) / 5) * 100}%` }}
                    />
                </div>
                <p className="mt-2 text-green-400 font-mono text-xl">{currentQIndex}/5</p>
                {isFrozen && <div className="mt-4 text-red-500 font-bold animate-pulse text-2xl">FROZEN: {timeLeft}s</div>}
            </div>

            {/* Center: Question */}
            <div className="flex-1 flex flex-col justify-center">
                <GlassCard className={cn(
                    "p-8 min-h-[400px] flex flex-col justify-center transition-all",
                    isFrozen ? "opacity-50 grayscale pointer-events-none border-red-500/50" : "border-primary/50"
                )}>
                    <span className="text-center text-gray-500 uppercase tracking-widest text-sm mb-4">Question {currentQIndex + 1}</span>
                    <h2 className="text-2xl font-bold text-white text-center mb-8">{currentQ.content}</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentQ.options?.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(idx)}
                                className="p-4 bg-white/5 hover:bg-white/10 border border-glass-border rounded-xl text-left transition-all hover:scale-[1.02] active:scale-95"
                            >
                                <span className="font-bold text-primary mr-3">{String.fromCharCode(65 + idx)}.</span>
                                {opt}
                            </button>
                        ))}
                    </div>
                </GlassCard>
            </div>

            {/* Right: Opponent */}
            <div className="w-full md:w-1/4 p-4 border border-glass-border bg-background/50 rounded-2xl flex flex-col items-center opacity-80">
                <img src={battle.player1?.id !== user.id ? battle.player1?.avatar_url : battle.player2?.avatar_url || 'https://via.placeholder.com/150'} className="w-20 h-20 rounded-full border-4 border-red-500 mb-4" />
                <h3 className="font-bold text-white text-lg">
                    {battle.player1?.id !== user.id ? battle.player1?.username : battle.player2?.username} <span className="text-gray-400 text-sm">(Opponent)</span>
                </h3>
                <div className="w-full bg-gray-800 h-6 rounded-full mt-4 overflow-hidden relative">
                    <div
                        className="bg-red-500 h-full transition-all duration-500"
                        style={{ width: `${((opponentProgress?.current_question_index || 0) / 5) * 100}%` }}
                    />
                </div>
                <p className="mt-2 text-red-400 font-mono text-xl">{opponentProgress?.current_question_index || 0}/5</p>
            </div>
        </div>
    );
}
