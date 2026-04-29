# oa-dashboard
O&amp;A Dashboard

## Supabase DJ database

Run `supabase/dj_profiles_genres_fees.sql` in the Supabase SQL Editor to add DJ profile fields, genre tables, DJ-to-genre links, reusable DJ fee cards, and the `dj_profile_summary` view.

Run `supabase/seed_dj_profiles_2025_from_pdf.sql` after that to seed DJ names and genres from the 2025 finance DJ schedule PDF.

Run `supabase/seed_dj_fee_estimates_from_finance_sheets.sql` to add rough DJ fee estimates inferred from the finance sheets.

For local anonymous writes, run `supabase/dev_dashboard_policies.sql` after the DJ database SQL. For realtime updates, rerun `supabase/realtime_setup.sql`.
