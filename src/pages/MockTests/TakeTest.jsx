import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GlassCard } from '../../components/UI/GlassCard';
import { NeonButton } from '../../components/UI/NeonButton';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Clock, AlertTriangle, CheckCircle, ChevronRight, ChevronLeft, Maximize, AlertOctagon } from 'lucide-react';
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

    // Focus Mode State
    const [warnings, setWarnings] = useState(0);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchTestDetails();

        // Enforce Fullscreen & specific listeners
        // Note: Browsers block programmatic fullscreen without user interaction.
        // We will ask user to enter fullscreen to start.
    }, [id, user]);

    useEffect(() => {
        // Tab switching detection
        const handleVisibilityChange = () => {
            if (document.hidden && !submitting) {
                setWarnings(prev => {
                    const newCount = prev + 1;
                    if (newCount <= 3) setShowWarningModal(true);
                    return newCount;
                });
            }
        };

        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener("fullscreenchange", handleFullscreenChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, [submitting]);

    useEffect(() => {
        // Timer Logic
        if (timeLeft > 0 && !submitting) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && test && !submitting) {
            handleSubmit();
        }
    }, [timeLeft, test, submitting]);

    async function fetchTestDetails() {
        try {
            setLoading(true);
            const { data: testData, error: testError } = await supabase
                .from('tests').select('*').eq('id', id).single();
            if (testError) throw testError;
            setTest(testData);
            setTimeLeft(testData.duration_minutes * 60);

            const { data: qData, error: qError } = await supabase
                .from('questions').select('id, content, options, marks').eq('test_id', id);
            if (qError) throw qError;
            setQuestions(qData || []);
        } catch (err) {
            console.error("Error loading test:", err);
            navigate('/tests');
        } finally {
            setLoading(false);
        }
    }

    function handleOptionSelect(qId, optionIdx) {
        setAnswers(prev => ({ ...prev, [qId]: optionIdx }));
    }

    async function enterFullscreen() {
        try {
            await document.documentElement.requestFullscreen();
        } catch (e) {
            console.error("Fullscreen blocked:", e);
        }
    }

    async function handleSubmit() {
        if (!test) return;
        setSubmitting(true);
        if (document.fullscreenElement) {
            try { await document.exitFullscreen(); } catch (e) { }
        }

        try {
            // 1. Grade Test
            const { data: correctAnswers } = await supabase
                .from('questions').select('id, correct_option, marks').eq('test_id', id);

            let totalScore = 0;
            let maxMarks = 0;

            correctAnswers.forEach(q => {
                maxMarks += q.marks;
                if (answers[q.id] === q.correct_option) totalScore += q.marks;
            });

            const percentage = maxMarks > 0 ? (totalScore / maxMarks) * 100 : 0;

            // 2. Save Result
            console.log("Saving result:", { totalScore, maxMarks, percentage });
            const { data: resultData, error } = await supabase
                .from('results')
                .insert({
                    user_id: user.id,
                    test_id: id,
                    score: totalScore,
                    total_marks: maxMarks,
                    percentage: percentage,
                    time_taken_seconds: (test.duration_minutes * 60) - timeLeft,
                    warnings_count: warnings,
                    answers: answers
                })
                .select()
                .single();

            if (error) {
                console.error("Supabase Save Error:", error);
                throw error;
            }
            console.log("Result saved successfully:", resultData);

            // 4. Update XP
            await supabase.rpc('increment_xp', { user_id: user.id, amount: 20 }); // More XP for completion
            if (refreshProfile) await refreshProfile();

            navigate(`/results/${resultData.id}`);

        } catch (err) {
            console.error("Submission error:", err);
            alert("Error submitting test. Please try again.");
            setSubmitting(false);
        }
    }

    if (loading) return <div className="text-center text-white py-20">Loading Test Environment...</div>;
    if (!test) return <div className="text-center text-red-500 py-20">Test not found.</div>;

    // Start Screen (Focus Mode Wall)
    if (!isFullscreen && !submitting && timeLeft === (test.duration_minutes * 60)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto text-center space-y-6">
                <GlassCard className="p-8 border-primary/20 bg-background/50 backdrop-blur-xl">
                    <Maximize className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
                    <h1 className="text-2xl font-bold text-white mb-2">Focus Mode Required</h1>
                    <p className="text-gray-400 mb-6">
                        This mock test requires full concentration. We track tab switching and interruptions.
                        Please enter fullscreen to begin.
                    </p>
                    <NeonButton onClick={enterFullscreen} className="w-full justify-center">
                        Enter Fullscreen & Start
                    </NeonButton>
                </GlassCard>
            </div>
        );
    }

    const currentQ = questions[currentQIndex];
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Warning Overlay */}
            {showWarningModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-red-500/10 border border-red-500 p-8 rounded-2xl max-w-sm text-center">
                        <AlertOctagon className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Warning!</h2>
                        <p className="text-red-200 mb-6">
                            Tab switching is monitored. You have triggered {warnings} warning(s).
                            Please stay on this page to ensure a valid score.
                        </p>
                        <button
                            onClick={() => setShowWarningModal(false)}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold transition-colors"
                        >
                            I Understand
                        </button>
                    </div>
                </div>
            )}

            {/* Header / Timer */}
            <GlassCard className="sticky top-4 md:top-24 z-30 mb-6 flex items-center justify-between p-4 border-primary/20 bg-background/90 backdrop-blur-xl">
                <div>
                    <h2 className="text-lg font-bold text-white truncate max-w-xs">{test.title}</h2>
                    <p className="text-xs text-gray-400">Question {currentQIndex + 1} of {questions.length}</p>
                </div>
                <div className="flex items-center gap-4">
                    {warnings > 0 && (
                        <div className="flex items-center text-red-400 text-xs font-bold animate-pulse">
                            <AlertTriangle className="w-4 h-4 mr-1" /> {warnings} Warnings
                        </div>
                    )}
                    <div className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-xl",
                        timeLeft < 60 ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"
                    )}>
                        <Clock className="w-5 h-5" />
                        {minutes}:{seconds.toString().padStart(2, '0')}
                    </div>
                </div>
            </GlassCard>

            {/* Question Area */}
            {submitting ? (
                <div className="text-center py-20 animate-pulse">
                    <h2 className="text-2xl font-bold text-white mb-2">Submitting Test...</h2>
                </div>
            ) : (
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
            )}

            {/* Navigation Footer */}
            {!submitting && (
                <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-background border-t border-glass-border flex justify-between items-center z-40">
                    <NeonButton
                        variant="outline"
                        disabled={currentQIndex === 0}
                        onClick={() => setCurrentQIndex(prev => prev - 1)}
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                    </NeonButton>

                    <div className="flex gap-2 overflow-x-auto max-w-[200px] md:max-w-md px-2">
                        {questions.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentQIndex(idx)}
                                className={cn(
                                    "w-3 h-3 rounded-full transition-all flex-shrink-0",
                                    idx === currentQIndex ? "bg-primary scale-125" :
                                        answers[questions[idx].id] !== undefined ? "bg-green-500/50" : "bg-gray-700"
                                )}
                            />
                        ))}
                    </div>

                    {currentQIndex === questions.length - 1 ? (
                        <NeonButton
                            className="bg-green-500 hover:bg-green-400 shadow-none hover:shadow-lg hover:shadow-green-500/20 text-black font-bold"
                            onClick={() => {
                                if (confirm("Are you ready to submit?")) handleSubmit();
                            }}
                        >
                            Submit Test <CheckCircle className="w-4 h-4 ml-2" />
                        </NeonButton>
                    ) : (
                        <NeonButton
                            onClick={() => setCurrentQIndex(prev => prev + 1)}
                        >
                            Next <ChevronRight className="w-4 h-4 ml-2" />
                        </NeonButton>
                    )}
                </div>
            )}
        </div>
    );
}
