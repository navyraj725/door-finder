/*
# Add duration_days column to payments table

1. Changes
- Adds `duration_days` (integer, nullable) to the `payments` table.
- This stores the featured-listing duration (e.g. 7 or 30 days) at payment
  submission time so the webhook can create the featured listing with the
  correct duration instead of hardcoding 7 days.
2. Security
- No RLS or policy changes. Existing policies remain in effect.
3. Notes
- The column is nullable so existing payment rows are unaffected.
- The payment edge function will populate it for featured-listing payments.
*/

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS duration_days integer;
