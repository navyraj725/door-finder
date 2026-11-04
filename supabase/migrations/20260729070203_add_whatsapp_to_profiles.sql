/*
# Add WhatsApp number to user profiles

## Changes
- Adds `whatsapp` text column to `profiles` table so every user has a
  permanent WhatsApp contact number stored on their account.
- Updates the `handle_new_user` trigger to capture the WhatsApp number
  from the signup metadata (`raw_user_meta_data->>'whatsapp'`).
- All existing profiles get a default empty string — no data loss.

## Security
- No policy changes needed; the existing profiles RLS policies already
  cover the new column (row-level, not column-level).
*/

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp text DEFAULT '';

CREATE OR REPLACE FUNCTION public.handle_new_user()
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
    INSERT INTO profiles (id, email, full_name, role, whatsapp)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      user_role,
      COALESCE(NEW.raw_user_meta_data->>'whatsapp', '')
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      whatsapp = COALESCE(EXCLUDED.whatsapp, profiles.whatsapp);
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
