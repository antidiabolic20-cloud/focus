-- Add category_name to battles table to support flexible subjects
alter table battles add column if not exists category_name text;

-- Update battles policy to allow filtering/updating based on category if needed
-- (Existing policies mostly rely on auth.uid and status, so they persist)
