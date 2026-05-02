-- Allow the dashboard superadmin role in public.user_roles.
-- Run this once in Supabase SQL Editor before assigning superadmin.

alter table public.user_roles
drop constraint if exists user_roles_role_check;

alter table public.user_roles
add constraint user_roles_role_check
check (role in ('superadmin', 'admin', 'staff', 'dj'));

-- Keep admin write access working for both superadmin and admin.
drop policy if exists "dashboard admin write events" on public.events;
create policy "dashboard admin write events"
on public.events for all
to authenticated
using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')))
with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')));

drop policy if exists "dashboard admin write slots" on public.event_slots;
create policy "dashboard admin write slots"
on public.event_slots for all
to authenticated
using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')))
with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')));

drop policy if exists "dashboard admin write assignments" on public.event_assignments;
create policy "dashboard admin write assignments"
on public.event_assignments for all
to authenticated
using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')))
with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')));

drop policy if exists "dashboard admin write djs" on public.djs;
create policy "dashboard admin write djs"
on public.djs for all
to authenticated
using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')))
with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')));

drop policy if exists "dashboard admin write templates" on public.event_templates;
create policy "dashboard admin write templates"
on public.event_templates for all
to authenticated
using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')))
with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')));

-- Update comment policies so superadmin can read and manage comments too.
drop policy if exists "dashboard users read comments" on public.event_comments;
create policy "dashboard users read comments"
on public.event_comments for select
to authenticated
using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin', 'staff', 'dj')));

drop policy if exists "dashboard users create comments" on public.event_comments;
create policy "dashboard users create comments"
on public.event_comments for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin', 'staff', 'dj'))
);

drop policy if exists "dashboard users update own comments" on public.event_comments;
create policy "dashboard users update own comments"
on public.event_comments for update
to authenticated
using (
  user_id = auth.uid()
  or exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin'))
)
with check (
  user_id = auth.uid()
  or exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin'))
);

drop policy if exists "dashboard users delete own comments" on public.event_comments;
create policy "dashboard users delete own comments"
on public.event_comments for delete
to authenticated
using (
  user_id = auth.uid()
  or exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin'))
);
