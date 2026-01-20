
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const SITE_URL = import.meta.env.VITE_SITE_URL || 'http://localhost:5173';
const SITE_NAME = 'Focus - Student Dashboard';
const AI_MODEL = "arcee-ai/trinity-mini:free";

export async function generateMockTest({ subject, chapter, difficulty, count, grade }) {
    if (!OPENROUTER_API_KEY) throw new Error("API Key Missing");

    const prompt = `
        Create a mock test with the following specifications:
        - Subject: ${subject}
        - Chapter/Topic: ${chapter}
        - Grade Level: ${grade}
        - Difficulty: ${difficulty}
        - Number of Questions: ${count}

        For each question, provide:
        1. The Question content
        2. 4 Options (A, B, C, D)
        3. The Correct Option Index (0-3) (0=A, 1=B, etc)
        4. Marks (default 5)

        Return strictly valid JSON in this format:
        {
          "title": "Short descriptive title for the test",
          "description": "Brief description",
          "questions": [
            {
              "content": "Question text...",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correct_option": 0,
              "marks": 5
            }
          ]
        }
        Do not include markdown formatting (like \`\`\`json). Just the raw JSON object.
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
                    { "role": "system", "content": "You are a teacher creating exam questions. Output only valid JSON." },
                    { "role": "user", "content": prompt }
                ],
                "temperature": 0.7,
                "response_format": { "type": "json_object" }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Test Generation Failed:", error);
        throw error;
    }
}

export async function analyzeTestPerformance(testTitle, score, totalMarks, questions, userAnswers) {
    if (!OPENROUTER_API_KEY) {
        console.warn('OpenRouter API Key is missing. AI analysis skipped.');
        return null;
    }

    const performanceData = questions.map((q, idx) => {
        const userAnswerIdx = userAnswers[q.id];
        const isCorrect = userAnswerIdx === q.correct_option;
        return {
            question: q.content,
            isCorrect,
            userAnswer: q.options[userAnswerIdx] || 'Skipped',
            correctAnswer: q.options[q.correct_option],
            topic: q.topic || 'General'
        };
    });

    const prompt = `
    Analyze the following test result for the test "${testTitle}".
    Score: ${score}/${totalMarks}
    
    Question Performance:
    ${JSON.stringify(performanceData, null, 2)}

    Please provide a JSON response with the following structure:
    {
      "strengths": ["string", "string"],
      "weaknesses": ["string", "string"],
      "summary": "A brief encouraging summary of performance.",
      "roadmap": ["Step 1 to improve", "Step 2 to improve"]
    }
    Only return valid JSON. Do not include markdown formatting.
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
                    { "role": "system", "content": "You are an expert tutor providing constructive feedback to a student." },
                    { "role": "user", "content": prompt }
                ],
                "temperature": 0.5,
                "response_format": { "type": "json_object" }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`OpenRouter API Error: ${err}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        try {
            return JSON.parse(content);
        } catch (e) {
            console.error("Failed to parse AI response:", content);
            return null;
        }

    } catch (error) {
        console.error("AI Analysis failed:", error);
        return null;
    }
}
