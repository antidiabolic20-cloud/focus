-- Create battles table
create table if not exists battles (
  id uuid default uuid_generate_v4() primary key,
  status text check (status in ('waiting', 'active', 'completed')) default 'waiting',
  created_by uuid references profiles(id) not null,
  opponent_id uuid references profiles(id), -- Nullable initially
  winner_id uuid references profiles(id),
  category_id uuid references categories(id),
  questions jsonb default '[]'::jsonb, -- Store the 5 questions for this match
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create battle_progress table
create table if not exists battle_progress (
  id uuid default uuid_generate_v4() primary key,
  battle_id uuid references battles(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  current_question_index int default 0,
  score int default 0,
  is_finished boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (battle_id, user_id)
);

-- Enable RLS
alter table battles enable row level security;
alter table battle_progress enable row level security;

-- Policies for battles
create policy "Battles are viewable by everyone" on battles
  for select using (true);

create policy "Users can create battles" on battles
  for insert with check (auth.uid() = created_by);

create policy "Users can update battles they are part of" on battles
  for update using (auth.uid() = created_by or auth.uid() = opponent_id);

-- Policies for battle_progress
create policy "Progress is viewable by everyone in the battle" on battle_progress
  for select using (true);

create policy "Users can update their own progress" on battle_progress
  for all using (auth.uid() = user_id);

-- Realtime publication
-- IMPORTANT: You must enable replication for these tables in your Supabase dashboard or via API
-- alter publication supabase_realtime add table battles;
-- alter publication supabase_realtime add table battle_progress;
