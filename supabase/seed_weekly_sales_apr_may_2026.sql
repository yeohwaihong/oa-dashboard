-- ─── Seed: Weekly Sales April & May 2026 ─────────────────────────────────────
-- Run AFTER weekly_sales_schema.sql.
-- April 2026 data sourced from OA WIP SHEET_UPDATED 16 JAN.xlsx
-- May 2026 rows are blank placeholders for the team to fill in.

-- Clear existing data for these months first (safe to re-run)
delete from public.weekly_sales where month_year in ('APRIL 2026', 'MAY 2026');

-- ─── APRIL 2026 ──────────────────────────────────────────────────────────────

-- Week 1  (Apr 1–4)
insert into public.weekly_sales
  (date, event_name, pax, table_bookings, door_sales, cover_charge,
   pos_total, ticketmelon_total, weekly_target,
   week_number, month_year,
   utilities, man_power, local_dj,
   ambassador_commission, intl_artist_cost, puspal, hotel, rider, bar_split, misc,
   online_ticket, walkin_ticket, sponsorship)
values
  ('2026-04-01', 'Wednesday (City Flow)',  '558 (307am)',  741.05,    0.00,     7752.00,  15004.50,  0.00,  15000,  1, 'APRIL 2026',  1500, 9500,  2000,  0, 0, 0, 0, 0, 0, 0,  0, 0, 0),
  ('2026-04-02', 'Thursday (Lick Back)',   '450 (248am)',  717.45,    1588.30,  2450.00,  17082.50,  0.00,  15000,  1, 'APRIL 2026',  1500, 9500,  2000,  0, 0, 0, 0, 0, 0, 0,  0, 0, 0),
  ('2026-04-03', 'Friday (Overdrive)',     '203 (305am)',  1647.30,   5621.35,  2080.00,  27066.95,  0.00,  15000,  1, 'APRIL 2026',  1500, 9500,  2000,  0, 0, 0, 0, 0, 0, 0,  0, 0, 0),
  ('2026-04-04', 'Saturday (NSC - FBSJ)', '481 (335am)',  9600.55,   7882.50,  8000.00,  61337.45,  0.00, 120000,  1, 'APRIL 2026',  1500, 13100, 2000,  0, 0, 0, 0, 0, 0, 0,  0, 0, 0);

-- Week 2  (Apr 8–11)
insert into public.weekly_sales
  (date, event_name, pax, table_bookings, door_sales, cover_charge,
   pos_total, ticketmelon_total, weekly_target,
   week_number, month_year,
   utilities, man_power, local_dj,
   ambassador_commission, intl_artist_cost, puspal, hotel, rider, bar_split, misc,
   online_ticket, walkin_ticket, sponsorship)
values
  ('2026-04-08', 'Wednesday (City Flow : Baby Shark)', '259 (251am)',  0.00,      764.65,   4464.00,  9834.45,   0.00,   15000,  2, 'APRIL 2026',  1500, 9500,  1500,  0, 0, 0, 0, 0, 0, 0,  0, 0, 0),
  ('2026-04-09', 'Thursday (Humid)',                  '120 (202am)',  1482.10,   0.00,     2040.00,  6408.30,   0.00,   15000,  2, 'APRIL 2026',  1500, 9500,  2000,  0, 0, 0, 0, 0, 0, 0,  0, 0, 0),
  ('2026-04-10', 'Friday (Overdrive - Ashley Lau)',   '367 (319am)',  15501.65,  3997.90,  3860.00,  45613.80,  2640.00, 120000, 2, 'APRIL 2026',  1500, 13100, 1500,  0, 0, 0, 0, 0, 0, 0,  0, 0, 0),
  ('2026-04-11', 'Saturday (No Sleep Club)',          '260 (252am)',  2293.95,   8739.20,  3600.00,  28771.95,  0.00,  150000,  2, 'APRIL 2026',  1500, 13100, 2300,  0, 0, 0, 0, 0, 0, 0,  0, 0, 0);

-- Week 3  (Apr 15–18)
insert into public.weekly_sales
  (date, event_name, pax, table_bookings, door_sales, cover_charge,
   pos_total, ticketmelon_total, weekly_target,
   week_number, month_year,
   utilities, man_power, local_dj,
   ambassador_commission, intl_artist_cost, puspal, hotel, rider, bar_split, misc,
   online_ticket, walkin_ticket, sponsorship)
values
  ('2026-04-15', 'Wednesday (City Flow)',  '299',  741.05,   1529.30,  4608.00,  15713.25,  0.00,   15000,  3, 'APRIL 2026',  1500, 9500,  1500,  0, 0, 0, 0, 0, 0, 0,  0, 0, 0),
  ('2026-04-16', 'Thursday (Bender)',      '136',  0.00,     0.00,     2292.00,  6143.25,   0.00,   15000,  3, 'APRIL 2026',  1500, 9500,  2000,  0, 0, 0, 0, 0, 0, 0,  0, 0, 0),
  ('2026-04-17', 'Friday (Overdrive)',     '180',  3051.50,  1434.90,  2440.00,  18454.60,  0.00,  120000,  3, 'APRIL 2026',  1500, 13100, 1500,  0, 0, 0, 0, 0, 0, 0,  0, 0, 0),
  ('2026-04-18', 'Saturday (F2F)',         '363',  2926.75,  3223.80,  4920.00,  31943.30,  6440.00, 150000, 3, 'APRIL 2026', 1500, 13100, 2300,  0, 0, 0, 0, 0, 0, 0,  0, 0, 0);

-- Week 4  (Apr 22–25)
insert into public.weekly_sales
  (date, event_name, pax, table_bookings, door_sales, cover_charge,
   pos_total, ticketmelon_total, weekly_target,
   week_number, month_year,
   utilities, man_power, local_dj,
   ambassador_commission, intl_artist_cost, puspal, hotel, rider, bar_split, misc,
   online_ticket, walkin_ticket, sponsorship)
