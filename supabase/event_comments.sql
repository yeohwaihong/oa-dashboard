-- Event comments with real user attribution and mention notifications.
-- Run this in Supabase SQL Editor after the auth roles setup.

create table if not exists public.event_comments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  mention_user_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists event_comments_event_id_created_at_idx
on public.event_comments (event_id, created_at);

create index if not exists event_comments_mention_user_ids_idx
on public.event_comments using gin (mention_user_ids);

alter table public.event_comments enable row level security;

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
