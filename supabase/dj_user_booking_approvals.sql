-- Link dashboard users to DJ profiles and let linked DJs respond to bookings.
-- Run this in Supabase SQL Editor after the core dashboard schema scripts.

alter table public.djs
add column if not exists linked_user_id uuid references auth.users(id) on delete set null;

create index if not exists djs_linked_user_id_idx
on public.djs (linked_user_id);

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

alter table public.event_assignments
drop constraint if exists event_assignments_assignment_status_check;

alter table public.event_assignments
add constraint event_assignments_assignment_status_check
check (assignment_status in ('Pending', 'Confirmed', 'Accepted', 'Rejected'));

drop policy if exists "linked djs update own booking response" on public.event_assignments;
create policy "linked djs update own booking response"
on public.event_assignments for update
to authenticated
using (
  exists (
    select 1
    from public.djs d
    where d.id = event_assignments.dj_id
      and d.linked_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.djs d
    where d.id = event_assignments.dj_id
      and d.linked_user_id = auth.uid()
  )
  and assignment_status in ('Accepted', 'Rejected')
);

-- Backfill future confirmed assignments for already-linked DJs so they show
-- as booking requests without needing admins to reconfirm each night.
update public.event_assignments ea
set assignment_status = 'Pending'
from public.event_slots es, public.events e, public.djs d
where ea.event_slot_id = es.id
  and es.event_id = e.id
  and ea.dj_id = d.id
  and d.linked_user_id is not null
  and e.status = 'Confirmed'
  and e.event_date >= current_date
  and ea.assignment_status = 'Confirmed';
