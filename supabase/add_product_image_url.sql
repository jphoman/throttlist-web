-- Add product_image_url column to product_tags
-- Stores the OG/thumbnail image URL fetched from microlink at tag time.
-- Run in Supabase SQL editor.

alter table product_tags
  add column if not exists product_image_url text;
