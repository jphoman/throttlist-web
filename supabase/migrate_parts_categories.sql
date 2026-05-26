-- Migrate parts categories to match canonical motorcycle partCategories
-- from constants/buildTypes.ts:
--   Engine · Exhaust · Suspension · Wheels & Tires · Front End
--   Frame & Body · Controls · Electrical · Paint & Finish
--
-- Run once in the Supabase SQL Editor if seed data is already present.
-- Safe to re-run (no-ops where already correct).

BEGIN;

-- Lighting → Electrical
UPDATE public.parts SET category = 'Electrical'
WHERE category IN ('Lighting', 'Instruments', 'Electronics');

-- Handlebars / Mirrors / Ergonomics → Controls
UPDATE public.parts SET category = 'Controls'
WHERE category IN ('Handlebars', 'Mirrors', 'Ergonomics');

-- Tires → Wheels & Tires
UPDATE public.parts SET category = 'Wheels & Tires'
WHERE category = 'Tires';

-- Brakes → Front End  (also catches windshields/screens seeded as 'Bodywork' by id)
UPDATE public.parts SET category = 'Front End'
WHERE category = 'Brakes';

-- Windshields/screens that were stored as 'Bodywork' — fix by part id
UPDATE public.parts SET category = 'Front End'
WHERE id IN (
  'd0000055-0000-0000-0000-000000000055', -- GIVI Windshield D2145ST
  'd0000083-0000-0000-0000-000000000083'  -- Skidmarx Classic Screen
);

-- Remaining Bodywork / Seat / Accessories → Frame & Body
UPDATE public.parts SET category = 'Frame & Body'
WHERE category IN ('Bodywork', 'Seat', 'Accessories');

COMMIT;
