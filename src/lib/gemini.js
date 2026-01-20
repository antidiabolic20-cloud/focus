
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export async function generateMockTest({ subject, chapter, difficulty, count, grade }) {
    if (!GEMINI_API_KEY) throw new Error("Google Gemini API Key Missing. Please set VITE_GEMINI_API_KEY in .env");

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
        const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const textContent = data.candidates[0].content.parts[0].text;

        // Clean cleanup just in case
        const jsonString = textContent.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Gemini Generation Failed:", error);
        throw error;
    }
}
