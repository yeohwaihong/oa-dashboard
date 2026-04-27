-- Development policies for the O&A dashboard browser app.
-- Run this in Supabase SQL Editor while you are building locally.
--
-- These policies allow the public anon key to read, create, edit, and delete
-- dashboard data. Before production, replace these with authenticated policies.

alter table public.events enable row level security;
alter table public.event_slots enable row level security;
alter table public.event_assignments enable row level security;
alter table public.djs enable row level security;
alter table public.event_templates enable row level security;

drop policy if exists "dashboard anon read events" on public.events;
drop policy if exists "dashboard anon insert events" on public.events;
drop policy if exists "dashboard anon update events" on public.events;
drop policy if exists "dashboard anon delete events" on public.events;

create policy "dashboard anon read events"
on public.events for select
to anon
using (true);

create policy "dashboard anon insert events"
on public.events for insert
to anon
with check (true);

create policy "dashboard anon update events"
on public.events for update
to anon
using (true)
with check (true);

create policy "dashboard anon delete events"
on public.events for delete
to anon
using (true);

drop policy if exists "dashboard anon read slots" on public.event_slots;
drop policy if exists "dashboard anon insert slots" on public.event_slots;
drop policy if exists "dashboard anon update slots" on public.event_slots;
drop policy if exists "dashboard anon delete slots" on public.event_slots;

create policy "dashboard anon read slots"
on public.event_slots for select
to anon
using (true);

create policy "dashboard anon insert slots"
on public.event_slots for insert
to anon
with check (true);

create policy "dashboard anon update slots"
on public.event_slots for update
to anon
using (true)
with check (true);

create policy "dashboard anon delete slots"
on public.event_slots for delete
to anon
using (true);

drop policy if exists "dashboard anon read assignments" on public.event_assignments;
drop policy if exists "dashboard anon insert assignments" on public.event_assignments;
drop policy if exists "dashboard anon update assignments" on public.event_assignments;
drop policy if exists "dashboard anon delete assignments" on public.event_assignments;

create policy "dashboard anon read assignments"
on public.event_assignments for select
to anon
using (true);

create policy "dashboard anon insert assignments"
on public.event_assignments for insert
to anon
with check (true);

create policy "dashboard anon update assignments"
on public.event_assignments for update
to anon
using (true)
with check (true);

create policy "dashboard anon delete assignments"
on public.event_assignments for delete
to anon
using (true);

drop policy if exists "dashboard anon read djs" on public.djs;
drop policy if exists "dashboard anon insert djs" on public.djs;
drop policy if exists "dashboard anon update djs" on public.djs;
drop policy if exists "dashboard anon delete djs" on public.djs;

create policy "dashboard anon read djs"
on public.djs for select
to anon
using (true);

create policy "dashboard anon insert djs"
on public.djs for insert
to anon
with check (true);

create policy "dashboard anon update djs"
on public.djs for update
to anon
using (true)
with check (true);

create policy "dashboard anon delete djs"
on public.djs for delete
to anon
using (true);

drop policy if exists "dashboard anon read templates" on public.event_templates;
drop policy if exists "dashboard anon insert templates" on public.event_templates;
drop policy if exists "dashboard anon update templates" on public.event_templates;
drop policy if exists "dashboard anon delete templates" on public.event_templates;

create policy "dashboard anon read templates"
on public.event_templates for select
to anon
using (true);

create policy "dashboard anon insert templates"
on public.event_templates for insert
to anon
with check (true);

create policy "dashboard anon update templates"
on public.event_templates for update
to anon
using (true)
with check (true);

create policy "dashboard anon delete templates"
on public.event_templates for delete
to anon
using (true);
