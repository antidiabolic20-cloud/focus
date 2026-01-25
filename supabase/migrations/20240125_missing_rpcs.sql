-- RPC to safely increment/decrement XP
create or replace function increment_xp(user_id uuid, amount int)
returns void as $$
begin
  update profiles
  set xp = xp + amount
  where id = user_id;
end;
$$ language plpgsql security definer;

-- RPC to add a freeze item
create or replace function add_freeze_item(u_id uuid)
returns void as $$
begin
  insert into streaks (user_id, freeze_items)
  values (u_id, 1)
  on conflict (user_id)
  do update set freeze_items = streaks.freeze_items + 1;
end;
$$ language plpgsql security definer;
