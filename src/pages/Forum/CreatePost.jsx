import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/UI/GlassCard';
import { NeonButton } from '../../components/UI/NeonButton';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function CreatePost() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Redirect if not logged in
        if (!user) {
            navigate('/login');
            return;
        }

        // Fetch categories for the dropdown
        async function fetchCats() {
            const { data } = await supabase.from('categories').select('*');
            if (data) {
                setCategories(data);
                if (data.length > 0) setCategoryId(data[0].id);
            }
        }
        fetchCats();
    }, [user, navigate]);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (!title || !body || !categoryId) {
            setError("Please fill in all fields.");
            return;
        }

        try {
            setLoading(true);
            // We need to fetch the profile id first usually, but for now we assume auth.uid() 
            // linked to profiles table via id. The trigger creates a profile with same ID.

            const postData = {
                title,
                body,
                category_id: categoryId,
                author_id: user.id
            };

            const { error: insertError } = await supabase
                .from('threads')
                .insert([postData]);

            if (insertError) throw insertError;

            navigate('/forums');
        } catch (err) {
            console.error("Post creation error:", err);
            setError(err.message || "Failed to create post.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-white">Create New Discussion</h1>

            <GlassCard className="p-8">
                {error && <div className="bg-red-500/10 text-red-500 p-3 rounded-lg mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Category</label>
                        <select
                            className="w-full bg-background-lighter border border-glass-border rounded-lg px-4 py-2.5 text-white focus:border-primary outline-none"
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                        >
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Title</label>
                        <input
                            type="text"
                            className="w-full bg-background-lighter border border-glass-border rounded-lg px-4 py-2.5 text-white focus:border-primary outline-none"
                            placeholder="What's on your mind?"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Body</label>
                        <textarea
                            className="w-full bg-background-lighter border border-glass-border rounded-lg px-4 py-2.5 text-white focus:border-primary outline-none h-40 resize-none"
                            placeholder="Describe your question or topic in detail..."
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <NeonButton type="submit" disabled={loading}>
                            {loading ? 'Publishing...' : 'Publish Post'}
                        </NeonButton>
                        <button
                            type="button"
                            onClick={() => navigate('/forums')}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </GlassCard>
        </div>
    );
}
