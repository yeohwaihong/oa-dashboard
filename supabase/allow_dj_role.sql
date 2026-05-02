-- Add the read-only DJ dashboard role.
-- DJ users behave like staff for dashboard access, plus they can be linked
-- to DJ profiles for booking accept/reject notifications.

alter table public.user_roles
drop constraint if exists user_roles_role_check;

alter table public.user_roles
add constraint user_roles_role_check
check (role in ('superadmin', 'admin', 'staff', 'dj'));

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
