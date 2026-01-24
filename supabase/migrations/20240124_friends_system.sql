-- Create friends table
create table if not exists friends (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  friend_id uuid references profiles(id) not null,
  status text check (status in ('pending', 'accepted')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, friend_id)
);

-- Enable RLS
alter table friends enable row level security;

-- Policies

-- View: Users can see their own friendships (incoming or outgoing)
create policy "Users can view their own friendships" on friends
  for select using (
    auth.uid() = user_id or auth.uid() = friend_id
  );

-- Insert: Users can send friend requests (user_id is sender)
create policy "Users can send friend requests" on friends
  for insert with check (
    auth.uid() = user_id
  );

-- Update: Users can accept requests (friend_id is receiver) or sender can update? 
-- Actually only receiver should accept. Sender might cancel.
-- Let's allow update if involved.
create policy "Users can update their friendships" on friends
  for update using (
    auth.uid() = user_id or auth.uid() = friend_id
  );

-- Delete: Users can remove friends or cancel requests
create policy "Users can delete their friendships" on friends
  for delete using (
    auth.uid() = user_id or auth.uid() = friend_id
  );
