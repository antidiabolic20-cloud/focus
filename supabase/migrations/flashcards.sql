-- ============================================================
-- Flashcard System Migration
-- ============================================================

-- 1. Flashcard Decks (collections created by users)
CREATE TABLE IF NOT EXISTS public.flashcard_decks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT,
    color TEXT DEFAULT '#7c3aed',
    card_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Flashcards (individual cards inside a deck)
CREATE TABLE IF NOT EXISTS public.flashcards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deck_id UUID REFERENCES public.flashcard_decks(id) ON DELETE CASCADE NOT NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    -- SM-2 Spaced Repetition fields
    ease_factor FLOAT DEFAULT 2.5,
    interval_days INT DEFAULT 1,
    next_review TIMESTAMPTZ DEFAULT NOW(),
    times_reviewed INT DEFAULT 0,
    last_quality INT DEFAULT NULL, -- 0=Hard, 1=Easy
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Decks: users can only see/edit/delete their own decks
CREATE POLICY "Users manage own flashcard decks"
    ON public.flashcard_decks FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Cards: users can manage cards in their own decks
CREATE POLICY "Users manage cards in own decks"
    ON public.flashcards FOR ALL
    USING (
        deck_id IN (
            SELECT id FROM public.flashcard_decks WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        deck_id IN (
            SELECT id FROM public.flashcard_decks WHERE user_id = auth.uid()
        )
    );

-- 4. Trigger to keep card_count in sync on deck
CREATE OR REPLACE FUNCTION sync_deck_card_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.flashcard_decks SET card_count = card_count + 1 WHERE id = NEW.deck_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.flashcard_decks SET card_count = GREATEST(card_count - 1, 0) WHERE id = OLD.deck_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_flashcard_change
    AFTER INSERT OR DELETE ON public.flashcards
    FOR EACH ROW EXECUTE FUNCTION sync_deck_card_count();
