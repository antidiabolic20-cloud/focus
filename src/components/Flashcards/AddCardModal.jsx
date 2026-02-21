import React, { useState } from 'react';
import { X, Loader2, Plus } from 'lucide-react';
import { addCard } from '../../services/flashcardService';

export function AddCardModal({ deckId, onClose, onAdded }) {
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!front.trim() || !back.trim()) return;
        setLoading(true);
        setError('');
        try {
            const card = await addCard({ deckId, front: front.trim(), back: back.trim() });
            onAdded(card);
            // Reset for adding another card
            setFront('');
            setBack('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
                style={{ background: 'rgb(15,10,30)', border: '1px solid rgba(124,58,237,0.3)' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold text-white">Add Flashcard</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-2 block">Front (Question / Term)</label>
                        <textarea
                            value={front}
                            onChange={e => setFront(e.target.value)}
                            placeholder="What is the powerhouse of the cell?"
                            rows={3}
                            className="w-full bg-purple-500/5 border border-purple-500/20 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-2 block">Back (Answer / Definition)</label>
                        <textarea
                            value={back}
                            onChange={e => setBack(e.target.value)}
                            placeholder="The mitochondria."
                            rows={3}
                            className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                            required
                        />
                    </div>

                    {error && <p className="text-red-400 text-xs">{error}</p>}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-400 border border-white/10 hover:bg-white/5 transition-all"
                        >
                            Done
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !front.trim() || !back.trim()}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white text-sm bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-all"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            {loading ? 'Adding...' : 'Add Card'}
                        </button>
                    </div>
                    <p className="text-center text-xs text-gray-600">You can keep adding cards — click Done when finished</p>
                </form>
            </div>
        </div>
    );
}
