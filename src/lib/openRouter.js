
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const SITE_URL = import.meta.env.VITE_SITE_URL || 'http://localhost:5173';
const SITE_NAME = 'Focus - Student Dashboard';

// Using a reliable free model. Google's experimental flash model is often free on OpenRouter.
const AI_MODEL = "google/gemini-2.0-flash-exp:free";

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

        CRITICAL: Return ONLY valid JSON. No markdown, no comments, no backticks.
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
                    { "role": "system", "content": "You are a JSON-only API. specific formatting is required." },
                    { "role": "user", "content": prompt }
                ],
                "temperature": 0.7,
                "response_format": { "type": "json_object" }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`OpenRouter API Error: ${err}`);
        }

        const data = await response.json();

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error("Invalid response format from OpenRouter");
        }

        const content = data.choices[0].message.content;
        const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Test Generation Failed:", error);
        throw error;
    }
}
