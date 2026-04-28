-- Allow the dashboard's current slot roles to be saved in event_slots.role.
-- Run this once in the Supabase SQL Editor if saving Main or MC slots fails.

alter table public.event_slots
drop constraint if exists event_slots_role_check;

update public.event_slots
set role = 'Main'
where role in ('Driver', 'Peak');

alter table public.event_slots
add constraint event_slots_role_check
check (role in ('Warm-up', 'Main', 'Closer', 'MC'));
