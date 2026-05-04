-- ─── Weekly Sales Schema ──────────────────────────────────────────────────────
-- Stores nightly sales data and P&L inputs for the O&A finance dashboard.
-- Accessible only to admin and superadmin roles.
-- Run this in Supabase SQL Editor.

create table if not exists public.weekly_sales (
  id                   uuid default gen_random_uuid() primary key,
  date                 date not null unique,
  event_name           text not null default '',
  pax                  text default '0',
  table_bookings       numeric not null default 0,
  door_sales           numeric not null default 0,
  cover_charge         numeric not null default 0,
  pos_total            numeric not null default 0,
  ticketmelon_total    numeric not null default 0,
  weekly_target        numeric not null default 15000,
  week_number          int not null,
  month_year           text not null,            -- e.g. 'APRIL 2026'

  -- Cost inputs (stored so they can be manually overridden)
  -- bottle_cost_override: if NULL, frontend calculates as 40% of (pos + ticketmelon)
  bottle_cost_override      numeric,
  ambassador_commission     numeric not null default 0,
  utilities                 numeric not null default 1500,
  man_power                 numeric not null default 9500,
  intl_artist_cost          numeric not null default 0,
  puspal                    numeric not null default 0,
  hotel                     numeric not null default 0,
  rider                     numeric not null default 0,
  local_dj                  numeric not null default 2000,
  bar_split                 numeric not null default 0,
  misc                      numeric not null default 0,

  -- Income extras
  online_ticket             numeric not null default 0,
  walkin_ticket             numeric not null default 0,
  sponsorship               numeric not null default 0,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table public.weekly_sales enable row level security;

-- Only admin and superadmin can read
drop policy if exists "weekly_sales admin read" on public.weekly_sales;
create policy "weekly_sales admin read"
on public.weekly_sales for select
to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role in ('superadmin', 'admin')
  )
);

-- Only admin and superadmin can insert / update / delete
drop policy if exists "weekly_sales admin write" on public.weekly_sales;
create policy "weekly_sales admin write"
on public.weekly_sales for all
to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role in ('superadmin', 'admin')
  )
)
with check (
  exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role in ('superadmin', 'admin')
  )
);

-- ─── Updated-at trigger ───────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists weekly_sales_updated_at on public.weekly_sales;
create trigger weekly_sales_updated_at
  before update on public.weekly_sales
  for each row execute function public.set_updated_at();
