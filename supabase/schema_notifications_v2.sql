-- Function to create notification for new group message
create or replace function notify_on_new_group_message()
returns trigger as $$
declare
  member_record record;
  sender_name text;
  group_name text;
begin
  -- Get sender's username and group name
  select username into sender_name from profiles where id = new.author_id;
  select name into group_name from groups where id = new.group_id;

  -- Notify all members of the group except the sender
  for member_record in 
    select user_id from group_members where group_id = new.group_id and user_id != new.author_id
  loop
    insert into notifications (user_id, type, title, content, link)
    values (
      member_record.user_id,
      'message',
      'Group Message in ' || group_name,
      sender_name || ': ' || new.content,
      '/groups/' || new.group_id
    );
  end loop;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new group message notification
create trigger on_new_group_message_notification
after insert on group_messages
for each row execute procedure notify_on_new_group_message();

-- Update badge awarding function to also send notifications
create or replace function check_performance_badges()
returns trigger as $$
declare
  subject_name text;
  avg_score numeric;
  test_count int;
  existing_badges text[];
  new_badge text;
begin
  -- Get the category name of the test
  select name into subject_name from categories
  where id = (select category_id from tests where id = new.test_id);

  if subject_name is null then
    return new;
  end if;

  select avg(percentage), count(*) into avg_score, test_count
  from results r
  join tests t on r.test_id = t.id
  join categories c on t.category_id = c.id
  where r.user_id = new.user_id 
  and c.name = subject_name;

  if test_count >= 3 and avg_score >= 90 then
    if subject_name = 'Mathematics' then new_badge := 'Master Mathematician';
    elsif subject_name = 'Physics' then new_badge := 'Super Physicist';
    elsif subject_name = 'Chemistry' then new_badge := 'Alchemist';
    else new_badge := 'Master ' || subject_name;
    end if;

    select badges into existing_badges from profiles where id = new.user_id;
    
    if not (existing_badges @> array[new_badge]) then
      update profiles 
      set badges = array_append(badges, new_badge)
      where id = new.user_id;

      -- Send Notification
      insert into notifications (user_id, type, title, content, link)
      values (
        new.user_id,
        'badge',
        '🏆 New Badge Earned!',
        'Congratulations! You just earned the "' || new_badge || '" badge.',
        '/profile'
      );
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;
