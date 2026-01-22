-- 1. Enhance Profiles Table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS academic_goals TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS subjects_of_interest TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS study_style TEXT; -- e.g., 'Visual', 'Auditory', 'Late Night', 'Early Morning'

-- 2. Create Partner Requests Table (The "Lobby" for matching)
CREATE TABLE IF NOT EXISTS public.partner_requests (
    user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
    status TEXT DEFAULT 'active', -- 'active', 'matched'
    looking_for TEXT[], -- e.g., ['Math', 'Physics']
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.partner_requests ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view active requests
CREATE POLICY "Public View Active Requests"
    ON public.partner_requests FOR SELECT
    USING (status = 'active');

-- Allow users to create/update their own request
CREATE POLICY "Users Manage Own Request"
    ON public.partner_requests FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
