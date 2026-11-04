/*
# Complete Google profile authentication

## Purpose
Completes the existing Supabase Auth integration so every new email or Google login creates a usable profile record.

## 1. Profile changes
- Adds `avatar_url` to `profiles` for the Google profile picture or another user avatar.
- Changes the default user role from the legacy `client` value to `tenant`.
- Converts existing `client` profiles to `tenant` without removing any user records.
- Keeps `admin` as the protected administrative role and supports `tenant` and `landlord` as user roles.

## 2. First-login behavior
- Updates `handle_new_user()` to read Google and email signup metadata for full name, avatar URL, and requested role.
- Uses a safe default of `tenant` when no valid role is supplied.
- Preserves the existing first-user administrator rule and free subscription creation.

## 3. Security
- Profile email, role, and timestamps are no longer writable by authenticated clients.
- Users can update only their own editable profile details: full name, WhatsApp number, and avatar URL.
- Role changes are available only through `set_profile_role()`, which verifies that the caller is an administrator and validates the target role.
- The profile table remains protected by its existing authenticated, owner-scoped RLS policies.

## 4. Compatibility notes
- Existing application code that checks for `admin` continues to work.
- Existing non-admin profiles are mapped from `client` to `tenant`.
- The migration is idempotent and does not delete tables, columns, or user data.
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url text DEFAULT '';

ALTER TABLE profiles
  ALTER COLUMN role SET DEFAULT 'tenant';

UPDATE profiles
SET role = 'tenant'
WHERE role = 'client';

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  is_first boolean;
  user_role text;
  metadata_role text;
BEGIN
  SELECT (count(*) = 0) INTO is_first FROM auth.users WHERE id <> NEW.id;
  metadata_role := lower(coalesce(NEW.raw_user_meta_data->>'role', ''));
  user_role := CASE
    WHEN is_first THEN 'admin'
    WHEN metadata_role IN ('tenant', 'landlord') THEN metadata_role
    ELSE 'tenant'
  END;

  BEGIN
    INSERT INTO profiles (id, email, full_name, role, avatar_url)
    VALUES (
      NEW.id,
      coalesce(NEW.email, ''),
      coalesce(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(coalesce(NEW.email, ''), '@', 1),
        ''
      ),
      user_role,
      coalesce(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = CASE
        WHEN profiles.full_name = '' THEN EXCLUDED.full_name
        ELSE profiles.full_name
      END,
      avatar_url = CASE
        WHEN profiles.avatar_url = '' THEN EXCLUDED.avatar_url
        ELSE profiles.avatar_url
      END;
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

REVOKE INSERT ON profiles FROM anon, authenticated;
REVOKE UPDATE ON profiles FROM anon, authenticated;
GRANT UPDATE (full_name, whatsapp, avatar_url) ON profiles TO authenticated;

CREATE OR REPLACE FUNCTION set_profile_role(p_user_id uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_role NOT IN ('admin', 'tenant', 'landlord') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  UPDATE profiles
  SET role = p_role
  WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION set_profile_role(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION set_profile_role(uuid, text) TO authenticated;
