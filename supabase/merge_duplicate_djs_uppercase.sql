-- Merge duplicate DJ profiles by uppercase name, then store DJ names in uppercase.
-- Run this once in Supabase SQL Editor after the DJ profile tables exist.
--
-- Safety notes:
-- - Canonical rows are chosen per uppercase trimmed name.
-- - Assignment, fee, and genre links are moved to the canonical DJ.
-- - Profile fields are kept from the canonical row when present, otherwise
--   filled from duplicate rows in the same name group.

begin;

alter table public.djs
add column if not exists linked_user_id uuid references auth.users(id) on delete set null;

create temp table dj_merge_map on commit drop as
with normalized as (
  select
    d.*,
    upper(btrim(regexp_replace(d.name, '\s+', ' ', 'g'))) as canonical_name
  from public.djs d
),
ranked as (
  select
    n.*,
    first_value(n.id) over (
      partition by n.canonical_name
      order by
        (n.linked_user_id is not null) desc,
        (nullif(btrim(n.email), '') is not null) desc,
        (nullif(btrim(n.stage_name), '') is not null) desc,
        n.created_at asc,
        n.id asc
    ) as canonical_id
  from normalized n
)
select
  id as dj_id,
  canonical_id,
  canonical_name
from ranked;

with merged as (
  select
    m.canonical_id,
    m.canonical_name,
    (array_agg(nullif(btrim(d.stage_name), '') order by (d.id = m.canonical_id) desc, d.created_at asc) filter (where nullif(btrim(d.stage_name), '') is not null))[1] as stage_name,
    (array_agg(nullif(btrim(d.real_name), '') order by (d.id = m.canonical_id) desc, d.created_at asc) filter (where nullif(btrim(d.real_name), '') is not null))[1] as real_name,
    (array_agg(nullif(btrim(d.email), '') order by (d.id = m.canonical_id) desc, d.created_at asc) filter (where nullif(btrim(d.email), '') is not null))[1] as email,
    (array_agg(d.linked_user_id order by (d.id = m.canonical_id) desc, d.created_at asc) filter (where d.linked_user_id is not null))[1] as linked_user_id,
    (array_agg(nullif(btrim(d.phone), '') order by (d.id = m.canonical_id) desc, d.created_at asc) filter (where nullif(btrim(d.phone), '') is not null))[1] as phone,
    (array_agg(nullif(btrim(d.instagram_handle), '') order by (d.id = m.canonical_id) desc, d.created_at asc) filter (where nullif(btrim(d.instagram_handle), '') is not null))[1] as instagram_handle,
    (array_agg(nullif(btrim(d.soundcloud_url), '') order by (d.id = m.canonical_id) desc, d.created_at asc) filter (where nullif(btrim(d.soundcloud_url), '') is not null))[1] as soundcloud_url,
    (array_agg(nullif(btrim(d.press_kit_url), '') order by (d.id = m.canonical_id) desc, d.created_at asc) filter (where nullif(btrim(d.press_kit_url), '') is not null))[1] as press_kit_url,
    (array_agg(nullif(btrim(d.bio), '') order by (d.id = m.canonical_id) desc, d.created_at asc) filter (where nullif(btrim(d.bio), '') is not null))[1] as bio,
    (array_agg(nullif(btrim(d.home_city), '') order by (d.id = m.canonical_id) desc, d.created_at asc) filter (where nullif(btrim(d.home_city), '') is not null))[1] as home_city,
    (array_agg(nullif(btrim(d.country), '') order by (d.id = m.canonical_id) desc, d.created_at asc) filter (where nullif(btrim(d.country), '') is not null))[1] as country,
    (array_agg(nullif(btrim(d.status), '') order by (d.id = m.canonical_id) desc, d.created_at asc) filter (where nullif(btrim(d.status), '') is not null))[1] as status,
    (array_agg(nullif(btrim(d.notes), '') order by (d.id = m.canonical_id) desc, d.created_at asc) filter (where nullif(btrim(d.notes), '') is not null))[1] as notes
  from dj_merge_map m
  join public.djs d on d.id = m.dj_id
  group by m.canonical_id, m.canonical_name
)
update public.djs d
set
  name = merged.canonical_name,
  stage_name = upper(coalesce(nullif(btrim(d.stage_name), ''), merged.stage_name)),
  real_name = coalesce(nullif(btrim(d.real_name), ''), merged.real_name),
  email = coalesce(nullif(btrim(d.email), ''), merged.email),
  linked_user_id = coalesce(d.linked_user_id, merged.linked_user_id),
  phone = coalesce(nullif(btrim(d.phone), ''), merged.phone),
  instagram_handle = coalesce(nullif(btrim(d.instagram_handle), ''), merged.instagram_handle),
  soundcloud_url = coalesce(nullif(btrim(d.soundcloud_url), ''), merged.soundcloud_url),
  press_kit_url = coalesce(nullif(btrim(d.press_kit_url), ''), merged.press_kit_url),
  bio = coalesce(nullif(btrim(d.bio), ''), merged.bio),
  home_city = coalesce(nullif(btrim(d.home_city), ''), merged.home_city),
  country = coalesce(nullif(btrim(d.country), ''), merged.country),
  status = coalesce(nullif(btrim(d.status), ''), merged.status, 'Active'),
  notes = coalesce(nullif(btrim(d.notes), ''), merged.notes)
from merged
where d.id = merged.canonical_id;

insert into public.dj_genres (dj_id, genre_id, is_primary, notes)
select
  m.canonical_id,
  dg.genre_id,
  bool_or(dg.is_primary) as is_primary,
  string_agg(distinct nullif(btrim(dg.notes), ''), E'\n') filter (where nullif(btrim(dg.notes), '') is not null) as notes
from public.dj_genres dg
join dj_merge_map m on m.dj_id = dg.dj_id
group by m.canonical_id, dg.genre_id
on conflict (dj_id, genre_id) do update
set
  is_primary = public.dj_genres.is_primary or excluded.is_primary,
  notes = coalesce(public.dj_genres.notes, excluded.notes);

update public.event_assignments ea
set dj_id = m.canonical_id
from dj_merge_map m
where ea.dj_id = m.dj_id
  and m.dj_id <> m.canonical_id;

update public.dj_fees df
set dj_id = m.canonical_id
from dj_merge_map m
where df.dj_id = m.dj_id
  and m.dj_id <> m.canonical_id;

delete from public.djs d
using dj_merge_map m
where d.id = m.dj_id
  and m.dj_id <> m.canonical_id;

update public.djs
set
  name = upper(btrim(regexp_replace(name, '\s+', ' ', 'g'))),
  stage_name = nullif(upper(btrim(regexp_replace(stage_name, '\s+', ' ', 'g'))), '')
where true;

drop index if exists public.djs_name_upper_unique_idx;
create unique index djs_name_upper_unique_idx
on public.djs (upper(btrim(name)));

commit;
