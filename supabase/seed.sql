-- Throttlist seed data — run once in the Supabase SQL Editor.
-- Photo/avatar URLs reference assets served from throttlist.com.
-- Re-running is safe: all inserts use ON CONFLICT DO NOTHING / DO UPDATE.

BEGIN;

DO $$
DECLARE
  -- Fixed user UUIDs
  uid_cap    UUID := 'a0000001-0000-0000-0000-000000000001';
  uid_invest UUID := 'a0000002-0000-0000-0000-000000000002';
  uid_feelz  UUID := 'a0000003-0000-0000-0000-000000000003';
  uid_retro  UUID := 'a0000004-0000-0000-0000-000000000004';
  uid_s11    UUID := 'a0000005-0000-0000-0000-000000000005';
  uid_croc   UUID := 'a0000006-0000-0000-0000-000000000006';
  uid_mzuc   UUID := 'a0000007-0000-0000-0000-000000000007';
  uid_cold   UUID := 'a0000008-0000-0000-0000-000000000008';

  -- Fixed build UUIDs
  bid_crema    UUID := 'b0000001-0000-0000-0000-000000000001';
  bid_scarlett UUID := 'b0000002-0000-0000-0000-000000000002';
  bid_desert   UUID := 'b0000003-0000-0000-0000-000000000003';
  bid_black    UUID := 'b0000004-0000-0000-0000-000000000004';
  bid_retro    UUID := 'b0000005-0000-0000-0000-000000000005';
  bid_anniv    UUID := 'b0000006-0000-0000-0000-000000000006';
  bid_coldbrew UUID := 'b0000007-0000-0000-0000-000000000007';
  bid_croc     UUID := 'b0000008-0000-0000-0000-000000000008';
  bid_bonnie   UUID := 'b0000009-0000-0000-0000-000000000009';

