/*
# Add photo/video URL storage columns and storage bucket

## Changes
1. Adds `photo_urls` (text array) and `video_urls` (text array) columns
   to the `properties` table so uploaded file URLs are stored permanently
   alongside each listing.
2. Creates a public storage bucket `listing-media` for property photos
   and videos. Files are organized as `listings/<user_id>/<property_id>/`
   so each user's uploads are isolated.

## Security
- No RLS policy changes needed; the new columns inherit the existing
  row-level policies on `properties`.
- Storage bucket is created as public so listing photos/videos can be
  displayed to all visitors (browse page is public).
*/

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS photo_urls text[] DEFAULT '{}';

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS video_urls text[] DEFAULT '{}';

-- Create storage bucket for listing media (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-media', 'listing-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read listing media (public browse)
DROP POLICY IF EXISTS "Public read listing media" ON storage.objects;
CREATE POLICY "Public read listing media" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'listing-media');

-- Allow authenticated users to upload their own listing media
DROP POLICY IF EXISTS "Auth users upload listing media" ON storage.objects;
CREATE POLICY "Auth users upload listing media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listing-media');

-- Allow authenticated users to update/delete their own files
DROP POLICY IF EXISTS "Auth users update listing media" ON storage.objects;
CREATE POLICY "Auth users update listing media" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'listing-media' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Auth users delete listing media" ON storage.objects;
CREATE POLICY "Auth users delete listing media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'listing-media' AND auth.uid()::text = (storage.foldername(name))[1]);
