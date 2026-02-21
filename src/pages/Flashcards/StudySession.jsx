import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GlassCard } from '../../components/UI/GlassCard';
import { FlipCard } from '../../components/Flashcards/FlipCard';
import { AddCardModal } from '../../components/Flashcards/AddCardModal';
import { ArrowLeft, Plus, Check, RotateCcw, Zap, Trophy, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCards, getDeckStats, updateCardSRS, deleteDeck } from '../../services/flashcardService';
import { supabase } from '../../lib/supabase';

export default function StudySession() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [deck, setDeck] = useState(null);
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddCard, setShowAddCard] = useState(false);

    // Study session state
    const [sessionStarted, setSessionStarted] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [sessionResults, setSessionResults] = useState([]); // { cardId, quality }
    const [sessionDone, setSessionDone] = useState(false);
    const [rating, setRating] = useState(false); // prevent double taps

    useEffect(() => {
        fetchData();
    }, [id]);

    async function fetchData() {
        try {
            setLoading(true);
            const { data: deckData } = await supabase
                .from('flashcard_decks')
                .select('*')
                .eq('id', id)
                .single();
            setDeck(deckData);

            const cardsData = await getCards(id);
            setCards(cardsData || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const currentCard = cards[currentIndex];
    const progress = cards.length > 0 ? ((currentIndex) / cards.length) * 100 : 0;

    async function handleRate(quality) {
        if (rating) return;
        setRating(true);
        try {
            setSessionResults(prev => [...prev, { cardId: currentCard.id, quality }]);
            await updateCardSRS(currentCard.id, quality, currentCard);

            if (currentIndex + 1 >= cards.length) {
                setSessionDone(true);
            } else {
                setCurrentIndex(i => i + 1);
                setRevealed(false);
            }
        } finally {
            setRating(false);
        }
    }

    function restartSession() {
        setCurrentIndex(0);
        setRevealed(false);
        setSessionResults([]);
        setSessionDone(false);
    }

    function handleCardAdded(card) {
        setCards(prev => [...prev, card]);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // ─────────────── Session Summary Screen ───────────────
    if (sessionDone) {
        const easyCount = sessionResults.filter(r => r.quality === 1).length;
        const hardCount = sessionResults.filter(r => r.quality === 0).length;
        const pct = Math.round((easyCount / sessionResults.length) * 100);

        return (
            <div className="max-w-xl mx-auto py-12 space-y-6">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                        <Trophy className="w-10 h-10 text-yellow-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Session Complete!</h2>
                    <p className="text-gray-400">You reviewed all {sessionResults.length} cards.</p>
                </div>

                <GlassCard>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-3xl font-bold text-emerald-400">{easyCount}</p>
                            <p className="text-xs text-gray-500 mt-1">Got it ✓</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">{pct}%</p>
                            <p className="text-xs text-gray-500 mt-1">Accuracy</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-red-400">{hardCount}</p>
                            <p className="text-xs text-gray-500 mt-1">Need work</p>
                        </div>
                    </div>

                    <div className="mt-6 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #10b981, #34d399)' }}
                        />
                    </div>
                </GlassCard>

                <div className="flex gap-3">
                    <button
                        onClick={restartSession}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 transition-all"
                    >
                        <RotateCcw className="w-4 h-4" /> Study Again
                    </button>
                    <button
                        onClick={() => navigate('/flashcards')}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white border border-white/10 hover:bg-white/5 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Decks
                    </button>
                </div>
            </div>
        );
    }

    // ─────────────── Pre-session / Deck Overview ───────────────
    if (!sessionStarted) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                {showAddCard && (
                    <AddCardModal
                        deckId={id}
                        onClose={() => setShowAddCard(false)}
                        onAdded={handleCardAdded}
                    />
                )}

                <button
                    onClick={() => navigate('/flashcards')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Flashcards
                </button>

                <GlassCard className="text-center py-10">
                    <div
                        className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: `${deck?.color || '#7c3aed'}22`, border: `1px solid ${deck?.color || '#7c3aed'}44` }}
                    >
                        <BookOpen className="w-8 h-8" style={{ color: deck?.color || '#7c3aed' }} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-1">{deck?.title}</h2>
                    {deck?.subject && (
                        <span
                            className="text-xs font-medium px-2.5 py-1 rounded-full inline-block mb-3"
                            style={{ backgroundColor: `${deck?.color || '#7c3aed'}22`, color: deck?.color || '#7c3aed', border: `1px solid ${deck?.color || '#7c3aed'}33` }}
                        >
                            {deck.subject}
                        </span>
                    )}
                    {deck?.description && <p className="text-gray-400 text-sm mb-6">{deck.description}</p>}

                    <p className="text-gray-500 text-sm mb-8">
                        <strong className="text-white">{cards.length}</strong> {cards.length === 1 ? 'card' : 'cards'} in this deck
                    </p>

                    {cards.length === 0 ? (
                        <div className="space-y-4">
                            <p className="text-gray-500">No cards yet. Add some to start studying!</p>
                            <button
                                onClick={() => setShowAddCard(true)}
                                className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl font-semibold text-white border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 transition-all"
                            >
                                <Plus className="w-4 h-4" /> Add First Card
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setShowAddCard(true)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-300 border border-white/10 hover:bg-white/5 transition-all"
                            >
                                <Plus className="w-4 h-4" /> Add Card
                            </button>
                            <button
                                onClick={() => setSessionStarted(true)}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white transition-all hover:opacity-90"
                                style={{ background: `linear-gradient(135deg, ${deck?.color || '#7c3aed'}, #db2777)` }}
                            >
                                <Zap className="w-4 h-4 fill-current" /> Start Studying
                            </button>
                        </div>
                    )}
                </GlassCard>
            </div>
        );
    }

    // ─────────────── Active Study Session ───────────────
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setSessionStarted(false)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
                >
                    <ArrowLeft className="w-4 h-4" /> Exit Session
                </button>
                <span className="text-sm font-medium text-gray-400">
                    {currentIndex + 1} <span className="text-gray-600">/</span> {cards.length}
                </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${deck?.color || '#7c3aed'}, #db2777)` }}
                />
            </div>

            {/* Flip Card */}
            <FlipCard
                front={currentCard.front}
                back={currentCard.back}
                revealed={revealed}
                onReveal={() => setRevealed(true)}
            />

            {/* Rating buttons (shown only after flip) */}
            {revealed ? (
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => handleRate(0)}
                        disabled={rating}
                        className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 hover:border-red-500/50 transition-all disabled:opacity-50 group"
                    >
                        <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
                        Hard — Review soon
                    </button>
                    <button
                        onClick={() => handleRate(1)}
                        disabled={rating}
                        className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all disabled:opacity-50 group"
                    >
                        <Check className="w-5 h-5" />
                        Got it! — See later
                    </button>
                </div>
            ) : (
                <div className="flex justify-center">
                    <button
                        onClick={() => setRevealed(true)}
                        className="px-8 py-3 rounded-2xl font-semibold text-white border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 transition-all"
                    >
                        Reveal Answer
                    </button>
                </div>
            )}

            {/* Navigation hint */}
            <p className="text-center text-xs text-gray-600">
                Click the card or use the button below to flip
            </p>
        </div>
    );
}
