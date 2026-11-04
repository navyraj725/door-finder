/*
# Create scam_reports table and evidence storage bucket

## Purpose
Allows users to report misbehaving accounts, scammers, and suspicious activity.
Reports can include phone number, location, photo/video evidence, and a
detailed description of the reason for reporting.

## New Tables
- `scam_reports`
  - `id` (uuid, PK)
  - `reporter_id` (uuid, FK to profiles, nullable)
  - `reported_phone` (text) — phone number of the reported person
  - `reported_name` (text) — name or username of the reported person
  - `location` (text) — where the incident happened
  - `report_type` (text) — scam, fake_listing, impersonation, harassment, other
  - `reason` (text, NOT NULL) — detailed description
  - `evidence_urls` (text[]) — URLs to uploaded photos/videos
  - `status` (text) — pending, reviewing, resolved, dismissed
  - `admin_notes` (text)
  - `created_at` (timestamptz)

## Storage
- Creates a public bucket `scam-evidence` for evidence files.
- Authenticated users can upload; public can read.

## Security
- RLS enabled on scam_reports.
- Authenticated users can create reports.
- Users can read their own reports; admins can read all and update/delete.
*/

CREATE TABLE IF NOT EXISTS scam_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reported_phone text DEFAULT '',
  reported_name text DEFAULT '',
  location text DEFAULT '',
  report_type text NOT NULL DEFAULT 'scam',
  reason text NOT NULL,
  evidence_urls text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  admin_notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scam_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_or_admin_scam_reports" ON scam_reports;
CREATE POLICY "select_own_or_admin_scam_reports" ON scam_reports FOR SELECT
  TO authenticated USING (reporter_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "insert_scam_reports" ON scam_reports;
CREATE POLICY "insert_scam_reports" ON scam_reports FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_admin_scam_reports" ON scam_reports;
CREATE POLICY "update_admin_scam_reports" ON scam_reports FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delete_admin_scam_reports" ON scam_reports;
CREATE POLICY "delete_admin_scam_reports" ON scam_reports FOR DELETE
  TO authenticated USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_scam_reports_status ON scam_reports(status);
CREATE INDEX IF NOT EXISTS idx_scam_reports_reporter ON scam_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_scam_reports_type ON scam_reports(report_type);

-- Storage bucket for evidence files
INSERT INTO storage.buckets (id, name, public)
SELECT 'scam-evidence', 'scam-evidence', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'scam-evidence');

DROP POLICY IF EXISTS "scam_evidence_read" ON storage.objects;
CREATE POLICY "scam_evidence_read" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'scam-evidence');

DROP POLICY IF EXISTS "scam_evidence_upload" ON storage.objects;
CREATE POLICY "scam_evidence_upload" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'scam-evidence');

DROP POLICY IF EXISTS "scam_evidence_delete_own" ON storage.objects;
CREATE POLICY "scam_evidence_delete_own" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'scam-evidence' AND owner = auth.uid());
