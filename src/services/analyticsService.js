import { supabase } from '../lib/supabase';

export const analyticsService = {
    /**
     * Fetches performance across categories for the current user
     */
    async getTopicPerformance(userId) {
        const { data: results, error } = await supabase
            .from('results')
            .select(`
        percentage,
        test:tests (
          category:categories (name)
        )
      `)
            .eq('user_id', userId);

        if (error) throw error;

        // Group by category
        const categoryStats = results.reduce((acc, curr) => {
            const catName = curr.test?.category?.name || 'General';
            if (!acc[catName]) {
                acc[catName] = { name: catName, total: 0, count: 0 };
            }
            acc[catName].total += curr.percentage;
            acc[catName].count += 1;
            return acc;
        }, {});

        return Object.values(categoryStats).map(stat => ({
            subject: stat.name,
            score: Math.round(stat.total / stat.count),
            fullMark: 100
        }));
    },

    /**
     * Fetches score history over time
     */
    async getActivityTimeline(userId) {
        const { data, error } = await supabase
            .from('results')
            .select('percentage, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        console.log("Raw Activity Data:", data);
        return data.map(item => ({
            date: new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            score: Number(item.percentage) || 0
        }));
    },

    /**
     * Fetches general stats summary
     */
    async getSummaryStats(userId) {
        const { data: results, error } = await supabase
            .from('results')
            .select('percentage, time_taken_seconds, score, total_marks')
            .eq('user_id', userId);

        if (error) throw error;

        if (!results || results.length === 0) return null;

        const totalTests = results.length;
        const avgScore = Math.round(results.reduce((acc, c) => acc + c.percentage, 0) / totalTests);
        const avgTime = Math.round(results.reduce((acc, c) => acc + (c.time_taken_seconds || 0), 0) / totalTests);

        return {
            totalTests,
            avgScore,
            avgTimeMinutes: Math.round(avgTime / 60),
            consistency: Math.max(0, 100 - totalTests) // Simplistic consistency logic
        };
    }
};
