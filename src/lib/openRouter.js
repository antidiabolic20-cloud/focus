
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const SITE_URL = import.meta.env.VITE_SITE_URL || 'http://localhost:5173';
const SITE_NAME = 'Focus - Student Dashboard';

// List of verified free models on OpenRouter (Jan 2026)
const AI_MODELS = [
    "meta-llama/llama-3.3-70b-instruct:free",     // Meta's flagship free model
    "google/gemma-3-27b-it:free",                  // Google Gemma 3
    "deepseek/deepseek-r1-0528:free",              // DeepSeek R1 (needs special parsing)
    "arcee-ai/trinity-mini:free",                  // Arcee Trinity Mini
    "liquidai/lfm2.5-1.2b-instruct:free",          // LiquidAI LFM
    "meta-llama/llama-3.1-405b-instruct:free"      // Llama 3.1 405B
];

// Extract JSON from various response formats including DeepSeek's <think> blocks
function extractJSON(content) {
    // Remove DeepSeek's <think>...</think> blocks
    let cleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, '');

    // Remove markdown code blocks
    cleaned = cleaned.replace(/```json/gi, '').replace(/```/g, '');

    // Try to find JSON object in the content
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return jsonMatch[0].trim();
    }

    return cleaned.trim();
}

export async function generateMockTest({ subject, chapter, difficulty, count, grade }) {
    if (!OPENROUTER_API_KEY) throw new Error("OpenRouter API Key Missing. Please set VITE_OPENROUTER_API_KEY in .env");

    const prompt = `
        You are a strict academic examiner. Create a mock test with exactly these specifications:
        - Subject: ${subject}
        - Topic: ${chapter}
        - Grade Level: ${grade}
        - Difficulty: ${difficulty}
        - Question Count: ${count}

        For each question, provide:
        1. Clean Question Text
        2. 4 Distinct Options
        3. Correct Option Index (0-3)
        4. Marks (default 5)

        CRITICAL: Return ONLY valid JSON. No markdown, no comments, no backticks, no thinking text.
        Structure:
        {
          "title": "A short, academic title for this test",
          "description": "A 10-word description of the test scope",
          "questions": [
            {
              "content": "Question text here?",
              "options": ["A", "B", "C", "D"],
              "correct_option": 0,
              "marks": 5
            }
          ]
        }
    `;

    let lastError = null;

    // Try each model in the list until one works
    for (const model of AI_MODELS) {
        try {
            console.log(`Attempting generation with model: ${model}`);

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
                        { "role": "system", "content": "You are a JSON-only API. Return only valid JSON, no other text." },
                        { "role": "user", "content": prompt }
                    ],
                    "temperature": 0.7
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`OpenRouter API Error (${model}): ${err}`);
            }

            const data = await response.json();

            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error(`Invalid response format from OpenRouter (${model})`);
            }

            const content = data.choices[0].message.content;
            const jsonString = extractJSON(content);

            // Validate JSON before returning
            const parsed = JSON.parse(jsonString);

            if (!parsed.questions || !Array.isArray(parsed.questions)) {
                throw new Error(`Model returned invalid JSON structure (${model})`);
            }

            console.log(`Success with model: ${model}`);
            return parsed;

        } catch (error) {
            console.warn(`Failed with model ${model}:`, error.message);
            lastError = error;
            // Continue to next model
        }
    }

    // If we get here, all models failed
    console.error("All AI models failed. Last error:", lastError);
    throw new Error(`All generation attempts failed. Please try again later. Last error: ${lastError.message}`);
}

