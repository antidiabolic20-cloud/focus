const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const SITE_URL = import.meta.env.VITE_SITE_URL || 'http://localhost:5173';
const SITE_NAME = 'Focus - Student Dashboard';

// List of free models to try in order (same as openRouter.js)
const AI_MODELS = [
    "deepseek/deepseek-r1-0528:free",
    "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-3-8b-instruct:free",
    "mistralai/mistral-7b-instruct:free"
];

export const battleAIService = {
    async generateBattleQuestions(categoryName = 'General Knowledge') {
        const prompt = `
            Create 5 quick-fire quiz questions for a 1v1 student battle.
            Topic: ${categoryName}
            Difficulty: Medium
            Type: Multiple Choice
            Unique Seed: ${Date.now()}

            Return ONLY valid JSON array.
            Structure:
            [
                {
                    "content": "Question text?",
                    "options": ["A", "B", "C", "D"],
                    "correct_option": 0
                }
            ]
        `;

        // Try each model until one works
        for (const model of AI_MODELS) {
            try {
                console.log(`[Battle AI] Trying model: ${model}`);

                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                        "HTTP-Referer": SITE_URL,
                        "X-Title": SITE_NAME,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        "model": model,
                        "messages": [
                            { "role": "system", "content": "You are a JSON-only quiz generator. Return only valid JSON arrays." },
                            { "role": "user", "content": prompt }
                        ],
                        "temperature": 0.9
                    })
                });

                if (!response.ok) {
                    const errText = await response.text();
                    console.warn(`[Battle AI] Model ${model} failed: ${errText}`);
                    continue; // Try next model
                }

                const data = await response.json();
                const content = data.choices[0].message.content;
                const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();

                const parsed = JSON.parse(cleanJson);
                console.log(`[Battle AI] Success with model: ${model}`);
                return parsed;

            } catch (error) {
                console.warn(`[Battle AI] Error with ${model}:`, error.message);
                // Continue to next model
            }
        }

        // If all models fail, return fallback questions
        console.error("[Battle AI] All models failed, using fallback questions");
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
};
