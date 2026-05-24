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

  -- ── 4. Parts (tags) ──────────────────────────────────────────────────────────
  INSERT INTO public.parts (id, build_id, name, category, type, source_url, notes, is_current, created_at) VALUES

    -- Crema (2018 Yamaha XSR700) ─ cappuccinomoto
    ('d0000001-0000-0000-0000-000000000001'::uuid, bid_crema, 'SC Project CR-T Slip-On Exhaust',  'Exhaust',    'linkable',  'https://www.sc-project.com', 'Titanium with carbon end cap', true, '2024-01-20'),
    ('d0000002-0000-0000-0000-000000000002'::uuid, bid_crema, 'Motogadget M-Blaze Disc Turn Signals','Lighting','linkable',  'https://motogadget.com',     'Bar-end flush mount',          true, '2024-01-22'),
    ('d0000003-0000-0000-0000-000000000003'::uuid, bid_crema, 'Tarozzi Clipon Handlebars',         'Handlebars', 'linkable',  'https://tarozzi.it',         '50mm drop, 22mm clamp',        true, '2024-02-01'),
    ('d0000004-0000-0000-0000-000000000004'::uuid, bid_crema, 'Brat Style One-Piece Seat',         'Seat',       'reference', null,                         'Custom leather by Brat Style', true, '2024-02-10'),
    ('d0000005-0000-0000-0000-000000000005'::uuid, bid_crema, 'Rizoma Fluid Reservoir Covers',     'Bodywork',   'linkable',  'https://rizoma.com',         'Anodized black aluminium',     true, '2024-02-15'),

    -- Scarlett (2015 Ducati Scrambler) ─ cappuccinomoto
    ('d0000011-0000-0000-0000-000000000011'::uuid, bid_scarlett, 'Arrow Exhaust Full System',       'Exhaust',    'linkable',  'https://arrowexhaust.com',   'Titanium collector, carbon silencer', true, '2024-06-05'),
    ('d0000012-0000-0000-0000-000000000012'::uuid, bid_scarlett, 'Hepco & Becker Rear Carrier',     'Accessories','linkable',  'https://hepco-becker.de',    'Black powder coat',            true, '2024-06-10'),
    ('d0000013-0000-0000-0000-000000000013'::uuid, bid_scarlett, 'Rizoma Handlebar Grips',          'Handlebars', 'linkable',  'https://rizoma.com',         'Open end, black aluminium',    true, '2024-06-12'),
    ('d0000014-0000-0000-0000-000000000014'::uuid, bid_scarlett, 'Touratech Skid Plate',            'Bodywork',   'linkable',  'https://touratech.com',      'Aluminium 3mm',                true, '2024-06-20'),

    -- Desert Rat (2020 BMW R nineT) ─ investomoto
    ('d0000021-0000-0000-0000-000000000021'::uuid, bid_desert, 'Akrapovic Slip-On Line Exhaust',   'Exhaust',    'linkable',  'https://akrapovic.com',      'Titanium with carbon heat shield', true, '2024-02-05'),
    ('d0000022-0000-0000-0000-000000000022'::uuid, bid_desert, 'Wunderlich Bar Riser Kit',         'Handlebars', 'linkable',  'https://wunderlich.de',      '25mm rise, 20mm forward',      true, '2024-02-08'),
    ('d0000023-0000-0000-0000-000000000023'::uuid, bid_desert, 'Motogadget Motoscope Mini',        'Instruments','linkable',  'https://motogadget.com',     'Digital, smoked glass',        true, '2024-02-15'),
    ('d0000024-0000-0000-0000-000000000024'::uuid, bid_desert, 'SW-Motech Crashbars',              'Bodywork',   'linkable',  'https://sw-motech.com',      'Stainless steel engine guard',  true, '2024-02-20'),
    ('d0000025-0000-0000-0000-000000000025'::uuid, bid_desert, 'Touratech Zega Pro Panniers',      'Accessories','linkable',  'https://touratech.com',      '38L per side, anodised',       true, '2024-03-01'),

    -- The Black Tank (1977 Honda CB750) ─ moto_feelz
    ('d0000031-0000-0000-0000-000000000031'::uuid, bid_black, 'Clubman Clip-On Handlebars',        'Handlebars', 'linkable',  'https://cognimoto.com',      'Chrome 7/8" for CB750',        true, '2024-02-12'),
    ('d0000032-0000-0000-0000-000000000032'::uuid, bid_black, 'K&N Pod Air Filters',               'Engine',     'linkable',  'https://knfilters.com',      'Set of 4, 38mm carbs',         true, '2024-02-14'),
    ('d0000033-0000-0000-0000-000000000033'::uuid, bid_black, 'Drag Specialties 4-Into-1 Exhaust', 'Exhaust',    'reference', null,                         'Custom chrome header wrap',    true, '2024-02-16'),
    ('d0000034-0000-0000-0000-000000000034'::uuid, bid_black, 'Dunlop TT100 GP Tires',             'Tires',      'linkable',  'https://dunlopmotorcycle.com','Classic tread pattern, 18"',  true, '2024-02-20'),
    ('d0000035-0000-0000-0000-000000000035'::uuid, bid_black, 'Custom Bates-Style Headlight',      'Lighting',   'reference', null,                         'Aluminium shell, LED insert',  true, '2024-02-25'),

    -- The Retro (2019 Triumph Street Scrambler) ─ retroscrambler_
    ('d0000041-0000-0000-0000-000000000041'::uuid, bid_retro, 'Triumph High Pipe Exhaust Kit',     'Exhaust',    'linkable',  'https://triumphmotorcycles.com','OEM accessory high exhaust', true, '2024-03-05'),
    ('d0000042-0000-0000-0000-000000000042'::uuid, bid_retro, 'Pyramid Belly Pan',                 'Bodywork',   'linkable',  'https://pyramidplastics.co.uk','Gloss black ABS',            true, '2024-03-08'),
    ('d0000043-0000-0000-0000-000000000043'::uuid, bid_retro, 'Continental TKC80 Adventure Tires', 'Tires',      'linkable',  'https://continental-tires.com','19" front / 17" rear',       true, '2024-03-12'),
    ('d0000044-0000-0000-0000-000000000044'::uuid, bid_retro, 'Overland Bespoke Seat',             'Seat',       'reference', null,                         'Distressed brown leather',     true, '2024-03-15'),

    -- The Anniversary (2022 Yamaha XSR900) ─ seven11moto
    ('d0000051-0000-0000-0000-000000000051'::uuid, bid_anniv, 'Spark Exhaust Moto-GP RKT Full System','Exhaust', 'linkable',  'https://spark-exhaust.com',  'Stainless collector, carbon can', true, '2024-03-18'),
    ('d0000052-0000-0000-0000-000000000052'::uuid, bid_anniv, 'Rizoma Stealth Bar End Mirrors',    'Mirrors',    'linkable',  'https://rizoma.com',         'CNC aluminium, anodized',      true, '2024-03-20'),
    ('d0000053-0000-0000-0000-000000000053'::uuid, bid_anniv, 'Rizoma Rider Footpeg Kit',          'Ergonomics', 'linkable',  'https://rizoma.com',         'Billet aluminium, black',      true, '2024-03-22'),
    ('d0000054-0000-0000-0000-000000000054'::uuid, bid_anniv, 'Motogadget M-Unit Blue',            'Electronics','linkable',  'https://motogadget.com',     'Smart bike controller',        true, '2024-03-25'),
    ('d0000055-0000-0000-0000-000000000055'::uuid, bid_anniv, 'GIVI Windshield D2145ST',           'Bodywork',   'linkable',  'https://givi.it',            'Smoked 310mm, quick release',  true, '2024-03-28'),

    -- Cold Brew (2023 Indian FTR Carbon R) ─ coldbrewmoto
    ('d0000061-0000-0000-0000-000000000061'::uuid, bid_coldbrew, 'Öhlins FGR 300 Suspension Kit', 'Suspension', 'linkable',  'https://ohlins.com',         'Full race spec front forks',   true, '2024-04-12'),
    ('d0000062-0000-0000-0000-000000000062'::uuid, bid_coldbrew, 'Akrapovic Racing Exhaust',       'Exhaust',    'linkable',  'https://akrapovic.com',      'Full titanium system',         true, '2024-04-15'),
    ('d0000063-0000-0000-0000-000000000063'::uuid, bid_coldbrew, 'Indian Motorcycle Carbon Tank Shrouds','Bodywork','reference',null,                        'OEM factory carbon fibre',     true, '2024-04-18'),
    ('d0000064-0000-0000-0000-000000000064'::uuid, bid_coldbrew, 'Brembo M50 Monobloc Calipers',   'Brakes',     'linkable',  'https://brembo.com',         '4-piston radial mount',        true, '2024-04-20'),

    -- The Croc (2021 Ducati Scrambler 1100) ─ thecrocodile
    ('d0000071-0000-0000-0000-000000000071'::uuid, bid_croc, 'Arrow Pro Race Exhaust',             'Exhaust',    'linkable',  'https://arrowexhaust.com',   'Full titanium, DB killer incl.',true, '2024-03-22'),
    ('d0000072-0000-0000-0000-000000000072'::uuid, bid_croc, 'Rizoma Bar End Mirrors',             'Mirrors',    'linkable',  'https://rizoma.com',         'Spy R model, black',           true, '2024-03-24'),
    ('d0000073-0000-0000-0000-000000000073'::uuid, bid_croc, 'SW-Motech Crash Bars',               'Bodywork',   'linkable',  'https://sw-motech.com',      'Stainless, black powder coat',  true, '2024-03-26'),
    ('d0000074-0000-0000-0000-000000000074'::uuid, bid_croc, 'Ducati Performance Comfort Seat',    'Seat',       'reference', null,                         'Low profile, 790mm height',    true, '2024-03-28'),
    ('d0000075-0000-0000-0000-000000000075'::uuid, bid_croc, 'Pirelli Scorpion Trail II Tires',    'Tires',      'linkable',  'https://pirelli.com',        '120/70-19 front, 180/55-17 rear', true, '2024-04-01'),

    -- The Thunderbird Jr. (2020 Triumph Bonneville T120) ─ motozuc
    ('d0000081-0000-0000-0000-000000000081'::uuid, bid_bonnie, 'British Customs Predator Exhaust', 'Exhaust',    'linkable',  'https://britishcustoms.com', 'Stainless steel, reverse mega', true, '2024-04-03'),
    ('d0000082-0000-0000-0000-000000000082'::uuid, bid_bonnie, 'Triumph Accessories Rack & Panniers','Accessories','linkable', 'https://triumphmotorcycles.com','OEM expedition luggage set', true, '2024-04-05'),
    ('d0000083-0000-0000-0000-000000000083'::uuid, bid_bonnie, 'Skidmarx Classic Screen',          'Bodywork',   'linkable',  'https://skidmarx.co.uk',     'Dark tint, 250mm height',      true, '2024-04-08'),
    ('d0000084-0000-0000-0000-000000000084'::uuid, bid_bonnie, 'Barkbusters Storm Handguards',     'Handlebars', 'reference', null,                         'Black aluminium backbone',     true, '2024-04-10'),
    ('d0000085-0000-0000-0000-000000000085'::uuid, bid_bonnie, 'Motone Customs Gauge Surround',    'Instruments','linkable',  'https://motonecustoms.com',  'Aluminium, brushed finish',    true, '2024-04-12')

  ON CONFLICT (id) DO NOTHING;

  -- ── 5. Posts ─────────────────────────────────────────────────────────────────
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
