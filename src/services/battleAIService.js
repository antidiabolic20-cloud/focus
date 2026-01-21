const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const SITE_URL = import.meta.env.VITE_SITE_URL || 'http://localhost:5173';
const SITE_NAME = 'Focus - Student Dashboard';

// Updated list of ACTUALLY working free models on OpenRouter (Jan 2026)
const AI_MODELS = [
    "deepseek/deepseek-r1-0528:free",
    "qwen/qwen-2.5-72b-instruct:free",
    "nvidia/llama-3.1-nemotron-70b-instruct:free",
    "google/gemma-2-9b-it:free"
];

export const battleAIService = {
    async generateBattleQuestions(categoryName = 'General Knowledge') {
        const prompt = `Generate exactly 5 multiple choice quiz questions about ${categoryName}.

Return ONLY a valid JSON array with this exact structure (no other text):
[
  {"content": "Question text?", "options": ["A", "B", "C", "D"], "correct_option": 0},
  {"content": "Question text?", "options": ["A", "B", "C", "D"], "correct_option": 1}
]

Important: correct_option is the index (0-3) of the correct answer.
Make questions interesting and unique. Seed: ${Date.now()}`;

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
                            { "role": "user", "content": prompt }
                        ],
                        "temperature": 0.8,
                        "max_tokens": 2000
                    })
                });

                if (!response.ok) {
                    const errText = await response.text();
                    console.warn(`[Battle AI] Model ${model} HTTP error: ${errText}`);
                    continue;
                }

                const data = await response.json();

                if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                    console.warn(`[Battle AI] Model ${model} returned invalid structure`);
                    continue;
                }

                let content = data.choices[0].message.content;

                // Clean up the response - extract JSON array
                content = content.replace(/```json/gi, '').replace(/```/g, '').trim();

                // Find the JSON array in the response
                const jsonMatch = content.match(/\[[\s\S]*\]/);
                if (!jsonMatch) {
                    console.warn(`[Battle AI] Model ${model} - no JSON array found in response`);
                    continue;
                }

                const parsed = JSON.parse(jsonMatch[0]);

                if (!Array.isArray(parsed) || parsed.length < 5) {
                    console.warn(`[Battle AI] Model ${model} - invalid array length`);
                    continue;
                }

                console.log(`[Battle AI] Success with model: ${model}`);
                return parsed.slice(0, 5); // Ensure exactly 5 questions

            } catch (error) {
                console.warn(`[Battle AI] Error with ${model}:`, error.message);
            }
        }

        // Fallback questions if all AI fails
        console.error("[Battle AI] All models failed, using fallback questions");
        return this.getFallbackQuestions();
    },

    getFallbackQuestions() {
        // Randomize fallback questions to add variety
        const allQuestions = [
            { content: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correct_option: 1 },
            { content: "What is the capital of France?", options: ["Berlin", "London", "Madrid", "Paris"], correct_option: 3 },
            { content: "H2O is the chemical formula for?", options: ["Salt", "Water", "Oxygen", "Gold"], correct_option: 1 },
            { content: "Who wrote 'Hamlet'?", options: ["Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen"], correct_option: 1 },
            { content: "What is 5 x 5?", options: ["10", "20", "25", "30"], correct_option: 2 },
            { content: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Pacific", "Arctic"], correct_option: 2 },
            { content: "Who painted the Mona Lisa?", options: ["Van Gogh", "Picasso", "Da Vinci", "Monet"], correct_option: 2 },
            { content: "What gas do plants absorb from the air?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correct_option: 2 },
            { content: "How many continents are there?", options: ["5", "6", "7", "8"], correct_option: 2 },
            { content: "What is the speed of light?", options: ["300 km/s", "300,000 km/s", "3,000 km/s", "30,000 km/s"], correct_option: 1 }
        ];

        // Shuffle and pick 5
        const shuffled = allQuestions.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 5);
    }
};
