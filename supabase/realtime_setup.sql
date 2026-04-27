-- Run this in Supabase SQL Editor once so dashboard changes arrive in realtime.
-- RLS policies still need to allow the anon role to select these tables.

do $$
declare
  table_name text;
begin
  foreach table_name in array array['events', 'event_slots', 'event_assignments', 'djs']
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;

    execute format('alter table public.%I replica identity full', table_name);
  end loop;
end $$;
