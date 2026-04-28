-- Allow the dashboard's Need Attention status to save in Supabase.
alter table public.events
drop constraint if exists events_status_check;

alter table public.events
add constraint events_status_check
check (status in ('Confirmed', 'Unconfirmed', 'No Lineup', 'Urgent', 'Need Attention'));
