-- Add columns for advanced analytics to the results table
alter table results 
add column if not exists warnings_count int default 0;

-- Optional: Create a table for detailed question-level analytics if needed later
-- For now, we will store question-level feedback in the 'ai_analysis' jsonb column
