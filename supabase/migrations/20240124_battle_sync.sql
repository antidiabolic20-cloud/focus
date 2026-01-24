-- Add starts_at column to battles for simultaneous start
alter table battles add column if not exists starts_at timestamp with time zone;
