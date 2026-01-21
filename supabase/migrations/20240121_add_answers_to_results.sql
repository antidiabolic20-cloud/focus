-- Migration to support test solutions
ALTER TABLE public.results 
ADD COLUMN IF NOT EXISTS answers JSONB;
