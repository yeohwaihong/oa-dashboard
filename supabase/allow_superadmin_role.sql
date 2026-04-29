-- Allow the dashboard superadmin role in public.user_roles.
-- Run this once in Supabase SQL Editor before assigning superadmin.

alter table public.user_roles
drop constraint if exists user_roles_role_check;

alter table public.user_roles
add constraint user_roles_role_check
check (role in ('superadmin', 'admin', 'staff'));
