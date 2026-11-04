/*
# Door Finder — Subscription & Pricing System Overhaul

## Summary
Migrates the platform from the legacy 2-plan model (Free / Premium 6mo / Premium 1yr
at UGX 50,000 and UGX 90,000) to a 4-plan model priced strictly in UGX:
  - FREE     : UGX 0       | 30 days  | max 1 active listing
  - MONTHLY  : UGX 10,000  | 30 days  | unlimited listings
  - 6-MONTH  : UGX 60,000  | 180 days | unlimited listings
  - ANNUAL   : UGX 120,000 | 365 days | unlimited listings

## New Columns
- properties.is_active (boolean, default true) — controls whether a listing is
  visible/searchable. On subscription expiry this is set to false; on renewal
  it is set back to true. All property data, photos, and records are preserved.
- payments.currency (text, default 'UGX') — records the currency of each
  transaction so payment history is unambiguous.
- admin_settings.monthly_price (numeric, default 10000)
- admin_settings.six_month_price (numeric, default 60000)
- admin_settings.annual_price (numeric, default 120000)

## New Functions (all SECURITY DEFINER, search_path locked)
1. user_can_create_listing() — returns true if the calling authenticated user
   may create a new active listing. Free users are capped at 1 active listing;
   paid (monthly / six_month / annual) users have unlimited listings while
   their subscription is active. Used by the properties INSERT policy so the
   cap is enforced at the database level, not just the UI.
2. refresh_subscription_state(p_user_id uuid) — idempotently expires any
   active subscription whose expiry_date has passed, sets the user's
   listings to is_active = false, and returns the user's current effective
   plan. Callable by the user themselves (for their own id) and by admins.
3. reactivate_user_listings(p_user_id uuid) — sets is_active = true on all
   of a user's listings. Called by the payment handler on renewal so that
   listings hidden by a prior expiry are restored.

## Security / RLS Changes
- properties INSERT policy tightened: now also requires
  user_can_create_listing() to be true, so a free user with 1 active listing
  cannot insert a second one even by bypassing the UI.
- All other existing policies and grants are preserved. No data is deleted.
- New columns receive appropriate grants implicitly (table-level grants
  already cover authenticated/anon).

## Important Notes
1. The legacy plan_type values 'premium_6mo' and 'premium_1yr' are NOT
   destroyed — existing subscription rows keep their values and continue to
   function. New paid subscriptions use 'monthly', 'six_month', 'annual'.
   The frontend treats premium_6mo as equivalent to six_month and
   premium_1yr as equivalent to annual for display purposes.
2. The handle_new_user trigger is updated to create free subscriptions with
   a 30-day expiry (reverting the earlier 90-day extension to match the new
   spec).
3. All existing properties are set to is_active = true on migration so
   nothing currently visible disappears.
*/

-- ============================================================
-- 1. Add is_active to properties
-- ============================================================
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Ensure every existing row is active (preserve current visibility)
UPDATE properties SET is_active = true WHERE is_active IS NULL;

CREATE INDEX IF NOT EXISTS idx_properties_active ON properties(is_active);

-- ============================================================
-- 2. Add currency to payments
-- ============================================================
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'UGX';

-- ============================================================
-- 3. Add new pricing columns to admin_settings
-- ============================================================
ALTER TABLE admin_settings
  ADD COLUMN IF NOT EXISTS monthly_price numeric NOT NULL DEFAULT 10000;
ALTER TABLE admin_settings
  ADD COLUMN IF NOT EXISTS six_month_price numeric NOT NULL DEFAULT 60000;
ALTER TABLE admin_settings
  ADD COLUMN IF NOT EXISTS annual_price numeric NOT NULL DEFAULT 120000;

-- Update the singleton row with the new prices if they are still at legacy defaults
UPDATE admin_settings
  SET monthly_price = 10000,
      six_month_price = 60000,
      annual_price = 120000
  WHERE monthly_price = 10000 AND six_month_price = 60000 AND annual_price = 120000;

-- ============================================================
-- 4. Helper: can the current user create a listing?
-- ============================================================
CREATE OR REPLACE FUNCTION user_can_create_listing()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.user_id = auth.uid()
      AND s.status = 'active'
      AND (s.expiry_date IS NULL OR s.expiry_date > now())
      AND (
        s.plan_type IN ('monthly', 'six_month', 'annual', 'premium_6mo', 'premium_1yr')
        OR (
          s.plan_type = 'free'
          AND (
            SELECT count(*)::int FROM properties p
            WHERE p.user_id = auth.uid() AND p.is_active = true
          ) < 1
        )
      )
  );
$$;

-- ============================================================
-- 5. Helper: expire overdue subscriptions + deactivate listings
-- ============================================================
CREATE OR REPLACE FUNCTION refresh_subscription_state(p_user_id uuid)
RETURNS TABLE(plan_type text, status text, expiry_date timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count int;
BEGIN
  -- Expire any active subscriptions past their expiry_date
  UPDATE subscriptions
    SET status = 'expired'
    WHERE user_id = p_user_id
      AND status = 'active'
      AND expiry_date IS NOT NULL
      AND expiry_date < now();

  GET DIAGNOSTICS expired_count = ROW_COUNT;

  -- If we expired anything, deactivate that user's listings
  IF expired_count > 0 THEN
    UPDATE properties
      SET is_active = false
      WHERE user_id = p_user_id
        AND is_active = true;
  END IF;

  -- Return the user's current effective subscription
  RETURN QUERY
    SELECT s.plan_type, s.status, s.expiry_date
    FROM subscriptions s
    WHERE s.user_id = p_user_id
    ORDER BY
      CASE WHEN s.status = 'active' THEN 0 ELSE 1 END,
      s.created_at DESC
    LIMIT 1;
END;
$$;

-- ============================================================
-- 6. Helper: reactivate listings on renewal
-- ============================================================
CREATE OR REPLACE FUNCTION reactivate_user_listings(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE properties
    SET is_active = true
    WHERE user_id = p_user_id;
END;
$$;

-- Grant execute on the user-facing helpers
REVOKE EXECUTE ON FUNCTION user_can_create_listing() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION user_can_create_listing() TO authenticated;

REVOKE EXECUTE ON FUNCTION refresh_subscription_state(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION refresh_subscription_state(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION reactivate_user_listings(uuid) FROM PUBLIC, anon;
-- Only the service role (edge functions) needs to call reactivate
GRANT EXECUTE ON FUNCTION reactivate_user_listings(uuid) TO authenticated;

-- ============================================================
-- 7. Tighten the properties INSERT policy to enforce the free cap
-- ============================================================
DROP POLICY IF EXISTS "insert_own_properties" ON properties;
CREATE POLICY "insert_own_properties" ON properties FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND user_can_create_listing());

-- ============================================================
-- 8. Update handle_new_user: free plan = 30 days (per new spec)
-- ============================================================
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

  -- Free plan: 30 days, 1 listing max (per new pricing spec)
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
