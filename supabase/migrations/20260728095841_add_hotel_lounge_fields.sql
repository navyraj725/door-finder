/*
# Add hotel and lounge specific fields to properties

## Changes:
- Adds fields needed for Hotels (rooms, star_rating, check_in_time, check_out_time, minimum_stay)
  and Lounges (seating_capacity, opening_time, closing_time, entry_fee, minimum_spend).
- Adds owner contact fields (owner_name, owner_email, primary_contact).
- All fields are nullable so existing properties are not affected.
*/

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS owner_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS owner_email text DEFAULT '',
  ADD COLUMN IF NOT EXISTS primary_contact text DEFAULT '',
  ADD COLUMN IF NOT EXISTS rooms integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS star_rating integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS check_in_time text DEFAULT '',
  ADD COLUMN IF NOT EXISTS check_out_time text DEFAULT '',
  ADD COLUMN IF NOT EXISTS minimum_stay text DEFAULT '',
  ADD COLUMN IF NOT EXISTS seating_capacity integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS opening_time text DEFAULT '',
  ADD COLUMN IF NOT EXISTS closing_time text DEFAULT '',
  ADD COLUMN IF NOT EXISTS entry_fee numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS minimum_spend numeric DEFAULT 0;
