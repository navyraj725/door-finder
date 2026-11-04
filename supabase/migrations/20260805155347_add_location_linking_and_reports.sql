/*
# Add location linking, reports table, and location management support

## Changes:
1. Add `location_id` column to `properties` table (nullable FK to uganda_locations)
   - Allows properties to link to structured Uganda locations
   - Existing properties keep their text-based district/area fields
2. Add `is_active` column to `uganda_locations` table (default true)
   - Allows admin to deactivate locations without deleting them
   - Protects properties that reference deactivated locations
3. Add `street_address` column to `properties` for precise street/road info
4. Create `property_reports` table for user-submitted reports on listings
5. Add RLS policies for property_reports (users can report, admins can manage)
6. Add `latitude`/`longitude` columns to `properties` for GPS coordinates

## Security:
- property_reports: any authenticated user can create reports; only admins can update/delete
- Location is_active column is public-readable (needed for filtering)
- All new columns on properties are public-readable (existing SELECT policy covers them)
*/

-- 1. Add location_id to properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES uganda_locations(id) ON DELETE SET NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS street_address text DEFAULT '';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS latitude numeric(10,8);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS longitude numeric(10,8);

-- 2. Add is_active to uganda_locations
ALTER TABLE uganda_locations ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- 3. Create property_reports table
CREATE TABLE IF NOT EXISTS property_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reason text NOT NULL,
  details text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE property_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_reports_admin" ON property_reports;
CREATE POLICY "select_reports_admin" ON property_reports FOR SELECT
  TO authenticated USING (public.is_admin() OR reporter_id = auth.uid());

DROP POLICY IF EXISTS "insert_reports_own" ON property_reports;
CREATE POLICY "insert_reports_own" ON property_reports FOR INSERT
  TO authenticated WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "update_reports_admin" ON property_reports;
CREATE POLICY "update_reports_admin" ON property_reports FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delete_reports_admin" ON property_reports;
CREATE POLICY "delete_reports_admin" ON property_reports FOR DELETE
  TO authenticated USING (public.is_admin());

-- 4. Add admin write policies for uganda_locations (admin can add/edit/deactivate)
DROP POLICY IF EXISTS "insert_locations_admin" ON uganda_locations;
CREATE POLICY "insert_locations_admin" ON uganda_locations FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "update_locations_admin" ON uganda_locations;
CREATE POLICY "update_locations_admin" ON uganda_locations FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delete_locations_admin" ON uganda_locations;
CREATE POLICY "delete_locations_admin" ON uganda_locations FOR DELETE
  TO authenticated USING (public.is_admin());

-- 5. Add index for location_id on properties
CREATE INDEX IF NOT EXISTS idx_properties_location_id ON properties(location_id);
CREATE INDEX IF NOT EXISTS idx_property_reports_property_id ON property_reports(property_id);
CREATE INDEX IF NOT EXISTS idx_property_reports_status ON property_reports(status);
