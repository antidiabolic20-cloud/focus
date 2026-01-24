import { supabase } from '../lib/supabase';
import { battleAIService } from './battleAIService';

export const battleService = {
    /**
     * Finds an existing waiting battle or creates a new one
     */
    async findOrCreateBattle(userId, categoryName = 'General Knowledge') {
        // 1. Try to find an open battle (status = waiting) with same category
        let query = supabase
            .from('battles')
            .select('*')
            .eq('status', 'waiting')
            .neq('created_by', userId) // Don't join your own battle
            .limit(1);

        if (categoryName) {
            query = query.eq('category_name', categoryName);
        }

        const { data: availableBattles, error } = await query;
        if (error) {
            console.error("Matchmaking Search Error:", error);
            throw error;
        }

        if (availableBattles && availableBattles.length > 0) {
            // JOIN EXISTING BATTLE
            const battle = availableBattles[0];
            const { data: joinedBattle, error: joinError } = await supabase
                .from('battles')
                .update({
                    status: 'active',
                    opponent_id: userId,
                    starts_at: new Date(Date.now() + 5000).toISOString() // Start in 5 seconds
                })
                .eq('id', battle.id)
                .select()
                .single();

            if (joinError) {
                console.error("Matchmaking Join Error:", joinError);
                throw joinError;
            }

            // Initialize progress for player 2
            await this.initProgress(battle.id, userId);

            return { battle: joinedBattle, role: 'opponent' };
        } else {
            // CREATE NEW BATTLE
            // Fetch 5 random questions for this category
            const questions = await this.fetchRandomQuestions(categoryName);

            const { data: newBattle, error: createError } = await supabase
                .from('battles')
                .insert({
                    created_by: userId,
                    status: 'waiting',
                    category_name: categoryName,
                    questions: questions
                })
                .select()
                .single();

            if (createError) {
                console.error("Matchmaking Create Error:", createError);
                throw createError;
            }

            // Initialize progress for player 1
            await this.initProgress(newBattle.id, userId);

            return { battle: newBattle, role: 'creator' };
        }
    },

    async initProgress(battleId, userId) {
        return await supabase.from('battle_progress').insert({
            battle_id: battleId,
            user_id: userId,
            current_question_index: 0,
            score: 0
        });
    },

    async fetchRandomQuestions(categoryName) {
        return await battleAIService.generateBattleQuestions(categoryName || 'General Knowledge');
    },

    async updateProgress(progressId, updates) {
        return await supabase
            .from('battle_progress')
            .update(updates)
            .eq('id', progressId);
    },

    async getBattleDetails(battleId) {
        const { data, error } = await supabase
            .from('battles')
            .select(`
            *,
            player1:profiles!created_by(id, username, avatar_url),
            player2:profiles!opponent_id(id, username, avatar_url)
        `)
            .eq('id', battleId)
            .single();

        if (error) throw error;
        return data;
    }
};
