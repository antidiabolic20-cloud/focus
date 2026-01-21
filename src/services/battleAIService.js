import { supabase } from '../lib/supabase';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const SITE_URL = import.meta.env.VITE_SITE_URL || 'http://localhost:5173';
const SITE_NAME = 'Focus - Student Dashboard';

// Use specific DeepSeek model as requested
const AI_MODEL = "deepseek/deepseek-r1:free";

export const battleAIService = {
    async generateBattleQuestions(categoryName = 'General Knowledge') {
        const prompt = `
            Create 5 quick-fire quiz questions for a 1v1 student battle.
            Topic: ${categoryName}
            Difficulty: Medium
            Type: Multiple Choice

            Return ONLY valid JSON.
            Structure:
            [
                {
                    "content": "Question text?",
                    "options": ["A", "B", "C", "D"],
                    "correct_option": 0
                }
            ]
        `;

        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "HTTP-Referer": SITE_URL,
                    "X-Title": SITE_NAME,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": AI_MODEL,
                    "messages": [
                        { "role": "system", "content": "You are a JSON-only quiz generator." },
                        { "role": "user", "content": prompt }
                    ],
                    "temperature": 0.8
                })
            });

            if (!response.ok) throw new Error("AI Generation Failed");

            const data = await response.json();
            const content = data.choices[0].message.content;
            const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();

            return JSON.parse(cleanJson);
        } catch (error) {
            console.error("Battle AI Error:", error);
            // Fallback questions if AI fails
            return [
                {
                    content: "Which planet is known as the Red Planet?",
                    options: ["Venus", "Mars", "Jupiter", "Saturn"],
                    correct_option: 1
                },
                {
                    content: "What is the capital of France?",
                    options: ["Berlin", "London", "Madrid", "Paris"],
                    correct_option: 3
                },
                {
                    content: "H2O is the chemical formula for?",
                    options: ["Salt", "Water", "Oxygen", "Gold"],
                    correct_option: 1
                },
                {
                    content: "Who wrote 'Hamlet'?",
                    options: ["Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen"],
                    correct_option: 1
                },
                {
                    content: "What is 5 x 5?",
                    options: ["10", "20", "25", "30"],
                    correct_option: 2
                }
            ];
        }
    }
};
