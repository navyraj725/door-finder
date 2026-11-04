/*
# Promote doorfinderug@gmail.com to admin and create admin_ads table

1. Changes
- Sets `role = 'admin'` on the profile with email `doorfinderug@gmail.com`.
- Creates `admin_ads` table for admin-posted advertisements:
  - `id` (uuid, primary key)
  - `title` (text, not null) — ad headline
  - `description` (text) — ad body text
  - `link_url` (text) — optional URL the ad clicks through to
  - `poster_url` (text) — poster image URL (stored in listing-media bucket)
  - `video_url` (text) — optional video URL (stored in listing-media bucket)
  - `is_active` (boolean, default true) — whether the ad is currently showing
  - `sort_order` (integer, default 0) — lower numbers appear first; admin ads always show above regular listings
  - `created_by` (uuid, references profiles) — which admin posted it
  - `created_at` (timestamptz, default now)
  - `updated_at` (timestamptz, default now)
2. Security
- Enable RLS on `admin_ads`.
- SELECT: public (anon + authenticated) — all visitors can see active ads.
- INSERT / UPDATE / DELETE: admin only — checked via `profiles.role = 'admin'`.
3. Notes
- Admin ads are stored separately from regular property listings so they can
  be managed independently and always displayed at the top of the browse page.
- Posters and videos are uploaded to the existing `listing-media` storage bucket
  under an `admin-ads/` path prefix.
*/

UPDATE profiles SET role = 'admin' WHERE email = 'doorfinderug@gmail.com';

CREATE TABLE IF NOT EXISTS admin_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  link_url text DEFAULT '',
  poster_url text DEFAULT '',
  video_url text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_ads ENABLE ROW LEVEL SECURITY;

-- Public can read all ads (so visitors see them on the browse page)
DROP POLICY IF EXISTS "public_read_admin_ads" ON admin_ads;
CREATE POLICY "public_read_admin_ads"
  ON admin_ads FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only admins can insert ads
DROP POLICY IF EXISTS "admin_insert_admin_ads" ON admin_ads;
CREATE POLICY "admin_insert_admin_ads"
  ON admin_ads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Only admins can update ads
DROP POLICY IF EXISTS "admin_update_admin_ads" ON admin_ads;
CREATE POLICY "admin_update_admin_ads"
  ON admin_ads FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Only admins can delete ads
DROP POLICY IF EXISTS "admin_delete_admin_ads" ON admin_ads;
CREATE POLICY "admin_delete_admin_ads"
  ON admin_ads FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
