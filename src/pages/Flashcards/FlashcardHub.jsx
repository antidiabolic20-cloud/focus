import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../components/UI/GlassCard';
import { DeckCard } from '../../components/Flashcards/DeckCard';
import { CreateDeckModal } from '../../components/Flashcards/CreateDeckModal';
import { Plus, Sparkles, BookOpen, Layers } from 'lucide-react';
import { getDecks, deleteDeck, getDeckStats } from '../../services/flashcardService';
import { useAuth } from '../../context/AuthContext';

export default function FlashcardHub() {
    const { user } = useAuth();
    const [decks, setDecks] = useState([]);
    const [deckStats, setDeckStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createTab, setCreateTab] = useState('manual');

    useEffect(() => {
        if (user) fetchDecks();
    }, [user]);

    async function fetchDecks() {
        try {
            setLoading(true);
            const data = await getDecks(user.id);
            setDecks(data || []);
            // Load stats for each deck in parallel
            const statsMap = {};
            await Promise.all(
                (data || []).map(async (deck) => {
                    try {
                        statsMap[deck.id] = await getDeckStats(deck.id);
                    } catch {
                        statsMap[deck.id] = { total: deck.card_count || 0, mastered: 0, dueToday: 0, masteryPercent: 0 };
                    }
                })
            );
            setDeckStats(statsMap);
        } catch (err) {
            console.error('Error fetching decks:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(deckId) {
        if (!window.confirm('Delete this deck and all its cards?')) return;
        try {
            await deleteDeck(deckId);
            setDecks(prev => prev.filter(d => d.id !== deckId));
        } catch (err) {
            console.error('Error deleting deck:', err);
        }
    }

    function handleCreated(newDeck) {
        setDecks(prev => [newDeck, ...prev]);
        setDeckStats(prev => ({
            ...prev,
            [newDeck.id]: { total: newDeck.card_count || 0, mastered: 0, dueToday: 0, masteryPercent: 0 },
        }));
    }

    // Summary stats
    const totalCards = decks.reduce((sum, d) => sum + (d.card_count || 0), 0);
    const totalDue = Object.values(deckStats).reduce((sum, s) => sum + (s.dueToday || 0), 0);

    return (
        <div className="space-y-8">
            {showCreateModal && (
                <CreateDeckModal
                    initialTab={createTab}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={handleCreated}
                />
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Flashcards</h1>
                    <p className="text-gray-400 mt-1">Study smarter with spaced repetition.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => { setCreateTab('manual'); setShowCreateModal(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 transition-all"
                    >
                        <Plus className="w-4 h-4" /> New Deck
                    </button>
                    <button
                        onClick={() => { setCreateTab('ai'); setShowCreateModal(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
                    >
                        <Sparkles className="w-4 h-4 animate-pulse" /> AI Generate
                    </button>
                </div>
            </div>

            {/* Summary Banner */}
            {decks.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                        { icon: Layers, label: 'Total Decks', value: decks.length, color: '#7c3aed' },
                        { icon: BookOpen, label: 'Total Cards', value: totalCards, color: '#2563eb' },
                        { icon: Sparkles, label: 'Due for Review', value: totalDue, color: totalDue > 0 ? '#d97706' : '#10b981' },
                    ].map(stat => (
                        <GlassCard key={stat.label} className="flex items-center gap-4 py-4 px-5">
                            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${stat.color}22`, border: `1px solid ${stat.color}33` }}>
                                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}

            {/* Decks Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="glass-panel rounded-xl p-6 h-56 animate-pulse">
                            <div className="h-4 bg-white/5 rounded mb-3 w-1/3" />
                            <div className="h-6 bg-white/5 rounded mb-2 w-3/4" />
                            <div className="h-4 bg-white/5 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : decks.length === 0 ? (
                // Empty state
                <div className="flex flex-col items-center justify-center py-28 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
                        <BookOpen className="w-10 h-10 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No decks yet</h3>
                    <p className="text-gray-500 mb-8 max-w-sm">
                        Create your first flashcard deck manually or let AI generate one for you instantly.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => { setCreateTab('manual'); setShowCreateModal(true); }}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 transition-all"
                        >
                            <Plus className="w-4 h-4" /> Create Manually
                        </button>
                        <button
                            onClick={() => { setCreateTab('ai'); setShowCreateModal(true); }}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
                        >
                            <Sparkles className="w-4 h-4" /> Generate with AI
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {decks.map(deck => (
                        <DeckCard
                            key={deck.id}
                            deck={deck}
                            stats={deckStats[deck.id]}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
