-- Function to safely increment XP
create or replace function increment_xp(user_id uuid, amount int)
returns void as $$
begin
  update profiles
  set xp = xp + amount,
      level = floor((xp + amount) / 100) + 1  -- Simple level formula: 1 level per 100 XP
  where id = user_id;
end;
$$ language plpgsql security definer;
