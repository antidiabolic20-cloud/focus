import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { GlassCard } from '../../components/UI/GlassCard';
import { NeonButton } from '../../components/UI/NeonButton';
import { CheckCircle, XCircle, AlertTriangle, ChevronRight, Trophy, Target, Zap } from 'lucide-react';
import Confetti from 'react-confetti';
import { cn } from '../../lib/utils';
import { useWindowSize } from 'react-use'; // Just in case, but we can standard window.innerWidth

export default function TestResult() {
    const { id } = useParams();
    const [result, setResult] = useState(null);
    const [test, setTest] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showConfetti, setShowConfetti] = useState(false);

    // Simple window size hook for confetti
    const [windowDimensions, setWindowDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const handleResize = () => setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        fetchResult();
        return () => window.removeEventListener('resize', handleResize);
    }, [id]);

    async function fetchResult() {
        try {
            // 1. Fetch Result
            const { data: resultData, error } = await supabase
                .from('results')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            console.log("Fetched Result:", resultData);
            setResult(resultData);

            if (resultData && resultData.percentage >= 80) {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 8000); // Stop after 8s
            }

            // 2. Fetch Test Info
            const { data: testData, error: testError } = await supabase
                .from('tests')
                .select('*')
                .eq('id', resultData.test_id)
                .single();

            if (testError) console.warn("Error loading test info:", testError);
            console.log("Fetched Test:", testData);
            setTest(testData);

            // 3. Fetch Questions (to review)
            const { data: qData } = await supabase
                .from('questions')
                .select('id, content, options, correct_option, marks')
                .eq('test_id', resultData.test_id);
            setQuestions(qData || []);

        } catch (err) {
            console.error("Error in fetchResult:", err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="text-center text-white py-20">Calculating Results...</div>;
    if (!result || !test) return <div className="text-center text-red-500 py-20">Result not found.</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {showConfetti && <Confetti width={windowDimensions.width} height={windowDimensions.height} recycle={false} numberOfPieces={500} />}

            {/* Hero Card */}
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold text-white">Test Results</h1>
                <p className="text-gray-400">for {test.title}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Score Card */}
                <GlassCard className="col-span-1 md:col-span-2 p-8 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
                    <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 mb-2">
                        {Math.round(result.percentage || 0)}%
                    </div>
                    <p className="text-xl text-gray-400 mb-6">
                        Score: {result.score || 0} / {result.total_marks || 0}
                    </p>

                    <div className="flex gap-4">
                        <div className="text-center px-6 py-3 bg-white/5 rounded-xl border border-glass-border">
                            <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-400 uppercase">XP Earned</p>
                            <p className="text-lg font-bold text-white">+{Math.round((result.score || 0) / 2) + 20}</p>
                        </div>
                        <div className="text-center px-6 py-3 bg-white/5 rounded-xl border border-glass-border">
                            <Clock className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-400 uppercase">Time</p>
                            <p className="text-lg font-bold text-white">
                                {Math.floor((result.time_taken_seconds || 0) / 60)}m {(result.time_taken_seconds || 0) % 60}s
                            </p>
                        </div>
                    </div>
                </GlassCard>

                {/* Focus Metric */}
                <GlassCard className="p-8 flex flex-col items-center justify-center">
                    <Target className={cn(
                        "w-12 h-12 mb-4",
                        result.warnings_count === 0 ? "text-green-500" :
                            result.warnings_count < 3 ? "text-yellow-500" : "text-red-500"
                    )} />
                    <h3 className="text-xl font-bold text-white mb-1">Focus Score</h3>
                    <p className="text-sm text-gray-400 mb-4 text-center">
                        {result.warnings_count === 0 ? "Perfect Concentration! 🎯" :
                            result.warnings_count < 3 ? "Good focus, keep it up!" : "Distracted during test."}
                    </p>
                    <div className="text-xs font-mono bg-black/20 px-3 py-1 rounded text-red-400">
                        {result.warnings_count} Interruptions
                    </div>
                </GlassCard>
            </div>



            {/* Review Section (Placeholder for MVP, but listing questions helps) */}
            <div className="pt-8">
                <Link to="/tests">
                    <NeonButton className="mx-auto w-full md:w-auto justify-center">
                        Back to Tests <ChevronRight className="w-4 h-4 ml-2" />
                    </NeonButton>
                </Link>
            </div>
        </div>
    );
}
