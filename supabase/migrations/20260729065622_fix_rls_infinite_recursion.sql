/*
# Fix infinite recursion in RLS policies

## Problem
The `profiles` table SELECT policy checks for admin role by querying
the `profiles` table itself: `EXISTS (SELECT 1 FROM profiles p WHERE ...)`.
Since RLS is enabled on `profiles`, that inner query also triggers the
same policy, which queries `profiles` again — infinite recursion.
Postgres aborts with error 42P17, breaking sign-in and profile loading
for every user.

The same self-referential pattern appears in policies on:
admin_settings, payments, subscriptions, featured_listings.

## Fix
1. Create a SECURITY DEFINER function `is_admin()` that reads the
   caller's role from `profiles` with RLS bypassed (SECURITY DEFINER
   runs as the function owner = postgres, which ignores RLS). This
   breaks the recursion — the function reads the row directly instead
   of going through policy evaluation.
2. Rewrite every policy that previously did
   `EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')`
   to instead call `public.is_admin()`.
3. Drop and recreate the affected policies (CREATE POLICY does not
   support IF NOT EXISTS reliably, so DROP first).

## Tables affected
- profiles (SELECT policy)
- admin_settings (INSERT, UPDATE policies)
- payments (SELECT, UPDATE policies)
- subscriptions (SELECT, UPDATE policies)
- featured_listings (UPDATE policy)

## Security
- `is_admin()` is SECURITY DEFINER with a locked-down search_path so
  it cannot be hijacked by schema search path attacks.
- It only returns a boolean — no data leakage.
- All existing owner-scoped policies (auth.uid() = user_id) are
  preserved unchanged.
*/

-- ============================================================
-- 1. Create is_admin() helper function
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================================
-- 2. Fix profiles SELECT policy
-- ============================================================
DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile" ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR public.is_admin());

-- ============================================================
-- 3. Fix admin_settings policies
-- ============================================================
DROP POLICY IF EXISTS "admin_update_settings" ON public.admin_settings;
CREATE POLICY "admin_update_settings" ON public.admin_settings FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_settings" ON public.admin_settings;
CREATE POLICY "admin_insert_settings" ON public.admin_settings FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

-- ============================================================
-- 4. Fix payments policies
-- ============================================================
DROP POLICY IF EXISTS "select_own_payments" ON public.payments;
CREATE POLICY "select_own_payments" ON public.payments FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "admin_update_payments" ON public.payments;
CREATE POLICY "admin_update_payments" ON public.payments FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- 5. Fix subscriptions policies
-- ============================================================
DROP POLICY IF EXISTS "select_own_subscriptions" ON public.subscriptions;
CREATE POLICY "select_own_subscriptions" ON public.subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "admin_update_subscriptions" ON public.subscriptions;
CREATE POLICY "admin_update_subscriptions" ON public.subscriptions FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- 6. Fix featured_listings UPDATE policy
-- ============================================================
DROP POLICY IF EXISTS "update_own_featured" ON public.featured_listings;
CREATE POLICY "update_own_featured" ON public.featured_listings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());
