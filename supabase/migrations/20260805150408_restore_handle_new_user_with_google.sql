/*
# Restore handle_new_user with Google support + signup fix

## Problem
The previous Google migration overwrote handle_new_user and removed:
- The exception handling that prevents "Database error saving new user"
- The first-user-becomes-admin logic
- The automatic free subscription creation

## Fix
Rewrites handle_new_user to include ALL of:
1. Google OAuth name support (checks `name` field in addition to `full_name`)
2. search_path = public, auth (fixes schema resolution errors)
3. Exception-wrapped profile insert (never blocks signup)
4. First user becomes admin
5. Free subscription auto-created (1 property, 30 days)
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
    SELECT NEW.id, 'free', 0, now(), now() + interval '30 days', 'active', ''
    WHERE NOT EXISTS (
      SELECT 1 FROM subscriptions WHERE user_id = NEW.id
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Free subscription insert failed for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;
