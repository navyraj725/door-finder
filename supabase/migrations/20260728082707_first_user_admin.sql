/*
# Make first user admin

Updates the handle_new_user trigger so the very first user to sign up
gets the 'admin' role; all subsequent users get 'client'.
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_first boolean;
BEGIN
  SELECT (count(*) = 0) INTO is_first FROM auth.users WHERE id <> NEW.id;
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN is_first THEN 'admin' ELSE 'client' END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$;
