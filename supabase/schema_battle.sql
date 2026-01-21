-- Create battles table
create table if not exists battles (
  id uuid default uuid_generate_v4() primary key,
  status text check (status in ('waiting', 'active', 'completed')) default 'waiting',
  created_by uuid references profiles(id) not null,
  opponent_id uuid references profiles(id), -- Nullable initially
  winner_id uuid references profiles(id),
  category_id bigint references categories(id),
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

-- DROP OLD POLICIES TO AVOID CONFLICTS
drop policy if exists "Battles are viewable by everyone" on battles;
drop policy if exists "Users can create battles" on battles;
drop policy if exists "Users can update battles they are part of" on battles;
drop policy if exists "Users can join waiting battles" on battles;
drop policy if exists "Progress is viewable by everyone in the battle" on battle_progress;
drop policy if exists "Users can update their own progress" on battle_progress;


-- Battles Policies
create policy "Battles are viewable by everyone" on battles
  for select using (true);

create policy "Users can create battles" on battles
  for insert with check (auth.uid() = created_by);

-- ALLOW JOIN: Users can update a battle if they are part of it OR if it is waiting and has no opponent
create policy "Users can update battles" on battles
  for update using (
    auth.uid() = created_by 
    or auth.uid() = opponent_id
    or (status = 'waiting' and opponent_id is null)
  ); 

-- Battle Progress Policies
create policy "Progress is viewable by everyone in the battle" on battle_progress
  for select using (true);

create policy "Users can update their own progress" on battle_progress
  for all using (auth.uid() = user_id);

-- Realtime publication
-- alter publication supabase_realtime add table battles;
-- alter publication supabase_realtime add table battle_progress;
