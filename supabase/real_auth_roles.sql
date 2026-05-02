-- Real dashboard auth roles.
-- 1) Create users in Supabase Dashboard > Authentication > Users.
-- 2) Copy each auth.users.id and insert it into public.user_roles below.
-- 3) Run this SQL in Supabase SQL Editor.

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('superadmin', 'admin', 'staff', 'dj')),
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

drop policy if exists "users can read own role" on public.user_roles;
create policy "users can read own role"
on public.user_roles for select
to authenticated
using (user_id = auth.uid());

-- Replace these UUIDs after creating real Supabase Auth users.
-- insert into public.user_roles (user_id, role)
-- values
--   ('00000000-0000-0000-0000-000000000000', 'superadmin'),
--   ('11111111-1111-1111-1111-111111111111', 'admin'),
--   ('22222222-2222-2222-2222-222222222222', 'staff'),
--   ('33333333-3333-3333-3333-333333333333', 'dj')
-- on conflict (user_id) do update set role = excluded.role;

-- Keep public read access for the launch schedule.
alter table public.events enable row level security;
alter table public.event_slots enable row level security;
alter table public.event_assignments enable row level security;
alter table public.djs enable row level security;
alter table public.event_templates enable row level security;

drop policy if exists "dashboard anon read events" on public.events;
create policy "dashboard anon read events"
on public.events for select
to anon, authenticated
using (true);

drop policy if exists "dashboard anon read slots" on public.event_slots;
create policy "dashboard anon read slots"
on public.event_slots for select
to anon, authenticated
using (true);

drop policy if exists "dashboard anon read assignments" on public.event_assignments;
create policy "dashboard anon read assignments"
on public.event_assignments for select
to anon, authenticated
using (true);

drop policy if exists "dashboard anon read djs" on public.djs;
create policy "dashboard anon read djs"
on public.djs for select
to anon, authenticated
using (true);

drop policy if exists "dashboard anon read templates" on public.event_templates;
create policy "dashboard anon read templates"
on public.event_templates for select
to anon, authenticated
using (true);

-- Remove previous anonymous write policies if you ran the dev policy SQL.
drop policy if exists "dashboard anon insert events" on public.events;
drop policy if exists "dashboard anon update events" on public.events;
drop policy if exists "dashboard anon delete events" on public.events;
drop policy if exists "dashboard anon insert slots" on public.event_slots;
drop policy if exists "dashboard anon update slots" on public.event_slots;
drop policy if exists "dashboard anon delete slots" on public.event_slots;
drop policy if exists "dashboard anon insert assignments" on public.event_assignments;
drop policy if exists "dashboard anon update assignments" on public.event_assignments;
drop policy if exists "dashboard anon delete assignments" on public.event_assignments;
drop policy if exists "dashboard anon insert djs" on public.djs;
drop policy if exists "dashboard anon update djs" on public.djs;
drop policy if exists "dashboard anon delete djs" on public.djs;
drop policy if exists "dashboard anon insert templates" on public.event_templates;
drop policy if exists "dashboard anon update templates" on public.event_templates;
drop policy if exists "dashboard anon delete templates" on public.event_templates;

-- Let real admins manage dashboard data (staff is view-only).
drop policy if exists "dashboard staff write events" on public.events;
drop policy if exists "dashboard admin write events" on public.events;
create policy "dashboard admin write events"
on public.events for all
to authenticated
using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')))
with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')));

drop policy if exists "dashboard staff write slots" on public.event_slots;
drop policy if exists "dashboard admin write slots" on public.event_slots;
create policy "dashboard admin write slots"
on public.event_slots for all
to authenticated
using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')))
with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')));

drop policy if exists "dashboard staff write assignments" on public.event_assignments;
drop policy if exists "dashboard admin write assignments" on public.event_assignments;
create policy "dashboard admin write assignments"
on public.event_assignments for all
to authenticated
using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')))
with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')));

drop policy if exists "dashboard staff write djs" on public.djs;
drop policy if exists "dashboard admin write djs" on public.djs;
create policy "dashboard admin write djs"
on public.djs for all
to authenticated
using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')))
with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')));

drop policy if exists "dashboard staff write templates" on public.event_templates;
drop policy if exists "dashboard admin write templates" on public.event_templates;
create policy "dashboard admin write templates"
on public.event_templates for all
to authenticated
using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')))
with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')));
