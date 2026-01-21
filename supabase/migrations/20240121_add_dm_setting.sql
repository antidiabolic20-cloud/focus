-- Add allow_dms setting to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS allow_dms BOOLEAN DEFAULT true;

-- Update group_invites migration to include it if not already run
-- (Actually, I'll just run this as a separate migration)