BEGIN

  -- ── 1. Auth users ────────────────────────────────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data
  ) VALUES
    (uid_cap,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'cappuccinomoto@throttlist.app',  crypt('seed-cap',    gen_salt('bf', 6)),
     now(), '2024-01-15', now(),
     '{"username":"cappuccinomoto","display_name":"Cappuccino Moto"}',
     '{"provider":"email","providers":["email"]}'),

    (uid_invest,'00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'investomoto@throttlist.app',     crypt('seed-invest', gen_salt('bf', 6)),
     now(), '2024-02-01', now(),
     '{"username":"investomoto","display_name":"Ryan | Motorcyclist"}',
     '{"provider":"email","providers":["email"]}'),

    (uid_feelz, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'motofeel@throttlist.app',        crypt('seed-feelz',  gen_salt('bf', 6)),
     now(), '2024-02-10', now(),
     '{"username":"moto_feelz","display_name":"Rob Hamilton"}',
     '{"provider":"email","providers":["email"]}'),

    (uid_retro, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'retroscrambler@throttlist.app',  crypt('seed-retro',  gen_salt('bf', 6)),
     now(), '2024-03-01', now(),
     '{"username":"retroscrambler_","display_name":"Fred Neves"}',
     '{"provider":"email","providers":["email"]}'),

    (uid_s11,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'seven11moto@throttlist.app',     crypt('seed-s11',    gen_salt('bf', 6)),
     now(), '2024-03-15', now(),
     '{"username":"seven11moto","display_name":"Seven11Moto"}',
     '{"provider":"email","providers":["email"]}'),

    (uid_croc,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'thecrocodile@throttlist.app',    crypt('seed-croc',   gen_salt('bf', 6)),
     now(), '2024-03-20', now(),
     '{"username":"thecrocodile","display_name":"Chuck Schmidt"}',
     '{"provider":"email","providers":["email"]}'),

    (uid_mzuc,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'motozuc@throttlist.app',         crypt('seed-mzuc',   gen_salt('bf', 6)),
     now(), '2024-04-01', now(),
     '{"username":"motozuc","display_name":"Justin - Moto Zuc"}',
     '{"provider":"email","providers":["email"]}'),

    (uid_cold,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'coldbrewmoto@throttlist.app',    crypt('seed-cold',   gen_salt('bf', 6)),
     now(), '2024-04-10', now(),
     '{"username":"coldbrewmoto","display_name":"Cold Brew Moto"}',
     '{"provider":"email","providers":["email"]}')
  ON CONFLICT (id) DO NOTHING;

  -- ── 2. Profiles (trigger may have created rows; upsert fills extra fields) ──
  INSERT INTO public.profiles (
    id, username, display_name, bio, location,
    instagram_handle, youtube_handle, avatar_url
  ) VALUES
    (uid_cap,    'cappuccinomoto',  'Cappuccino Moto',
     'Pictures of my ride days. Videos on YouTube. Details on mods & gear below.',
     'United States', 'cappuccinomoto', 'cappuccinomoto',
     'https://throttlist.com/avatars/cappuccinomoto.jpg'),

    (uid_invest, 'investomoto',     'Ryan | Motorcyclist',
     'Invest in the Journey. Currently: Texas. BMW RnineT · Ducati Desert Sled.',
     'Texas', 'investomoto', NULL,
     'https://throttlist.com/avatars/investomoto.jpg'),

    (uid_feelz,  'moto_feelz',     'Rob Hamilton',
     'South Australia. @insta360 & @quadlock Global Ambassador. 120k+ on YouTube.',
     'South Australia, AU', 'moto_feelz', 'robhamilton',
     'https://throttlist.com/avatars/moto_feelz.jpg'),

    (uid_retro,  'retroscrambler_','Fred Neves',
     'Motorcycle Enthusiast and Scrambler rider. Photography & Moto Lifestyle. Triumph Street Scrambler.',
     'United States', 'retroscrambler_', NULL,
     'https://throttlist.com/avatars/retroscrambler_.jpg'),

    (uid_s11,    'seven11moto',    'Seven11Moto',
     'Life on the road with my Yamaha XSR900 60th Anniversary. Camera: Sony A7.',
     'United States', 'seven11moto', NULL,
     'https://throttlist.com/avatars/seven11moto.jpg'),

    (uid_croc,   'thecrocodile',   'Chuck Schmidt',
     '🐊',
     'United States', 'thecrocodile', NULL,
     'https://throttlist.com/avatars/thecrocodile.jpg'),

    (uid_mzuc,   'motozuc',        'Justin - Moto Zuc',
     E'Fell in love with motorcycles at age 3 on a \'65 Triumph Thunderbird. New prints below.',
     'United States', 'motozuc', NULL,
     'https://throttlist.com/avatars/motozuc.jpg'),

    (uid_cold,   'coldbrewmoto',   'Cold Brew Moto',
     E'#coldbrewcrew. \'23 FTR Carbon R · \'04 F4 750 SPR · \'18 XSR700',
     'United States', 'coldbrewmoto', NULL,
     'https://throttlist.com/avatars/coldbrewmoto.jpg')
  ON CONFLICT (id) DO UPDATE SET
    bio              = EXCLUDED.bio,
    location         = EXCLUDED.location,
    instagram_handle = EXCLUDED.instagram_handle,
    youtube_handle   = EXCLUDED.youtube_handle,
    avatar_url       = EXCLUDED.avatar_url;

  -- ── 3. Builds ────────────────────────────────────────────────────────────────
  INSERT INTO public.builds (
    id, user_id, year, make, model, nickname, slug,
    cover_photo_url, build_type, follower_count, status, created_at
  ) VALUES
    (bid_crema,    uid_cap,    2018, 'Yamaha',  'XSR700',           'Crema',               'crema',
     'https://throttlist.com/builds/cappuccino-main.jpg',      'moto', 847,  'active', '2024-01-15'),

    (bid_scarlett, uid_cap,    2015, 'Ducati',  'Scrambler',        'Scarlett',            'scarlett',
     'https://throttlist.com/builds/scarlett/DSC00995.jpg',    'moto', 391,  'active', '2024-06-01'),

    (bid_desert,   uid_invest, 2020, 'BMW',     'R nineT',          'Desert Rat',          'desert-rat',
     'https://throttlist.com/builds/investomoto/01.png',       'moto', 412,  'active', '2024-02-01'),

    (bid_black,    uid_feelz,  1977, 'Honda',   'CB750',            'The Black Tank',      'the-black-tank',
     'https://throttlist.com/builds/moto_feelz/01.png',        'moto', 1893, 'active', '2024-02-10'),

    (bid_retro,    uid_retro,  2019, 'Triumph', 'Street Scrambler', 'The Retro',           'the-retro',
     'https://throttlist.com/builds/retroscrambler_/01.png',   'moto', 289,  'active', '2024-03-01'),

    (bid_anniv,    uid_s11,    2022, 'Yamaha',  'XSR900',           'The Anniversary',     'the-anniversary',
     'https://throttlist.com/builds/seven11moto/01.png',       'moto', 634,  'active', '2024-03-15'),

    (bid_coldbrew, uid_cold,   2023, 'Indian',  'FTR Carbon R',     'Cold Brew',           'cold-brew',
     'https://throttlist.com/builds/coldbrewmoto/01.png',      'moto', 217,  'active', '2024-04-10'),

    (bid_croc,     uid_croc,   2021, 'Ducati',  'Scrambler 1100',   'The Croc',            'the-croc',
     'https://throttlist.com/builds/thecrocodile/01.png',      'moto', 4210, 'active', '2024-03-20'),

    (bid_bonnie,   uid_mzuc,   2020, 'Triumph', 'Bonneville T120',  'The Thunderbird Jr.', 'the-thunderbird-jr',
     'https://throttlist.com/builds/motozuc/01.png',           'moto', 388,  'active', '2024-04-01')
  ON CONFLICT (id) DO NOTHING;

  -- ── 4. Posts ─────────────────────────────────────────────────────────────────
  INSERT INTO public.posts (id, user_id, build_id, photos, caption, like_count, comment_count, created_at)
  VALUES

    -- cappuccinomoto — Crema (XSR700)
    ('c0000001-0000-0000-0000-000000000001'::uuid, uid_cap, bid_crema,
     ARRAY['https://throttlist.com/builds/crema/DSC08677.jpg'],
     E'Crema. Done.\n\n#xsr700 #caferacer #yamaha #custommoto #cappuccinomoto',
     5127, 43, '2025-03-15 20:00:00+00'),

    ('c0000002-0000-0000-0000-000000000002'::uuid, uid_cap, bid_crema,
     ARRAY['https://throttlist.com/builds/crema/DSC02406.jpg'],
     E'You know me\n\n#mountup #agvx3000 #fastersons #retrohelmet #motorcycle #caferacer #xsr700 #cappuccinomoto',
     4314, 15, '2025-02-28 17:44:45+00'),

    ('c0000003-0000-0000-0000-000000000003'::uuid, uid_cap, bid_crema,
     ARRAY['https://throttlist.com/builds/crema/DSC04677.jpg'],
     E'Sunday morning light.\n\n#xsr700 #caferacer #moto #yamaha #cappuccinomoto',
     3788, 22, '2025-02-10 08:10:00+00'),

    ('c0000004-0000-0000-0000-000000000004'::uuid, uid_cap, bid_crema,
     ARRAY['https://throttlist.com/builds/crema/DSC00193.jpg'],
     E'Saturday is for the motos\n\n#quadlock #custommirror #fastersons #motorcycle #caferacer #xsr700 #cappuccinomoto',
     2974, 12, '2025-01-22 23:04:50+00'),

    ('c0000005-0000-0000-0000-000000000005'::uuid, uid_cap, bid_crema,
     ARRAY['https://throttlist.com/builds/crema/DSC08303.jpg'],
     E'After the ECU flash the SC Project really opened up.\n\n#ecuflash #scproject #exhaust #xsr700 #cappuccinomoto',
     3341, 27, '2025-01-10 18:55:00+00'),

    -- cappuccinomoto — Scarlett (Ducati Scrambler)
    ('c0000006-0000-0000-0000-000000000006'::uuid, uid_cap, bid_scarlett,
     ARRAY['https://throttlist.com/builds/scarlett/DSC07521.jpg'],
     E'Scarlett and Crema. Both cappuccinos.\n\n#ducati #yamaha #xsr700 #scrambler #garage #twobikes #cappuccinomoto',
     4891, 52, '2025-04-01 19:45:00+00'),

    ('c0000007-0000-0000-0000-000000000007'::uuid, uid_cap, bid_scarlett,
     ARRAY['https://throttlist.com/builds/scarlett/DSC02384.jpg'],
     E'That Ducati red doesn''t get old.\n\n#ducatirosso #icon #scarlett #ducatiscrambler #cappuccinomoto',
     3214, 31, '2025-03-05 08:30:00+00'),

    ('c0000008-0000-0000-0000-000000000008'::uuid, uid_cap, bid_scarlett,
     ARRAY['https://throttlist.com/builds/scarlett/DSC00995.jpg'],
     E'First ride on Scarlett. Different in every way from the XSR — but it already feels like home.\n\n#ducati #scrambler #ducatiscrambler #icon #moto #cappuccinomoto',
     1847, 24, '2025-01-15 14:22:00+00'),

    -- thecrocodile — The Croc (Ducati Scrambler 1100)
    ('c0000009-0000-0000-0000-000000000009'::uuid, uid_croc, bid_croc,
     ARRAY['https://throttlist.com/builds/thecrocodile/01.png'],
     'The Croc in the wild. 🐊',
     4821, 38, '2025-04-10 11:00:00+00'),

    ('c0000010-0000-0000-0000-000000000010'::uuid, uid_croc, bid_croc,
     ARRAY['https://throttlist.com/builds/thecrocodile/02.png'],
     E'Scrambler 1100 — still the most character of any modern bike I''ve ridden.\n\n#ducati #scrambler1100 #thecrocodile',
     3102, 19, '2025-03-20 09:30:00+00'),

    ('c0000011-0000-0000-0000-000000000011'::uuid, uid_croc, bid_croc,
     ARRAY['https://throttlist.com/builds/thecrocodile/03.png'],
     E'Golden hour + loud pipe = therapy.\n\n#ducati #scrambler #moto #thecrocodile',
     2754, 14, '2025-02-14 17:00:00+00'),

    -- moto_feelz — The Black Tank (Honda CB750)
    ('c0000012-0000-0000-0000-000000000012'::uuid, uid_feelz, bid_black,
     ARRAY['https://throttlist.com/builds/moto_feelz/01.png'],
     E'The @insta360 GPS Preview Remote has to be one of the most underrated moto accessories. Logs GPS data, previews the shot, AND records your exhaust audio.\n\n#insta360motorcycle #insta360 #honda #cb750',
     2693, 74, '2025-04-08 09:51:27+00'),

    ('c0000013-0000-0000-0000-000000000013'::uuid, uid_feelz, bid_black,
     ARRAY['https://throttlist.com/builds/moto_feelz/02.png'],
     'My favorite kind of therapy 🌅',
     1814, 27, '2025-05-10 10:30:00+00'),

    -- investomoto — Desert Rat (BMW R nineT)
    ('c0000014-0000-0000-0000-000000000014'::uuid, uid_invest, bid_desert,
     ARRAY['https://throttlist.com/builds/investomoto/01.png'],
     E'A work in progress... 🏍️💨\n\nTouratech fork springs · Wilbers rear · Motoz tires · SW Motech crash bars · Quad Lock phone mount.\n\n#rninetscrambler #bmwmotorrad #scrambler #adventurebike',
     1796, 21, '2025-04-20 12:37:28+00'),

    ('c0000015-0000-0000-0000-000000000015'::uuid, uid_invest, bid_desert,
     ARRAY['https://throttlist.com/builds/investomoto/02.png'],
     E'The Project Bike Returns. There''s still plenty of work needed but it''s time to ride.\n\n#rninet #urbangs #offthebeatenpath #makelifearide #bmwmotorrad',
     1819, 13, '2025-03-28 12:28:02+00'),

    -- seven11moto — The Anniversary (Yamaha XSR900)
    ('c0000016-0000-0000-0000-000000000016'::uuid, uid_s11, bid_anniv,
     ARRAY['https://throttlist.com/builds/seven11moto/01.png'],
     E'View from behind 🍑 Working on a new tail tidy setup...\n\n#xsr900 #fastersons #motorcyclephotography #yamahabikes',
     6187, 43, '2025-05-01 11:25:43+00'),

    ('c0000017-0000-0000-0000-000000000017'::uuid, uid_s11, bid_anniv,
     ARRAY['https://throttlist.com/builds/seven11moto/02.png'],
     E'Making the most of late evenings and riding when I can! 🖤⚡\n\n#xsr900 #fastersons #motorbikelife #yamahabikes',
     1291, 8, '2025-04-18 10:46:59+00'),

    -- retroscrambler_ — The Retro (Triumph Street Scrambler)
    ('c0000018-0000-0000-0000-000000000018'::uuid, uid_retro, bid_retro,
     ARRAY['https://throttlist.com/builds/retroscrambler_/01.png'],
     E'Escaping to the outskirts — open roads, blue sky, and the rumble of the Arrow exhaust. Weekly reset button, activated.\n\n#triumphscrambler #scrambler900 #triumphbonneville',
     77, 17, '2025-04-27 13:11:52+00'),

    ('c0000019-0000-0000-0000-000000000019'::uuid, uid_retro, bid_retro,
     ARRAY['https://throttlist.com/builds/retroscrambler_/02.png'],
     E'Gotta love industrial environments — clean lines, minimal color palette. Also lets me shoot without an audience.\n\n#triumphscrambler #scramblertriumph #twowheelsmovethesoul',
     202, 9, '2025-02-14 21:30:09+00'),

    -- coldbrewmoto — Cold Brew (Indian FTR Carbon R)
    ('c0000020-0000-0000-0000-000000000020'::uuid, uid_cold, bid_coldbrew,
     ARRAY['https://throttlist.com/builds/coldbrewmoto/01.png'],
     E'Build update — pretty much run out of bolt-ons at this point 😆 New front master from @brembo, rear sets from @woodcrafttechnologies, cut and repainted side panels.\n\n#indianmotorcycle #ftr #flattracker #coldbrewmoto',
     109, 3, '2025-03-15 02:56:41+00'),

    -- motozuc — The Thunderbird Jr. (Triumph Bonneville T120)
    ('c0000021-0000-0000-0000-000000000021'::uuid, uid_mzuc, bid_bonnie,
     ARRAY['https://throttlist.com/builds/motozuc/01.png'],
     E'Dirt roads 🏍\n\n#triumph #bonneville #t120 #motozuc',
     312, 11, '2025-05-05 14:00:00+00'),

    ('c0000022-0000-0000-0000-000000000022'::uuid, uid_mzuc, bid_bonnie,
     ARRAY['https://throttlist.com/builds/motozuc/02.png'],
     E'The Thunderbird Jr. and me — we both started on British iron.\n\n#triumph #bonneville #motozuc',
     247, 7, '2025-04-12 16:30:00+00')

  ON CONFLICT (id) DO NOTHING;

END $$;

COMMIT;
