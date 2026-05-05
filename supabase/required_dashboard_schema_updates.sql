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
  and exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin', 'staff', 'dj'))
);

drop policy if exists "dashboard superadmin read activity log" on public.activity_log;
create policy "dashboard superadmin read activity log"
on public.activity_log for select
to authenticated
using (exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'superadmin'));

-- Finance scenarios + ticket forecast persistence
create extension if not exists pgcrypto;

create table if not exists public.finance_scenarios (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  partner_name text,
  inputs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists finance_scenarios_updated_at_idx
on public.finance_scenarios (updated_at desc);

alter table public.finance_scenarios enable row level security;

drop policy if exists "dashboard admin read finance scenarios" on public.finance_scenarios;
create policy "dashboard admin read finance scenarios"
on public.finance_scenarios for select
to authenticated
using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')));

drop policy if exists "dashboard admin write finance scenarios" on public.finance_scenarios;
create policy "dashboard admin write finance scenarios"
on public.finance_scenarios for all
to authenticated
using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')))
with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')));

create table if not exists public.ticket_forecast_events (
  id text primary key default gen_random_uuid()::text,
  event_name text not null,
  event_date date not null,
  capacity integer,
  tiers jsonb not null default '[]'::jsonb,
  linked_finance_scenario_id text references public.finance_scenarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ticket_forecast_events_event_date_idx
on public.ticket_forecast_events (event_date);

create index if not exists ticket_forecast_events_linked_finance_scenario_id_idx
on public.ticket_forecast_events (linked_finance_scenario_id);

alter table public.ticket_forecast_events enable row level security;

drop policy if exists "dashboard admin read ticket forecasts" on public.ticket_forecast_events;
create policy "dashboard admin read ticket forecasts"
on public.ticket_forecast_events for select
to authenticated
using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')));

drop policy if exists "dashboard admin write ticket forecasts" on public.ticket_forecast_events;
create policy "dashboard admin write ticket forecasts"
on public.ticket_forecast_events for all
to authenticated
using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')))
with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')));

-- Dashboard-wide editable settings, including WhatsApp availability templates.
create table if not exists public.dashboard_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.dashboard_settings enable row level security;

drop policy if exists "dashboard read settings" on public.dashboard_settings;
create policy "dashboard read settings"
on public.dashboard_settings for select
to anon, authenticated
using (true);

drop policy if exists "dashboard admin write settings" on public.dashboard_settings;
create policy "dashboard admin write settings"
on public.dashboard_settings for all
to authenticated
using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')))
with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')));
