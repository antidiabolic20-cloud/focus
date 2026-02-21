import React, { useState } from 'react';
import { X, Plus, Sparkles, Loader2, BookOpen } from 'lucide-react';
import { cn } from '../../lib/utils';
import { createDeck, generateFlashcardsAI, bulkAddCards } from '../../services/flashcardService';
import { useAuth } from '../../context/AuthContext';

const COLORS = [
    '#7c3aed', '#2563eb', '#dc2626', '#d97706',
    '#059669', '#db2777', '#0891b2', '#65a30d',
];

const SUBJECTS = ['Mathematics', 'Science', 'History', 'Geography', 'Language', 'Biology', 'Chemistry', 'Physics', 'Literature', 'Other'];

export function CreateDeckModal({ onClose, onCreated, initialTab = 'manual' }) {
    const { user } = useAuth();
    const [tab, setTab] = useState(initialTab); // 'manual' | 'ai'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Manual form
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [subject, setSubject] = useState('');
    const [color, setColor] = useState(COLORS[0]);

    // AI form
    const [aiTopic, setAiTopic] = useState('');
    const [aiCount, setAiCount] = useState(10);

    const handleManualCreate = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        setLoading(true);
        setError('');
        try {
            const deck = await createDeck({ userId: user.id, title: title.trim(), description: description.trim(), subject, color });
            onCreated(deck);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAICreate = async (e) => {
        e.preventDefault();
        if (!aiTopic.trim()) return;
        setLoading(true);
        setError('');
        try {
            // 1. Create the deck first
            const deckTitle = `${aiTopic} - AI Deck`;
            const deck = await createDeck({ userId: user.id, title: deckTitle, description: `AI-generated flashcards about ${aiTopic}`, subject, color });
            // 2. Generate cards via OpenRouter
            const cards = await generateFlashcardsAI({ topic: aiTopic, count: aiCount });
            // 3. Bulk insert
            await bulkAddCards(deck.id, cards);
            onCreated({ ...deck, card_count: cards.length });
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
                style={{ background: 'rgb(15,10,30)', border: '1px solid rgba(124,58,237,0.3)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold text-white">Create Flashcard Deck</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-4 pb-0">
                    {['manual', 'ai'].map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
                                tab === t
                                    ? "bg-purple-600 text-white shadow-lg"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {t === 'manual' ? <><BookOpen className="w-4 h-4" /> Manual</> : <><Sparkles className="w-4 h-4" /> AI Generate</>}
                        </button>
                    ))}
                </div>

                <div className="p-6 space-y-4">
                    {/* Shared: subject + color */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Subject (optional)</label>
                            <select
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                            >
                                <option value="">— None —</option>
                                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-400 mb-1.5 block">Deck Color</label>
                            <div className="flex gap-2 flex-wrap">
                                {COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setColor(c)}
                                        className={cn("w-7 h-7 rounded-full transition-all", color === c ? "ring-2 ring-white scale-110" : "opacity-70 hover:opacity-100")}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {tab === 'manual' ? (
                        <form onSubmit={handleManualCreate} className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Deck Title *</label>
                                <input
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g. Biology Chapter 3"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Description</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="What's this deck about?"
                                    rows={2}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                                />
                            </div>
                            {error && <p className="text-red-400 text-xs">{error}</p>}
                            <button
                                type="submit"
                                disabled={loading || !title.trim()}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                {loading ? 'Creating...' : 'Create Deck'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleAICreate} className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Topic *</label>
                                <input
                                    value={aiTopic}
                                    onChange={e => setAiTopic(e.target.value)}
                                    placeholder="e.g. Photosynthesis, World War II, Calculus derivatives..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-400 mb-1.5 block flex justify-between">
                                    <span>Number of cards</span>
                                    <span className="text-purple-400 font-bold">{aiCount}</span>
                                </label>
                                <input
                                    type="range" min={5} max={30} step={5}
                                    value={aiCount}
                                    onChange={e => setAiCount(Number(e.target.value))}
                                    className="w-full accent-purple-500"
                                />
                                <div className="flex justify-between text-xs text-gray-600 mt-0.5">
                                    <span>5</span><span>30</span>
                                </div>
                            </div>
                            {error && <p className="text-red-400 text-xs">{error}</p>}
                            <button
                                type="submit"
                                disabled={loading || !aiTopic.trim()}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
                            >
                                {loading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating {aiCount} cards with AI...</>
                                ) : (
                                    <><Sparkles className="w-4 h-4" /> Generate with AI</>
                                )}
                            </button>
                            {loading && (
                                <p className="text-center text-xs text-gray-500 animate-pulse">
                                    AI is crafting your flashcards… this may take a few seconds
                                </p>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
