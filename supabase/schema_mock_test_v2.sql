-- Add columns for advanced analytics to the results table
alter table results 
add column if not exists warnings_count int default 0,
add column if not exists ai_analysis jsonb, -- Stores the JSON response from OpenRouter
add column if not exists feedback text; -- Summary text

-- Optional: Create a table for detailed question-level analytics if needed later
-- For now, we will store question-level feedback in the 'ai_analysis' jsonb column
