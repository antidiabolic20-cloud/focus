
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const SITE_URL = import.meta.env.VITE_SITE_URL || 'http://localhost:5173';
const SITE_NAME = 'Focus - Student Dashboard';

export async function analyzeTestPerformance(testTitle, score, totalMarks, questions, userAnswers) {
    if (!OPENROUTER_API_KEY) {
        console.warn('OpenRouter API Key is missing. AI analysis skipped.');
        return null;
    }

    // Construct a prompt based on the test data
    // We'll send a simplified version of questions to save tokens
    const performanceData = questions.map((q, idx) => {
        const userAnswerIdx = userAnswers[q.id];
        const isCorrect = userAnswerIdx === q.correct_option;
        return {
            question: q.content,
            isCorrect,
            userAnswer: q.options[userAnswerIdx] || 'Skipped',
            correctAnswer: q.options[q.correct_option],
            topic: q.topic || 'General' // Assuming we might have topics in the future, or deduce them
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
                "model": "mistralai/mistral-7b-instruct:free", // Using a free/cheap model for now
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
