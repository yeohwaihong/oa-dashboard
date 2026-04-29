-- Rough DJ fee estimates from FINANCE SHEET*.xlsx workbooks.
-- Run supabase/dj_profiles_genres_fees.sql first.
-- Amounts are inferred from observed payment rows; repeated per-gig fees are preferred over one-off totals.

do $$
declare
  item record;
  current_dj_id uuid;
begin
  for item in
    select *
    from (
      values
        ('ANNJO', 600.00::numeric, 'Rough estimate from finance sheets; 14 payment rows; most repeated observed amount; observed RM600 x13, RM4200 x1; categories: DJ FEES, RESIDENT.'),
        ('Anuar', 750.00::numeric, 'Rough estimate from finance sheets; 5 payment rows; most repeated observed amount; observed RM750 x5; categories: DJ FEES, GUEST (LOCAL).'),
        ('Aqua Scum', 800.00::numeric, 'Rough estimate from finance sheets; 1 payment row; median of observed amounts; observed RM800 x1; categories: GUEST (LOCAL).'),
        ('Ashley Lau', 5000.00::numeric, 'Rough estimate from finance sheets; 1 payment row; median of observed amounts; observed RM5000 x1; categories: DJ FEES.'),
        ('Axel Groove', 600.00::numeric, 'Rough estimate from finance sheets; 2 payment rows; most repeated observed amount; observed RM600 x2; categories: DJ FEES, GUEST (LOCAL).'),
        ('Baxx Xtra Hard', 7000.00::numeric, 'Rough estimate from finance sheets; 1 payment row; median of observed amounts; observed RM7000 x1; categories: DJ FEES.'),
        ('Bender', 2000.00::numeric, 'Rough estimate from finance sheets; 1 payment row; median of observed amounts; observed RM2000 x1; categories: GUEST (LOCAL).'),
        ('Byorn', 13920.00::numeric, 'Rough estimate from finance sheets; 1 payment row; median of observed amounts; observed RM13920 x1; categories: ARTIST FEES.'),
        ('Curzon', 1500.00::numeric, 'Rough estimate from finance sheets; 6 payment rows; most repeated observed amount; observed RM1500 x4, RM2000 x1, RM4000 x1; categories: RESIDENT.'),
        ('CXW', 1500.00::numeric, 'Rough estimate from finance sheets; 2 payment rows; most repeated observed amount; observed RM1500 x2; categories: GUEST (LOCAL).'),
        ('Damien', 500.00::numeric, 'Rough estimate from finance sheets; 3 payment rows; most repeated observed amount; observed RM500 x3; categories: DJ FEES, GUEST (LOCAL).'),
        ('Erel', 600.00::numeric, 'Rough estimate from finance sheets; 1 payment row; median of observed amounts; observed RM600 x1; categories: DJ FEES.'),
        ('Faye', 1100.00::numeric, 'Rough estimate from finance sheets; 1 payment row; median of observed amounts; observed RM1100 x1; categories: GUEST (LOCAL).'),
        ('Joey G', 800.00::numeric, 'Rough estimate from finance sheets; 1 payment row; median of observed amounts; observed RM800 x1; categories: GUEST (LOCAL).'),
        ('Julia Deychuck', 600.00::numeric, 'Rough estimate from finance sheets; 1 payment row; median of observed amounts; observed RM600 x1; categories: GUEST (LOCAL).'),
        ('Kaku', 15002.65::numeric, 'Rough estimate from finance sheets; 1 payment row; median of observed amounts; observed RM15002.65 x1; categories: ARTIST FEES.'),
        ('Luqe', 500.00::numeric, 'Rough estimate from finance sheets; 1 payment row; median of observed amounts; observed RM500 x1; categories: GUEST (LOCAL).'),
        ('Mr: Yang', 3000.00::numeric, 'Rough estimate from finance sheets; 7 payment rows; most repeated observed amount; observed RM1500 x1, RM2000 x1, RM2500 x1, RM3000 x3, RM4716 x1; categories: DJ FEES, GUEST (LOCAL).'),
        ('Nadia', 500.00::numeric, 'Rough estimate from finance sheets; 1 payment row; median of observed amounts; observed RM500 x1; categories: DJ FEES.'),
        ('NARO', 500.00::numeric, 'Rough estimate from finance sheets; 2 payment rows; most repeated observed amount; observed RM500 x2; categories: GUEST (LOCAL).'),
        ('Naufal', 500.00::numeric, 'Rough estimate from finance sheets; 1 payment row; median of observed amounts; observed RM500 x1; categories: GUEST (LOCAL).'),
        ('No One', 750.00::numeric, 'Rough estimate from finance sheets; 2 payment rows; median of observed amounts; observed RM500 x1, RM1000 x1; categories: GUEST (LOCAL).'),
        ('Ozan', 620.00::numeric, 'Rough estimate from finance sheets; 1 payment row; median of observed amounts; observed RM620 x1; categories: ARTIST FEES.'),
        ('Peot', 500.00::numeric, 'Rough estimate from finance sheets; 4 payment rows; most repeated observed amount; observed RM375 x1, RM500 x3; categories: DJ FEES, GUEST (LOCAL).'),
        ('Psyaason', 500.00::numeric, 'Rough estimate from finance sheets; 1 payment row; median of observed amounts; observed RM500 x1; categories: GUEST (LOCAL).'),
        ('Radz', 600.00::numeric, 'Rough estimate from finance sheets; 3 payment rows; most repeated observed amount; observed RM600 x3; categories: DJ FEES, GUEST (LOCAL).'),
        ('Ratgirl', 500.00::numeric, 'Rough estimate from finance sheets; 3 payment rows; most repeated observed amount; observed RM500 x3; categories: DJ FEES, GUEST (LOCAL).'),
        ('Raven', 500.00::numeric, 'Rough estimate from finance sheets; 3 payment rows; most repeated observed amount; observed RM500 x3; categories: DJ FEES, GUEST (LOCAL).'),
        ('Rebekah', 8456.46::numeric, 'Rough estimate from finance sheets; 1 payment row; median of observed amounts; observed RM8456.46 x1; categories: ARTIST FEES.'),
        ('Restricted', 26934.05::numeric, 'Rough estimate from finance sheets; 1 payment row; median of observed amounts; observed RM26934.05 x1; categories: ARTIST FEES.'),
        ('Retromigration', 4214.13::numeric, 'Rough estimate from finance sheets; 1 payment row; median of observed amounts; observed RM4214.13 x1; categories: ARTIST FEES.'),
        ('Roshan', 600.00::numeric, 'Rough estimate from finance sheets; 4 payment rows; most repeated observed amount; observed RM400 x1, RM500 x1, RM600 x2; categories: DJ FEES, GUEST (LOCAL), RESIDENT.'),
        ('SEP', 400.00::numeric, 'Rough estimate from finance sheets; 13 payment rows; most repeated observed amount; observed RM400 x10, RM500 x2, RM3200 x1; categories: RESIDENT.'),
        ('Shanny', 600.00::numeric, 'Rough estimate from finance sheets; 1 payment row; median of observed amounts; observed RM600 x1; categories: DJ FEES.'),
        ('Shazan', 500.00::numeric, 'Rough estimate from finance sheets; 1 payment row; median of observed amounts; observed RM500 x1; categories: DJ FEES.'),
        ('Sherine', 1100.00::numeric, 'Rough estimate from finance sheets; 1 payment row; median of observed amounts; observed RM1100 x1; categories: GUEST (LOCAL).'),
        ('SmoothBrainGirl', 500.00::numeric, 'Rough estimate from finance sheets; 1 payment row; median of observed amounts; observed RM500 x1; categories: DJ FEES.'),
        ('Suhsi', 1200.00::numeric, 'Rough estimate from finance sheets; 1 payment row; median of observed amounts; observed RM1200 x1; categories: DJ FEES.'),
        ('Svggy', 500.00::numeric, 'Rough estimate from finance sheets; 1 payment row; median of observed amounts; observed RM500 x1; categories: GUEST (LOCAL).'),
        ('Tchuno', 700.00::numeric, 'Rough estimate from finance sheets; 13 payment rows; most repeated observed amount; observed RM700 x10, RM1000 x2, RM2800 x1; categories: DJ FEES, RESIDENT.'),
        ('Teera', 600.00::numeric, 'Rough estimate from finance sheets; 10 payment rows; most repeated observed amount; observed RM600 x9, RM5400 x1; categories: RESIDENT.'),
        ('Terence C', 1000.00::numeric, 'Rough estimate from finance sheets; 1 payment row; median of observed amounts; observed RM1000 x1; categories: DJ FEES.'),
        ('Tiger', 6894.00::numeric, 'Rough estimate from finance sheets; 1 payment row; median of observed amounts; observed RM6894 x1; categories: ARTIST FEES.'),
        ('Victor G', 1500.00::numeric, 'Rough estimate from finance sheets; 1 payment row; median of observed amounts; observed RM1500 x1; categories: GUEST (LOCAL).'),
        ('Viene', 400.00::numeric, 'Rough estimate from finance sheets; 12 payment rows; most repeated observed amount; observed RM400 x11, RM3200 x1; categories: RESIDENT.'),
        ('Vin', 600.00::numeric, 'Rough estimate from finance sheets; 4 payment rows; most repeated observed amount; observed RM600 x4; categories: DJ FEES, GUEST (LOCAL).'),
        ('WCKD', 500.00::numeric, 'Rough estimate from finance sheets; 2 payment rows; most repeated observed amount; observed RM500 x2; categories: DJ FEES, GUEST (LOCAL).'),
        ('Xu', 1900.00::numeric, 'Rough estimate from finance sheets; 2 payment rows; median of observed amounts; observed RM1800 x1, RM2000 x1; categories: DJ FEES, GUEST (LOCAL).'),
        ('Yung Kai', 2000.00::numeric, 'Rough estimate from finance sheets; 1 payment row; median of observed amounts; observed RM2000 x1; categories: GUEST (LOCAL).'),
        ('Zig Zag', 600.00::numeric, 'Rough estimate from finance sheets; 1 payment row; median of observed amounts; observed RM600 x1; categories: DJ FEES.'),
        ('ZIQQ', 800.00::numeric, 'Rough estimate from finance sheets; 8 payment rows; most repeated observed amount; observed RM800 x8; categories: DJ FEES, GUEST (LOCAL).')
    ) as rows(name, amount, notes)
  loop
    select d.id
    into current_dj_id
    from public.djs d
    where lower(d.name) = lower(item.name)
    order by d.created_at nulls last, d.id
    limit 1;

    if current_dj_id is null then
      insert into public.djs (name, stage_name, status, notes)
      values (item.name, item.name, 'Active', 'Source: finance sheet fee estimate')
      returning id into current_dj_id;
    end if;

    delete from public.dj_fees
    where dj_id = current_dj_id
      and fee_name = 'Finance sheet rough estimate';

    insert into public.dj_fees (dj_id, fee_name, currency_code, amount, fee_type, is_active, notes)
    values (current_dj_id, 'Finance sheet rough estimate', 'MYR', item.amount, 'per_set', true, item.notes);
  end loop;
end $$;
