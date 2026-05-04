# oa-dashboard
O&amp;A Dashboard

## Supabase DJ database

Run `supabase/dj_profiles_genres_fees.sql` in the Supabase SQL Editor to add DJ profile fields, genre tables, DJ-to-genre links, reusable DJ fee cards, and the `dj_profile_summary` view.

Run `supabase/seed_dj_profiles_2025_from_pdf.sql` after that to seed DJ names and genres from the 2025 finance DJ schedule PDF.

Run `supabase/seed_dj_fee_estimates_from_finance_sheets.sql` to add rough DJ fee estimates inferred from the finance sheets.

Run `supabase/dj_user_booking_approvals.sql` to link DJ profiles to dashboard users and let linked DJs accept or reject confirmed-night booking requests.

Run `supabase/allow_dj_role.sql` to enable the read-only `dj` user role used by DJ profile linking.

Run `supabase/merge_duplicate_djs_uppercase.sql` if DJ profile names have duplicates with different casing; it merges related assignments, genres, and fees into one uppercase DJ row.

For local anonymous writes, run `supabase/dev_dashboard_policies.sql` after the DJ database SQL. For realtime updates, rerun `supabase/realtime_setup.sql`.

## Weekly Sales (Finance page)

Run `supabase/weekly_sales_schema.sql` to create the `weekly_sales` table with RLS policies (admin + superadmin only).

Run `supabase/seed_weekly_sales_apr_may_2026.sql` after that to seed all April 2026 nightly data and blank May 2026 placeholder rows.
