/*
# Update profile creation trigger for Google OAuth

1. Changes
- Updates `handle_new_user()` to also check `name` field (Google sends this) alongside `full_name`.
- Ensures profiles are auto-created for Google-authenticated users with their real name.
2. Security
- No RLS changes. Function remains SECURITY DEFINER.
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1),
      ''
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
