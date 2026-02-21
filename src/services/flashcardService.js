import { supabase } from '../lib/supabase';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const SITE_URL = import.meta.env.VITE_SITE_URL || 'http://localhost:5173';
const SITE_NAME = 'Focus - Student Dashboard';

const FREE_MODELS = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-3-27b-it:free",
    "deepseek/deepseek-r1-0528:free",
    "arcee-ai/trinity-mini:free",
    "qwen/qwen-2.5-72b-instruct:free",
];

function extractJSON(content) {
    let cleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, '');
    cleaned = cleaned.replace(/```json/gi, '').replace(/```/g, '');
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) return match[0].trim();
    return cleaned.trim();
}

// ─── AI Generation ────────────────────────────────────────────────────────────

export async function generateFlashcardsAI({ topic, count = 10 }) {
    const prompt = `Generate exactly ${count} flashcards about: "${topic}".
    
    Return ONLY a valid JSON array with this exact structure:
    [
      {"front": "Question or term here?", "back": "Answer or definition here."},
      ...
    ]
    
    Rules:
    - Front side: a question, term, or prompt.
    - Back side: concise answer or explanation (1-3 sentences max).
    - No numbering or bullet points inside the text.
    - Seed: ${Date.now()}`;

    for (const model of FREE_MODELS) {
        try {
            console.log(`[Flashcard AI] Trying model: ${model}`);
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "HTTP-Referer": SITE_URL,
                    "X-Title": SITE_NAME,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: "system", content: "You are a JSON-only flashcard generator. Output ONLY a valid JSON array. No markdown, no extra text." },
                        { role: "user", content: prompt },
                    ],
                    temperature: 0.7,
                }),
            });

            if (!response.ok) continue;

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;
            if (!content) continue;

            const jsonString = extractJSON(content);
            const parsed = JSON.parse(jsonString);

            if (Array.isArray(parsed) && parsed.length > 0) {
                console.log(`[Flashcard AI] Success with ${model}`);
                return parsed.slice(0, count);
            }
        } catch (err) {
            console.warn(`[Flashcard AI] Failed with ${model}:`, err.message);
        }
    }
    throw new Error("All AI models failed. Please try again.");
}

// ─── SM-2 Spaced Repetition ───────────────────────────────────────────────────

function sm2(easeFactor, intervalDays, quality) {
    // quality: 1 = Easy, 0 = Hard
    const q = quality === 1 ? 5 : 2; // map to SM-2 quality scale
    let newEF = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    newEF = Math.max(1.3, newEF);

    let newInterval;
    if (q < 3) {
        newInterval = 1; // reset on hard
    } else if (intervalDays === 1) {
        newInterval = 6;
    } else {
        newInterval = Math.round(intervalDays * newEF);
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);

    return { ease_factor: newEF, interval_days: newInterval, next_review: nextReview.toISOString() };
}

// ─── Deck CRUD ────────────────────────────────────────────────────────────────

export async function getDecks(userId) {
    const { data, error } = await supabase
        .from('flashcard_decks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function createDeck({ userId, title, description, subject, color }) {
    const { data, error } = await supabase
        .from('flashcard_decks')
        .insert({ user_id: userId, title, description, subject, color })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function deleteDeck(deckId) {
    const { error } = await supabase
        .from('flashcard_decks')
        .delete()
        .eq('id', deckId);
    if (error) throw error;
}

// ─── Card CRUD ────────────────────────────────────────────────────────────────

export async function getCards(deckId) {
    const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('deck_id', deckId)
        .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
}

export async function addCard({ deckId, front, back }) {
    const { data, error } = await supabase
        .from('flashcards')
        .insert({ deck_id: deckId, front, back })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function bulkAddCards(deckId, cards) {
    const rows = cards.map(c => ({ deck_id: deckId, front: c.front, back: c.back }));
    const { data, error } = await supabase
        .from('flashcards')
        .insert(rows)
        .select();
    if (error) throw error;
    return data;
}

export async function deleteCard(cardId) {
    const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', cardId);
    if (error) throw error;
}

export async function updateCardSRS(cardId, quality, currentCard) {
    const { ease_factor, interval_days, next_review } = sm2(
        currentCard.ease_factor,
        currentCard.interval_days,
        quality
    );
    const { data, error } = await supabase
        .from('flashcards')
        .update({
            ease_factor,
            interval_days,
            next_review,
            times_reviewed: (currentCard.times_reviewed || 0) + 1,
            last_quality: quality,
        })
        .eq('id', cardId)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function getDeckStats(deckId) {
    const { data: cards, error } = await supabase
        .from('flashcards')
        .select('last_quality, times_reviewed, next_review')
        .eq('deck_id', deckId);
    if (error) throw error;

    const now = new Date();
    const total = cards.length;
    const mastered = cards.filter(c => c.last_quality === 1 && c.times_reviewed >= 2).length;
    const dueToday = cards.filter(c => new Date(c.next_review) <= now).length;

    return {
        total,
        mastered,
        dueToday,
        masteryPercent: total > 0 ? Math.round((mastered / total) * 100) : 0,
    };
}
