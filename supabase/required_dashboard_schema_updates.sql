-- Required dashboard schema updates.
-- Run this once in Supabase SQL Editor if saves fail after adding
-- Pending/Need Attention statuses or Main/MC slot roles.

alter table public.events
drop constraint if exists events_status_check;

alter table public.events
add constraint events_status_check
check (status in ('Confirmed', 'Unconfirmed', 'No Lineup', 'Urgent', 'Need Attention'));

alter table public.event_slots
drop constraint if exists event_slots_role_check;

update public.event_slots
set role = 'Main'
where role in ('Driver', 'Peak');

alter table public.event_slots
add constraint event_slots_role_check
check (role in ('Warm-up', 'Main', 'Closer', 'MC'));
