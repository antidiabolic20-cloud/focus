import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../components/UI/GlassCard';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Upload, Search, Filter, Plus, FileText, Image, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { ResourceCard } from '../components/Resources/ResourceCard';

export default function Resources() {
    const { user } = useAuth();
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('All');

    // Upload Modal State
    const [showUpload, setShowUpload] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [subject, setSubject] = useState('Math');

    const fileInputRef = useRef(null);

    const SUBJECTS = ['All', 'Math', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Computer Science'];

    useEffect(() => {
        if (user) fetchResources();
    }, [user, selectedSubject]);

    async function fetchResources() {
        setLoading(true);
        try {
            let query = supabase
                .from('resources')
                .select(`
                    *,
                    is_liked:resource_likes!left(user_id)
                `)
                .order('created_at', { ascending: false });

            if (selectedSubject !== 'All') {
                query = query.eq('subject', selectedSubject);
            }

            const { data, error } = await query;

            if (error) throw error;

            // transform is_liked to boolean (if array has items, it's liked)
            const formatted = data.map(r => ({
                ...r,
                is_liked: r.is_liked?.length > 0
            }));

            setResources(formatted);
        } catch (error) {
            console.error('Error fetching resources:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile || !title || !user) return;

        setUploading(true);
        try {
            // 1. Upload file to Storage
            const fileExt = uploadFile.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('resource_entries')
                .upload(filePath, uploadFile);

            if (uploadError) throw uploadError;

            // 2. Insert metadata to DB
            const { error: dbError } = await supabase.from('resources').insert({
                title,
                description,
                subject,
                file_url: filePath,
                file_type: uploadFile.type,
                author_id: user.id
            });

            if (dbError) throw dbError;

            // Reset and refresh
            setShowUpload(false);
            setUploadFile(null);
            setTitle('');
            setDescription('');
            fetchResources();
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this resource?')) return;
        try {
            const { error } = await supabase.from('resources').delete().eq('id', id);
            if (error) throw error;
            setResources(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const filteredResources = resources.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                        Resources Hub
                    </h1>
                    <p className="text-gray-400 mt-1">Share notes, papers, and study materials.</p>
                </div>
                <button
                    onClick={() => setShowUpload(true)}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-glow text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-neon-purple/20"
                >
                    <Plus className="w-5 h-5" />
                    Upload Resource
                </button>
            </div>

            {/* Filters */}
            <GlassCard className="p-4 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search resources..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-background-lighter border border-glass-border rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    {SUBJECTS.map(sub => (
                        <button
                            key={sub}
                            onClick={() => setSelectedSubject(sub)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors",
                                selectedSubject === sub
                                    ? "bg-primary text-white"
                                    : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                            )}
                        >
                            {sub}
                        </button>
                    ))}
                </div>
            </GlassCard>

            {/* Grid */}
            {loading ? (
                <div className="text-center py-20 text-gray-500">Loading resources...</div>
            ) : filteredResources.length === 0 ? (
                <div className="text-center py-20 text-gray-500 bg-white/5 rounded-2xl border border-dashed border-gray-700">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No resources found. Be the first to upload!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResources.map(res => (
                        <ResourceCard
                            key={res.id}
                            resource={res}
                            onLike={() => { }} // Handle inside card for optimistic update but could refresh here
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            {showUpload && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <GlassCard className="w-full max-w-lg relative animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-primary" />
                            Upload Resource
                        </h2>

                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Title</label>
                                <input
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full bg-background-lighter border border-glass-border rounded-lg px-4 py-2 text-white focus:border-primary outline-none"
                                    placeholder="e.g. Calculus Notes Chapter 1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Description (Optional)</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full bg-background-lighter border border-glass-border rounded-lg px-4 py-2 text-white focus:border-primary outline-none h-24 resize-none"
                                    placeholder="Briefly describe what this file contains..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Subject</label>
                                    <select
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                        className="w-full bg-background-lighter border border-glass-border rounded-lg px-4 py-2 text-white focus:border-primary outline-none"
                                    >
                                        {SUBJECTS.filter(s => s !== 'All').map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">File (PDF/Image)</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full bg-background-lighter border border-dashed border-gray-600 hover:border-primary rounded-lg px-4 py-2 text-gray-400 cursor-pointer text-sm truncate flex items-center gap-2"
                                    >
                                        <Upload className="w-4 h-4" />
                                        {uploadFile ? uploadFile.name : 'Choose File'}
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,image/*"
                                        onChange={e => setUploadFile(e.target.files[0])}
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6 pt-4 border-t border-glass-border">
                                <button
                                    type="button"
                                    onClick={() => setShowUpload(false)}
                                    className="flex-1 px-4 py-2 rounded-xl text-gray-400 hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading || !uploadFile}
                                    className="flex-1 bg-primary hover:bg-primary-glow text-white px-4 py-2 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <>Uploading...</>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Upload
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
