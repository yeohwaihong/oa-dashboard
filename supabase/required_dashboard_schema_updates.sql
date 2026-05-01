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

-- Activity log (superadmin-only viewer)
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  actor_email text,
  actor_role text,
  action text not null,
  entity_type text,
  entity_id text,
  message text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_created_at_idx
on public.activity_log (created_at desc);

create index if not exists activity_log_actor_user_id_created_at_idx
on public.activity_log (actor_user_id, created_at desc);

create index if not exists activity_log_action_created_at_idx
on public.activity_log (action, created_at desc);

create index if not exists activity_log_meta_gin_idx
on public.activity_log using gin (meta);

alter table public.activity_log enable row level security;

drop policy if exists "dashboard users insert activity log" on public.activity_log;
create policy "dashboard users insert activity log"
on public.activity_log for insert
to authenticated
with check (
  actor_user_id = auth.uid()
  and exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin', 'staff'))
);

drop policy if exists "dashboard superadmin read activity log" on public.activity_log;
create policy "dashboard superadmin read activity log"
on public.activity_log for select
to authenticated
using (exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'superadmin'));
