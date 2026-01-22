-- Create streaks table
CREATE TABLE IF NOT EXISTS public.streaks (
    user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_login DATE,
    freeze_items INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for streaks
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own streak"
    ON public.streaks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak"
    ON public.streaks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak"
    ON public.streaks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create resources table
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    author_id UUID REFERENCES auth.users(id) NOT NULL,
    downloads INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for resources
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view resources"
    ON public.resources FOR SELECT
    USING (true);

CREATE POLICY "Users can upload resources"
    ON public.resources FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their resources"
    ON public.resources FOR DELETE
    USING (auth.uid() = author_id);

-- Create resource_likes table for analytics/prevention of double likes
CREATE TABLE IF NOT EXISTS public.resource_likes (
    resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (resource_id, user_id)
);

-- Enable RLS for likes
ALTER TABLE public.resource_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view likes"
    ON public.resource_likes FOR SELECT
    USING (true);

CREATE POLICY "Users can toggle likes"
    ON public.resource_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove likes"
    ON public.resource_likes FOR DELETE
    USING (auth.uid() = user_id);

-- Storage bucket for resources
-- Note: You'll need to create a bucket named 'resource_entries' in Supabase dashboard manually if this script doesn't run in full admin mode, 
-- but RLS policies for storage objects can be set here.

-- Allow public access to read resources
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'resource_entries' );

-- Allow authenticated users to upload resources
CREATE POLICY "Auth Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resource_entries' AND
  auth.role() = 'authenticated'
);

-- RPC for atomic increments
CREATE OR REPLACE FUNCTION increment_downloads(row_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.resources
  SET downloads = downloads + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_likes(row_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.resources
  SET likes_count = likes_count + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_likes(row_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.resources
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
