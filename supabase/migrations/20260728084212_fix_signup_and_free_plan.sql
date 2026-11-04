/*
# Fix user signup trigger and free plan

## Problems fixed:
1. "Database error saving new user" — the handle_new_user trigger was failing
   because SECURITY DEFINER functions need an explicit search_path to reliably
   resolve the `profiles` table. Without it, the function could fail on
   schema resolution, causing the entire signup to abort.
2. Free plan was not automatically created on signup — users had no
   subscription row, so the "1 property / 30 days" free plan was not enforced.

## Changes:
- Rewrites handle_new_user with `SET search_path = public, auth` and wraps
  the profile insert in a BEGIN/EXCEPTION block so a profile failure never
  blocks signup.
- After creating the profile, automatically inserts a free-plan
  subscription (30-day expiry) so every new user starts with the free plan
  active exactly once per account.
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
  -- Determine if this is the first user (becomes admin)
  SELECT (count(*) = 0) INTO is_first FROM auth.users WHERE id <> NEW.id;
  user_role := CASE WHEN is_first THEN 'admin' ELSE 'client' END;

  -- Insert or update profile (never block signup on this)
  BEGIN
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), user_role)
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name;
  EXCEPTION WHEN OTHERS THEN
    -- If profile insert fails, don't block user creation
    RAISE NOTICE 'Profile insert failed for user %: %', NEW.id, SQLERRM;
  END;

  -- Create free subscription (1 property, 30 days) — only if user has no subscription yet
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
