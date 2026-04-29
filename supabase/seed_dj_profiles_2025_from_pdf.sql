-- Seed DJ profiles and genre links from:
-- /Users/mr.yang/Downloads/FINANCE DJ SCHEDULE 2025 - DJs.pdf
--
-- Run supabase/dj_profiles_genres_fees.sql first.
-- The PDF has blank Rates and Instagram columns, so this seed only fills
-- DJ names, categories in notes, and genre links.

do $$
declare
  item record;
  genre_name text;
  current_dj_id uuid;
  current_genre_id uuid;
  source_note text;
begin
  for item in
    select *
    from (
      values
        ('Ashley Lau', 'Local', array['Techno', 'Hard Techno']),
        ('Jovynn', 'Local', array['Techno', 'Hard Techno']),
        ('Aidaho', 'Local', array[]::text[]),
        ('Sandra', 'Local', array[]::text[]),
        ('ICE', 'Local', array[]::text[]),
        ('Pixzy', 'Regional', array[]::text[]),
        ('Ladyanna', 'Local', array[]::text[]),
        ('Queen T', 'Local', array[]::text[]),
        ('MJ', 'Local', array[]::text[]),
        ('Svggy', 'Local', array[]::text[]),
        ('Shanny', 'Local', array[]::text[]),
        ('Vannsngo', 'Local', array[]::text[]),
        ('Raven', 'Local', array['Techno', 'Hard Techno']),
        ('Suhsi', 'Local', array['Techno', 'Hard Techno']),
        ('SmoothBrainGirl', 'Local', array['Jersey', 'Techno']),
        ('Mingyi', 'Local', array['Techno', 'Tech House']),
        ('Eli', 'Local', array['Techno', 'Big Room Techno']),
        ('Roshan', 'Local', array[]::text[]),
        ('Ramsey Westwood', 'Local', array['Techno', 'Trance', 'Big Room Techno']),
        ('Boris Foong', 'Local', array['Techno', 'Trance', 'Big Room Techno']),
        ('Dirty Signal', 'Local', array['Big Room Techno']),
        ('Mr: Yang', 'Local', array['Techno', 'Hard Techno']),
        ('Tchuno', 'Local', array['Techno', 'Hard Techno', 'Hardstyle', 'UK Hardcore', 'DnB']),
        ('Xu', 'Local', array['Techno']),
        ('Blink', 'Local', array['EDM']),
        ('OuroBoroz', 'Local', array['Hard Techno', 'Hardstyle']),
        ('Hello Nasty', 'Local', array['Hard Techno', 'Hardstyle']),
        ('SLVRZ', 'Local', array['Hardstyle']),
        ('Kyori', 'Local', array['Hardstyle']),
        ('Mike Zooka', 'Local', array['EDM']),
        ('No One', 'Local', array['Techno', 'Hard Techno']),
        ('Emerson Jayden', 'Local', array['Techno', 'Hard Techno']),
        ('Curzon', 'Local', array['Techno', 'Hard Groove', 'Hard Techno']),
        ('Hades', 'Local', array['Techno', 'Hard Techno']),
        ('Mirs', 'Local', array['Techno', 'Hard Techno']),
        ('Vision X', 'Local', array['Techno', 'Hard Techno']),
        ('WCKD', 'Local', array['Techno', 'Hard Techno']),
        ('Victor G', 'Local', array['Techno', 'Peaktime Techno']),
        ('Alam Shah', 'Local', array['Techno', 'Minimal Tech']),
        ('Mister Rodrigo', 'Local', array['House', 'Tech House']),
        ('Kaiza', 'Local', array['House', 'Tech House']),
        ('Joey G', 'Local', array['Techno', 'Peaktime Techno']),
        ('Ratgirl', 'Local', array['House', 'Tech House', 'Techno']),
        ('EDL', 'Local', array['Techno', 'Hard Techno', 'Hardstyle']),
        ('CXW', 'Local', array['Trance', 'Techno']),
        ('LapSap', 'Local', array['House', 'Tech House', 'Techno']),
        ('BassAgents', 'Local', array['Hardstyle']),
        ('FBSJ', 'Local', array['Hard Techno'])
    ) as rows(name, category, genres)
  loop
    select d.id
    into current_dj_id
    from public.djs d
    where lower(d.name) = lower(item.name)
    order by d.created_at nulls last, d.id
    limit 1;

    source_note := 'Category: ' || item.category || '; Source: Finance DJ Schedule 2025';

    if current_dj_id is null then
      insert into public.djs (name, stage_name, status, notes)
      values (item.name, item.name, 'Active', source_note)
      returning id into current_dj_id;
    else
      update public.djs
      set
        stage_name = coalesce(nullif(stage_name, ''), item.name),
        status = coalesce(status, 'Active'),
        notes = case
          when notes is null or notes = '' then source_note
          when notes not ilike '%Finance DJ Schedule 2025%' then notes || E'\n' || source_note
          else notes
        end
      where id = current_dj_id;
    end if;

    foreach genre_name in array item.genres
    loop
      insert into public.genres (name)
      values (genre_name)
      on conflict do nothing;

      select g.id
      into current_genre_id
      from public.genres g
      where lower(g.name) = lower(genre_name)
      limit 1;

      insert into public.dj_genres (dj_id, genre_id, is_primary)
      values (
        current_dj_id,
        current_genre_id,
        not exists (select 1 from public.dj_genres existing where existing.dj_id = current_dj_id)
      )
      on conflict (dj_id, genre_id) do update
      set is_primary = public.dj_genres.is_primary or excluded.is_primary;
    end loop;
  end loop;
end $$;
