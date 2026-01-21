-- Create group_invites table
CREATE TABLE IF NOT EXISTS public.group_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    inviter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    invitee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(group_id, invitee_id)
);

-- RLS Policies
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- Users can see invites sent to them
CREATE POLICY "Users can see their own invites"
    ON public.group_invites FOR SELECT
    USING (auth.uid() = invitee_id);

-- Users can create invites if they are members of the group
CREATE POLICY "Group members can invite others"
    ON public.group_invites FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_id = group_invites.group_id
            AND user_id = auth.uid()
        )
    );

-- Invitees can update (accept/reject) their own invites
CREATE POLICY "Invitees can update their invites"
    ON public.group_invites FOR UPDATE
    USING (auth.uid() = invitee_id);
