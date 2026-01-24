const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const SITE_URL = import.meta.env.VITE_SITE_URL || 'http://localhost:5173';
const SITE_NAME = 'Focus - Student Dashboard';

// Verified free models
const AI_MODELS = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-3-27b-it:free",
    "deepseek/deepseek-r1-0528:free",
    "arcee-ai/trinity-mini:free",
    "qwen/qwen-2.5-72b-instruct:free"
];

function extractJSON(content) {
    // Remove DeepSeek's <think> blocks
    let cleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, '');
    // Remove markdown code blocks
    cleaned = cleaned.replace(/```json/gi, '').replace(/```/g, '');
    // Find JSON array or object
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (jsonMatch) return jsonMatch[0].trim();
    return cleaned.trim();
}

export const battleAIService = {
    async generateBattleQuestions(categoryName = 'General Knowledge') {
        const prompt = `Generate exactly 5 multiple choice quiz questions about ${categoryName}.
        
        Return ONLY a valid JSON array with this exact structure:
        [
          {"content": "Question text?", "options": ["A", "B", "C", "D"], "correct_option": 0},
          ...
        ]
        
        Important: correct_option is the index (0-3). 
        Make sure questions are unique and diverse. 
        Seed: ${Date.now()}`;

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
                            { "role": "system", "content": "You are a JSON-only quiz generator. Output ONLY valid JSON arrays." },
                            { "role": "user", "content": prompt }
                        ],
                        "temperature": 0.8
                    })
                });

                if (!response.ok) continue;

                const data = await response.json();
                const content = data.choices[0].message.content;
                const jsonString = extractJSON(content);
                const parsed = JSON.parse(jsonString);

                if (Array.isArray(parsed) && parsed.length >= 5) {
                    console.log(`[Battle AI] Success with ${model}`);
                    return parsed.slice(0, 5);
                }
            } catch (error) {
                console.warn(`[Battle AI] Failed with ${model}:`, error.message);
            }
        }

        console.error("[Battle AI] All models failed, using fallbacks");
        return this.getFallbackQuestions(categoryName);
    },

    getFallbackQuestions(categoryName) {
        const fallbacks = {
            "Mathematics": [
                { content: "What is 12 x 12?", options: ["124", "144", "164", "184"], correct_option: 1 },
                { content: "Value of Pi (approx)?", options: ["3.12", "3.14", "3.16", "3.18"], correct_option: 1 },
                { content: "Square root of 81?", options: ["7", "8", "9", "10"], correct_option: 2 },
                { content: "What is 15% of 200?", options: ["20", "25", "30", "35"], correct_option: 2 },
                { content: "Solve: 2x = 10", options: ["x=2", "x=5", "x=10", "x=20"], correct_option: 1 }
            ],
            "Science": [
                { content: "H2O is?", options: ["Gold", "Silver", "Water", "Salt"], correct_option: 2 },
                { content: "Speed of light?", options: ["300 km/s", "300,000 km/s", "3,000 km/s", "Unknown"], correct_option: 1 },
                { content: "Powerhouse of the cell?", options: ["Nucleus", "Mitochondria", "Ribosome", "Wall"], correct_option: 1 },
                { content: "Closest planet to Sun?", options: ["Venus", "Mars", "Mercury", "Earth"], correct_option: 2 },
                { content: "Atomic number of Carbon?", options: ["6", "12", "14", "8"], correct_option: 0 }
            ],
            "History": [
                { content: "First US President?", options: ["Lincoln", "Washington", "Jefferson", "Adams"], correct_option: 1 },
                { content: "Year WWII ended?", options: ["1940", "1944", "1945", "1950"], correct_option: 2 },
                { content: "Who built the Pyramids?", options: ["Romans", "Greeks", "Egyptians", "Mayans"], correct_option: 2 },
                { content: "Discovered America?", options: ["Columbus", "Magellan", "Cook", "Vasco"], correct_option: 0 },
                { content: "French Revolution year?", options: ["1789", "1799", "1800", "1750"], correct_option: 0 }
            ],
            "Geography": [
                { content: "Largest Ocean?", options: ["Atlantic", "Indian", "Pacific", "Arctic"], correct_option: 2 },
                { content: "Capital of Japan?", options: ["Seoul", "Beijing", "Tokyo", "Bangkok"], correct_option: 2 },
                { content: "Longest River?", options: ["Amazon", "Nile", "Yangtze", "Mississippi"], correct_option: 1 },
                { content: "Continents count?", options: ["5", "6", "7", "8"], correct_option: 2 },
                { content: "Desert in Africa?", options: ["Gobi", "Sahara", "Kalahari", "Arabian"], correct_option: 1 }
            ]
        };

        const defaultQs = [
            { content: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correct_option: 1 },
            { content: "What is the capital of France?", options: ["Berlin", "London", "Madrid", "Paris"], correct_option: 3 },
            { content: "H2O is the chemical formula for?", options: ["Salt", "Water", "Oxygen", "Gold"], correct_option: 1 },
            { content: "Who wrote 'Hamlet'?", options: ["Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen"], correct_option: 1 },
            { content: "What is 5 x 5?", options: ["10", "20", "25", "30"], correct_option: 2 }
        ];

        return fallbacks[categoryName] || defaultQs;
    }
};
