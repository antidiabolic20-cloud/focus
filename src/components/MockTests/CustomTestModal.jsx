import React, { useState } from 'react';
import { GlassCard } from '../UI/GlassCard';
import { NeonButton } from '../UI/NeonButton';
import { generateMockTest } from '../../lib/openRouter';
import { supabase } from '../../lib/supabase';
import { Sparkles, X, BookOpen, Layers, BarChart, GraduationCap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function CustomTestModal({ onClose }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Default form data
    const [formData, setFormData] = useState({
        subject: '',
        chapter: '',
        grade: '',
        difficulty: 'Medium',
        count: 10
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGenerate = async () => {
        if (!formData.subject || !formData.chapter || !formData.grade) return;

        setLoading(true);
        try {
            // 1. Generate via Google Gemini
            const aiData = await generateMockTest(formData);

            if (!aiData || !aiData.questions) throw new Error("AI returned invalid data structure");

            // 2. Create Test in DB
            const { data: testData, error: testError } = await supabase
                .from('tests')
                .insert({
                    title: aiData.title,
                    description: aiData.description,
                    category_id: null,
                    duration_minutes: Math.ceil(formData.count * 1.5), // 1.5 mins per question
                    difficulty: formData.difficulty
                })
                .select()
                .single();

            if (testError) throw testError;

            // 3. Insert Questions
            const questionsToInsert = aiData.questions.map(q => ({
                test_id: testData.id,
                content: q.content,
                options: q.options,
                correct_option: q.correct_option,
                marks: q.marks || 5
            }));

            const { error: qError } = await supabase
                .from('questions')
                .insert(questionsToInsert);

            if (qError) throw qError;

            // 4. Success -> Redirect
            onClose();
            navigate(`/tests/${testData.id}`);

        } catch (error) {
            console.error(error);
            alert(`Generation Failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
            <GlassCard className="w-full max-w-lg p-0 overflow-hidden border-primary/50 relative">
                {/* Header */}
                <div className="p-6 border-b border-glass-border bg-primary/10 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-bold text-white">AI Test Generator</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8">
                    {loading ? (
                        <div className="text-center py-12 space-y-4">
                            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <h3 className="text-xl font-bold text-white">AI is Thinking...</h3>
                            <p className="text-gray-400">Crafting high-quality questions for you.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4" /> Subject & Topic
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        name="subject" placeholder="Ex: Physics"
                                        value={formData.subject} onChange={handleChange}
                                        className="bg-black/20 border border-glass-border rounded-lg p-3 text-white focus:border-primary outline-none"
                                    />
                                    <input
                                        name="chapter" placeholder="Ex: Thermodynamics"
                                        value={formData.chapter} onChange={handleChange}
                                        className="bg-black/20 border border-glass-border rounded-lg p-3 text-white focus:border-primary outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-gray-400 flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4" /> Grade Level
                                </label>
                                <input
                                    name="grade" placeholder="Ex: High School / JEE Mains"
                                    value={formData.grade} onChange={handleChange}
                                    className="w-full bg-black/20 border border-glass-border rounded-lg p-3 text-white focus:border-primary outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400 flex items-center gap-2">
                                        <BarChart className="w-4 h-4" /> Difficulty
                                    </label>
                                    <select
                                        name="difficulty"
                                        value={formData.difficulty} onChange={handleChange}
                                        className="w-full bg-black/20 border border-glass-border rounded-lg p-3 text-white focus:border-primary outline-none"
                                    >
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400 flex items-center gap-2">
                                        <Layers className="w-4 h-4" /> Questions
                                    </label>
                                    <select
                                        name="count"
                                        value={formData.count} onChange={handleChange}
                                        className="w-full bg-black/20 border border-glass-border rounded-lg p-3 text-white focus:border-primary outline-none"
                                    >
                                        <option value="5">5 Questions</option>
                                        <option value="10">10 Questions</option>
                                        <option value="15">15 Questions</option>
                                        <option value="20">20 Questions</option>
                                    </select>
                                </div>
                            </div>

                            <NeonButton onClick={handleGenerate} className="w-full justify-center mt-4">
                                Generate Test <ArrowRight className="w-4 h-4 ml-2" />
                            </NeonButton>
                        </div>
                    )}
                </div>
            </GlassCard>
        </div>
    );
}
