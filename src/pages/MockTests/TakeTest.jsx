import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GlassCard } from '../../components/UI/GlassCard';
import { NeonButton } from '../../components/UI/NeonButton';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Clock, AlertTriangle, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function TakeTest() {
    const { id } = useParams();
    const { user, refreshProfile } = useAuth();
    const navigate = useNavigate();

    const [test, setTest] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({}); // { questionId: selectedOptionIndex }

    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0); // in seconds
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchTestDetails();
    }, [id, user]);

    useEffect(() => {
        // Timer Logic
        if (timeLeft > 0 && !submitting) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && test && !submitting) {
            // Auto-submit logic could go here
        }
    }, [timeLeft, test, submitting]);

    async function fetchTestDetails() {
        try {
            setLoading(true);
            // 1. Fetch Test Info
            const { data: testData, error: testError } = await supabase
                .from('tests')
                .select('*')
                .eq('id', id)
                .single();

            if (testError) throw testError;
            setTest(testData);
            setTimeLeft(testData.duration_minutes * 60);

            // 2. Fetch Questions
            const { data: qData, error: qError } = await supabase
                .from('questions')
                .select('id, content, options, marks') // Don't fetch correct_option obviously!
                .eq('test_id', id);

            if (qError) throw qError;
            setQuestions(qData || []);

        } catch (err) {
            console.error("Error loading test:", err);
            alert("Failed to load test. Please try again.");
            navigate('/tests');
        } finally {
            setLoading(false);
        }
    }

    function handleOptionSelect(qId, optionIdx) {
        setAnswers(prev => ({
            ...prev,
            [qId]: optionIdx
        }));
    }

    async function handleSubmit() {
        if (!confirm("Are you sure you want to submit?")) return;

        setSubmitting(true);
        try {
            // 1. Calculate Score (Server-side calculation is better, but doing client-side for MVP speed)
            // We need to fetch answers to calculate score securely usually, 
            // generally we submit answers to an RPC or edge function.
            // For this MVP, we will fetch correct answers NOW to grade.

            const { data: correctAnswers } = await supabase
                .from('questions')
                .select('id, correct_option, marks')
                .eq('test_id', id);

            let totalScore = 0;
            let maxMarks = 0;

            correctAnswers.forEach(q => {
                maxMarks += q.marks;
                if (answers[q.id] === q.correct_option) {
                    totalScore += q.marks;
                }
            });

            const percentage = (totalScore / maxMarks) * 100;

            // 2. Save Result
            const { error } = await supabase
                .from('results')
                .insert({
                    user_id: user.id,
                    test_id: id,
                    score: totalScore,
                    total_marks: maxMarks,
                    percentage: percentage,
                    time_taken_seconds: (test.duration_minutes * 60) - timeLeft
                });

            if (error) throw error;

            // 3. Update XP (Simple +10 XP per test for now)
            await supabase.rpc('increment_xp', { user_id: user.id, amount: 10 });

            // 4. Refresh Profile in Context
            if (refreshProfile) {
                await refreshProfile();
            }

            navigate('/profile'); // Or a result page
            alert(`Test Submitted! You scored ${totalScore}/${maxMarks} (${percentage.toFixed(1)}%)`);

        } catch (err) {
            console.error("Submission error:", err);
            alert("Error submitting test. Please try again.");
            setSubmitting(false);
        }
    }

    if (loading) return <div className="text-center text-white py-20">Loading Test Environment...</div>;
    if (!test) return <div className="text-center text-red-500 py-20">Test not found.</div>;

    const currentQ = questions[currentQIndex];

    // Format Time
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Header / Timer */}
            <GlassCard className="sticky top-24 z-30 mb-6 flex items-center justify-between p-4 border-primary/20 bg-background/90 backdrop-blur-xl">
                <div>
                    <h2 className="text-lg font-bold text-white truncate max-w-xs">{test.title}</h2>
                    <p className="text-xs text-gray-400">Question {currentQIndex + 1} of {questions.length}</p>
                </div>
                <div className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-xl",
                    timeLeft < 60 ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"
                )}>
                    <Clock className="w-5 h-5" />
                    {minutes}:{seconds.toString().padStart(2, '0')}
                </div>
            </GlassCard>

            {/* Question Area */}
            <GlassCard className="p-8 min-h-[400px] flex flex-col">
                {currentQ ? (
                    <>
                        <div className="mb-8">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Question {currentQIndex + 1}</span>
                            <h3 className="text-xl md:text-2xl font-medium text-white leading-relaxed">
                                {currentQ.content}
                            </h3>
                        </div>

                        <div className="space-y-3 max-w-2xl">
                            {currentQ.options?.map((opt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleOptionSelect(currentQ.id, idx)}
                                    className={cn(
                                        "w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3 group",
                                        answers[currentQ.id] === idx
                                            ? "bg-primary/20 border-primary text-white shadow-neon-purple/20"
                                            : "bg-background-lighter border-glass-border text-gray-400 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <div className={cn(
                                        "w-6 h-6 rounded-full border flex items-center justify-center text-xs transition-colors",
                                        answers[currentQ.id] === idx
                                            ? "border-primary bg-primary text-white"
                                            : "border-gray-600 group-hover:border-gray-400"
                                    )}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-20">No questions in this test.</div>
                )}
            </GlassCard>

            {/* Navigation Footer */}
            <div className="fixed bottom-0 left-64 right-0 p-4 bg-background border-t border-glass-border flex justify-between items-center z-40">
                <NeonButton
                    variant="outline"
                    disabled={currentQIndex === 0}
                    onClick={() => setCurrentQIndex(prev => prev - 1)}
                >
                    <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                </NeonButton>

                <div className="flex gap-2">
                    {questions.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentQIndex(idx)}
                            className={cn(
                                "w-3 h-3 rounded-full transition-all",
                                idx === currentQIndex ? "bg-primary scale-125" :
                                    answers[questions[idx].id] !== undefined ? "bg-green-500/50" : "bg-gray-700"
                            )}
                        />
                    ))}
                </div>

                {currentQIndex === questions.length - 1 ? (
                    <NeonButton
                        className="bg-green-500 hover:bg-green-400 shadow-none hover:shadow-lg hover:shadow-green-500/20 text-black font-bold"
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? 'Submitting...' : 'Submit Test'} <CheckCircle className="w-4 h-4 ml-2" />
                    </NeonButton>
                ) : (
                    <NeonButton
                        onClick={() => setCurrentQIndex(prev => prev + 1)}
                    >
                        Next <ChevronRight className="w-4 h-4 ml-2" />
                    </NeonButton>
                )}
            </div>
        </div>
    );
}
