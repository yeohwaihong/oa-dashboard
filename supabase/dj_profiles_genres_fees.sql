-- DJ profile database for the O&A dashboard.
-- Run this once in Supabase SQL Editor.
--
-- This keeps the existing public.djs table used by bookings, then adds
-- richer profile fields, normalized genres, and reusable DJ fee cards.

create extension if not exists pgcrypto;

create table if not exists public.djs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.djs
add column if not exists stage_name text,
add column if not exists real_name text,
add column if not exists email text,
add column if not exists linked_user_id uuid references auth.users(id) on delete set null,
add column if not exists phone text,
add column if not exists instagram_handle text,
add column if not exists soundcloud_url text,
add column if not exists press_kit_url text,
add column if not exists bio text,
add column if not exists home_city text,
add column if not exists country text,
add column if not exists status text not null default 'Active',
add column if not exists notes text,
add column if not exists updated_at timestamptz not null default now();

alter table public.djs
drop constraint if exists djs_status_check;

alter table public.djs
add constraint djs_status_check
check (status in ('Active', 'Inactive', 'Do Not Book'));

create index if not exists djs_name_lower_idx
on public.djs (lower(name));

create index if not exists djs_linked_user_id_idx
on public.djs (linked_user_id);

create table if not exists public.genres (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists genres_name_lower_idx
on public.genres (lower(name));

create table if not exists public.dj_genres (
  dj_id uuid not null references public.djs(id) on delete cascade,
  genre_id uuid not null references public.genres(id) on delete cascade,
  is_primary boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  primary key (dj_id, genre_id)
);

create index if not exists dj_genres_genre_id_idx
on public.dj_genres (genre_id);

create table if not exists public.dj_fees (
  id uuid primary key default gen_random_uuid(),
  dj_id uuid not null references public.djs(id) on delete cascade,
  fee_name text not null default 'Standard',
  currency_code char(3) not null default 'MYR',
  amount numeric(12, 2) not null check (amount >= 0),
  fee_type text not null default 'per_set',
  set_length_minutes integer check (set_length_minutes is null or set_length_minutes > 0),
  min_booking_hours numeric(5, 2) check (min_booking_hours is null or min_booking_hours >= 0),
  valid_from date,
  valid_until date,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dj_fees_fee_type_check check (fee_type in ('per_set', 'per_hour', 'per_event', 'monthly', 'other')),
  constraint dj_fees_valid_dates_check check (valid_until is null or valid_from is null or valid_until >= valid_from)
);

create index if not exists dj_fees_dj_id_idx
on public.dj_fees (dj_id);

create index if not exists dj_fees_active_lookup_idx
on public.dj_fees (dj_id, is_active, valid_from, valid_until);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_djs_updated_at on public.djs;
create trigger set_djs_updated_at
before update on public.djs
for each row execute function public.set_updated_at();

drop trigger if exists set_genres_updated_at on public.genres;
create trigger set_genres_updated_at
before update on public.genres
for each row execute function public.set_updated_at();

drop trigger if exists set_dj_fees_updated_at on public.dj_fees;
create trigger set_dj_fees_updated_at
before update on public.dj_fees
for each row execute function public.set_updated_at();

create or replace view public.dj_profile_summary as
select
  d.id,
  d.name,
  d.stage_name,
  d.real_name,
  d.email,
  d.phone,
  d.instagram_handle,
  d.soundcloud_url,
  d.press_kit_url,
  d.bio,
  d.home_city,
  d.country,
  d.status,
  d.notes,
  coalesce(
    jsonb_agg(
      distinct jsonb_build_object(
        'id', g.id,
        'name', g.name,
        'is_primary', dg.is_primary
      )
    ) filter (where g.id is not null),
    '[]'::jsonb
  ) as genres,
  coalesce(
    jsonb_agg(
      distinct jsonb_build_object(
        'id', f.id,
        'fee_name', f.fee_name,
        'currency_code', f.currency_code,
        'amount', f.amount,
        'fee_type', f.fee_type,
        'set_length_minutes', f.set_length_minutes,
        'min_booking_hours', f.min_booking_hours,
        'valid_from', f.valid_from,
        'valid_until', f.valid_until,
        'notes', f.notes
      )
    ) filter (where f.id is not null and f.is_active),
    '[]'::jsonb
  ) as active_fees,
  d.created_at,
  d.updated_at,
  d.linked_user_id
from public.djs d
left join public.dj_genres dg on dg.dj_id = d.id
left join public.genres g on g.id = dg.genre_id
left join public.dj_fees f on f.dj_id = d.id
group by d.id;

alter table public.djs enable row level security;
alter table public.genres enable row level security;
alter table public.dj_genres enable row level security;
alter table public.dj_fees enable row level security;

drop policy if exists "dashboard anon read djs" on public.djs;
create policy "dashboard anon read djs"
on public.djs for select
to anon, authenticated
using (true);

drop policy if exists "dashboard anon read genres" on public.genres;
create policy "dashboard anon read genres"
on public.genres for select
to anon, authenticated
using (true);

drop policy if exists "dashboard anon read dj genres" on public.dj_genres;
create policy "dashboard anon read dj genres"
on public.dj_genres for select
to anon, authenticated
using (true);

drop policy if exists "dashboard anon read dj fees" on public.dj_fees;
create policy "dashboard anon read dj fees"
on public.dj_fees for select
to anon, authenticated
using (true);

do $$
begin
  if to_regclass('public.user_roles') is not null then
    drop policy if exists "dashboard admin write djs" on public.djs;
    create policy "dashboard admin write djs"
    on public.djs for all
    to authenticated
    using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')))
    with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')));

    drop policy if exists "dashboard admin write genres" on public.genres;
    create policy "dashboard admin write genres"
    on public.genres for all
    to authenticated
    using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')))
    with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')));

    drop policy if exists "dashboard admin write dj genres" on public.dj_genres;
    create policy "dashboard admin write dj genres"
    on public.dj_genres for all
    to authenticated
    using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')))
    with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')));

    drop policy if exists "dashboard admin write dj fees" on public.dj_fees;
    create policy "dashboard admin write dj fees"
    on public.dj_fees for all
    to authenticated
    using (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')))
    with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('superadmin', 'admin')));
  end if;
end $$;

insert into public.genres (name)
values
  ('AFRO'),
  ('AMAPIANO'),
  ('BAILE'),
  ('HIP-HOP'),
  ('TECH HOUSE'),
  ('MELODIC TECHNO'),
  ('TECHNO'),
  ('HARD TECHNO'),
  ('HARD GROOVE'),
  ('TRANCE'),
  ('BOUNCE'),
  ('EDM')
on conflict do nothing;
