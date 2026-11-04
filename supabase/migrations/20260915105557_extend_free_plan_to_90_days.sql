/*
# Extend Free Plan from 30 days to 90 days (3 months)

## Changes
1. Updates the handle_new_user trigger function to create free subscriptions
   with a 90-day expiry instead of 30 days.
2. Extends all existing active free subscriptions to 90 days from their start date
   (or from now if already past the original 30-day mark).

## Security
- No RLS or policy changes.
- No table structure changes.
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  is_first boolean;
  user_role text;
BEGIN
  SELECT (count(*) = 0) INTO is_first FROM auth.users WHERE id <> NEW.id;
  user_role := CASE WHEN is_first THEN 'admin' ELSE 'client' END;

  BEGIN
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1),
        ''
      ),
      user_role
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Profile insert failed for user %: %', NEW.id, SQLERRM;
  END;

  BEGIN
    INSERT INTO subscriptions (user_id, plan_type, price_paid, start_date, expiry_date, status, payment_reference)
    SELECT NEW.id, 'free', 0, now(), now() + interval '90 days', 'active', ''
    WHERE NOT EXISTS (
      SELECT 1 FROM subscriptions WHERE user_id = NEW.id
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Free subscription insert failed for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Extend existing active free subscriptions to 90 days from start_date
UPDATE subscriptions
SET expiry_date = start_date + interval '90 days'
WHERE plan_type = 'free' AND status = 'active';
