-- Add website fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS website_url   text,
  ADD COLUMN IF NOT EXISTS website_title text;