values
  ('2026-04-22', 'Wednesday (City Flow)',        '334 (242am)',  0.00,      0.00,     6680.00,  9581.90,   0.00,   15000,  4, 'APRIL 2026',  1500, 9500,  1500,  0, 0, 0, 0, 0, 0, 0,  0, 0, 0),
  ('2026-04-23', 'Thursday (Humid)',             '95 (223am)',   1825.45,   0.00,     1508.00,  4101.95,   0.00,   15000,  4, 'APRIL 2026',  1500, 9500,  2000,  0, 0, 0, 0, 0, 0, 0,  0, 0, 0),
  ('2026-04-24', 'Friday (Jugaad)',              '848 (329am)',  43016.05,  5511.60,  300.00,   99913.70,  0.00,  120000,  4, 'APRIL 2026',  1500, 13100, 1500,  0, 0, 0, 0, 0, 0, 0,  0, 0, 0),
  ('2026-04-25', 'Saturday (Tchuno & Friends)',  '462 (322am)',  11455.55,  5387.95,  4460.00,  69948.10,  0.00,  150000,  4, 'APRIL 2026',  1500, 13100, 2300,  0, 0, 0, 0, 0, 0, 0,  0, 0, 0);

-- Week 5  (Apr 29–30, partial – data to be confirmed)
insert into public.weekly_sales
  (date, event_name, pax, table_bookings, door_sales, cover_charge,
   pos_total, ticketmelon_total, weekly_target,
   week_number, month_year,
   utilities, man_power, local_dj,
   ambassador_commission, intl_artist_cost, puspal, hotel, rider, bar_split, misc,
   online_ticket, walkin_ticket, sponsorship)
values
  ('2026-04-29', 'Wednesday (City Flow)', '0',  0, 0, 0,  0, 0,  15000,  5, 'APRIL 2026',  1500, 9500,  1500,  0, 0, 0, 0, 0, 0, 0,  0, 0, 0),
  ('2026-04-30', 'Thursday (Humid)',      '0',  0, 0, 0,  0, 0,  15000,  5, 'APRIL 2026',  1500, 9500,  2000,  0, 0, 0, 0, 0, 0, 0,  0, 0, 0);

-- ─── MAY 2026 – blank placeholders ───────────────────────────────────────────
-- Club runs Wed / Thu / Fri / Sat each week.
-- Fill in event_name, pax, and sales figures as each night is completed.

-- Week 1  (May 1–2: Fri + Sat only, no Wed/Thu as month starts mid-week)
insert into public.weekly_sales
  (date, event_name, week_number, month_year, weekly_target,
   utilities, man_power, local_dj)
values
  ('2026-05-01', 'Friday (TBD)',   1, 'MAY 2026',  15000,  1500, 9500,  2000),
  ('2026-05-02', 'Saturday (TBD)', 1, 'MAY 2026', 120000,  1500, 13100, 2300);

-- Week 2  (May 6–9)
insert into public.weekly_sales
  (date, event_name, week_number, month_year, weekly_target,
   utilities, man_power, local_dj)
values
  ('2026-05-06', 'Wednesday (TBD)', 2, 'MAY 2026',  15000,  1500, 9500,  1500),
  ('2026-05-07', 'Thursday (TBD)',  2, 'MAY 2026',  15000,  1500, 9500,  2000),
  ('2026-05-08', 'Friday (TBD)',    2, 'MAY 2026', 120000,  1500, 13100, 1500),
  ('2026-05-09', 'Saturday (TBD)', 2, 'MAY 2026', 150000,  1500, 13100, 2300);

-- Week 3  (May 13–16)
insert into public.weekly_sales
  (date, event_name, week_number, month_year, weekly_target,
   utilities, man_power, local_dj)
values
  ('2026-05-13', 'Wednesday (TBD)', 3, 'MAY 2026',  15000,  1500, 9500,  1500),
  ('2026-05-14', 'Thursday (TBD)',  3, 'MAY 2026',  15000,  1500, 9500,  2000),
  ('2026-05-15', 'Friday (TBD)',    3, 'MAY 2026', 120000,  1500, 13100, 1500),
  ('2026-05-16', 'Saturday (TBD)', 3, 'MAY 2026', 150000,  1500, 13100, 2300);

-- Week 4  (May 20–23)
insert into public.weekly_sales
  (date, event_name, week_number, month_year, weekly_target,
   utilities, man_power, local_dj)
values
  ('2026-05-20', 'Wednesday (TBD)', 4, 'MAY 2026',  15000,  1500, 9500,  1500),
  ('2026-05-21', 'Thursday (TBD)',  4, 'MAY 2026',  15000,  1500, 9500,  2000),
  ('2026-05-22', 'Friday (TBD)',    4, 'MAY 2026', 120000,  1500, 13100, 1500),
  ('2026-05-23', 'Saturday (TBD)', 4, 'MAY 2026', 150000,  1500, 13100, 2300);

-- Week 5  (May 27–30)
insert into public.weekly_sales
  (date, event_name, week_number, month_year, weekly_target,
   utilities, man_power, local_dj)
values
  ('2026-05-27', 'Wednesday (TBD)', 5, 'MAY 2026',  15000,  1500, 9500,  1500),
  ('2026-05-28', 'Thursday (TBD)',  5, 'MAY 2026',  15000,  1500, 9500,  2000),
  ('2026-05-29', 'Friday (TBD)',    5, 'MAY 2026', 120000,  1500, 13100, 1500),
  ('2026-05-30', 'Saturday (TBD)', 5, 'MAY 2026', 150000,  1500, 13100, 2300);
