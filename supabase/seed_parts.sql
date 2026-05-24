-- Seed parts (tags) for all stock builds
-- Run this once in the Supabase SQL Editor → https://supabase.com/dashboard/project/ypptiyhbwzgzheqkvazo/sql

INSERT INTO public.parts (id, build_id, name, category, type, source_url, notes, is_current, created_at) VALUES

  -- Crema (2018 Yamaha XSR700) ─ cappuccinomoto
  ('d0000001-0000-0000-0000-000000000001'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid, 'SC Project CR-T Slip-On Exhaust',     'Exhaust',     'linkable',  'https://www.sc-project.com',           'Titanium with carbon end cap',          true, '2024-01-20'),
  ('d0000002-0000-0000-0000-000000000002'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid, 'Motogadget M-Blaze Disc Turn Signals', 'Lighting',    'linkable',  'https://motogadget.com',               'Bar-end flush mount',                   true, '2024-01-22'),
  ('d0000003-0000-0000-0000-000000000003'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid, 'Tarozzi Clipon Handlebars',            'Handlebars',  'linkable',  'https://tarozzi.it',                   '50mm drop, 22mm clamp',                 true, '2024-02-01'),
  ('d0000004-0000-0000-0000-000000000004'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid, 'Brat Style One-Piece Seat',            'Seat',        'reference', null,                                   'Custom leather by Brat Style',          true, '2024-02-10'),
  ('d0000005-0000-0000-0000-000000000005'::uuid, 'b0000001-0000-0000-0000-000000000001'::uuid, 'Rizoma Fluid Reservoir Covers',        'Bodywork',    'linkable',  'https://rizoma.com',                   'Anodized black aluminium',              true, '2024-02-15'),

  -- Scarlett (2015 Ducati Scrambler) ─ cappuccinomoto
  ('d0000011-0000-0000-0000-000000000011'::uuid, 'b0000002-0000-0000-0000-000000000002'::uuid, 'Arrow Exhaust Full System',            'Exhaust',     'linkable',  'https://arrowexhaust.com',             'Titanium collector, carbon silencer',   true, '2024-06-05'),
  ('d0000012-0000-0000-0000-000000000012'::uuid, 'b0000002-0000-0000-0000-000000000002'::uuid, 'Hepco & Becker Rear Carrier',          'Accessories', 'linkable',  'https://hepco-becker.de',              'Black powder coat',                     true, '2024-06-10'),
  ('d0000013-0000-0000-0000-000000000013'::uuid, 'b0000002-0000-0000-0000-000000000002'::uuid, 'Rizoma Handlebar Grips',               'Handlebars',  'linkable',  'https://rizoma.com',                   'Open end, black aluminium',             true, '2024-06-12'),
  ('d0000014-0000-0000-0000-000000000014'::uuid, 'b0000002-0000-0000-0000-000000000002'::uuid, 'Touratech Skid Plate',                 'Bodywork',    'linkable',  'https://touratech.com',                'Aluminium 3mm',                         true, '2024-06-20'),

  -- Desert Rat (2020 BMW R nineT) ─ investomoto
  ('d0000021-0000-0000-0000-000000000021'::uuid, 'b0000003-0000-0000-0000-000000000003'::uuid, 'Akrapovic Slip-On Line Exhaust',       'Exhaust',     'linkable',  'https://akrapovic.com',                'Titanium with carbon heat shield',      true, '2024-02-05'),
  ('d0000022-0000-0000-0000-000000000022'::uuid, 'b0000003-0000-0000-0000-000000000003'::uuid, 'Wunderlich Bar Riser Kit',             'Handlebars',  'linkable',  'https://wunderlich.de',                '25mm rise, 20mm forward',               true, '2024-02-08'),
  ('d0000023-0000-0000-0000-000000000023'::uuid, 'b0000003-0000-0000-0000-000000000003'::uuid, 'Motogadget Motoscope Mini',            'Instruments', 'linkable',  'https://motogadget.com',               'Digital, smoked glass',                 true, '2024-02-15'),
  ('d0000024-0000-0000-0000-000000000024'::uuid, 'b0000003-0000-0000-0000-000000000003'::uuid, 'SW-Motech Crashbars',                  'Bodywork',    'linkable',  'https://sw-motech.com',                'Stainless steel engine guard',          true, '2024-02-20'),
  ('d0000025-0000-0000-0000-000000000025'::uuid, 'b0000003-0000-0000-0000-000000000003'::uuid, 'Touratech Zega Pro Panniers',          'Accessories', 'linkable',  'https://touratech.com',                '38L per side, anodised',                true, '2024-03-01'),

  -- The Black Tank (1977 Honda CB750) ─ moto_feelz
  ('d0000031-0000-0000-0000-000000000031'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid, 'Clubman Clip-On Handlebars',           'Handlebars',  'linkable',  'https://cognimoto.com',                'Chrome 7/8" for CB750',                 true, '2024-02-12'),
  ('d0000032-0000-0000-0000-000000000032'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid, 'K&N Pod Air Filters',                  'Engine',      'linkable',  'https://knfilters.com',                'Set of 4, 38mm carbs',                  true, '2024-02-14'),
  ('d0000033-0000-0000-0000-000000000033'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid, 'Drag Specialties 4-Into-1 Exhaust',    'Exhaust',     'reference', null,                                   'Custom chrome header wrap',             true, '2024-02-16'),
  ('d0000034-0000-0000-0000-000000000034'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid, 'Dunlop TT100 GP Tires',                'Tires',       'linkable',  'https://dunlopmotorcycle.com',         'Classic tread pattern, 18"',            true, '2024-02-20'),
  ('d0000035-0000-0000-0000-000000000035'::uuid, 'b0000004-0000-0000-0000-000000000004'::uuid, 'Custom Bates-Style Headlight',         'Lighting',    'reference', null,                                   'Aluminium shell, LED insert',           true, '2024-02-25'),

  -- The Retro (2019 Triumph Street Scrambler) ─ retroscrambler_
  ('d0000041-0000-0000-0000-000000000041'::uuid, 'b0000005-0000-0000-0000-000000000005'::uuid, 'Triumph High Pipe Exhaust Kit',        'Exhaust',     'linkable',  'https://triumphmotorcycles.com',       'OEM accessory high exhaust',            true, '2024-03-05'),
  ('d0000042-0000-0000-0000-000000000042'::uuid, 'b0000005-0000-0000-0000-000000000005'::uuid, 'Pyramid Belly Pan',                    'Bodywork',    'linkable',  'https://pyramidplastics.co.uk',        'Gloss black ABS',                       true, '2024-03-08'),
  ('d0000043-0000-0000-0000-000000000043'::uuid, 'b0000005-0000-0000-0000-000000000005'::uuid, 'Continental TKC80 Adventure Tires',    'Tires',       'linkable',  'https://continental-tires.com',        '19" front / 17" rear',                  true, '2024-03-12'),
  ('d0000044-0000-0000-0000-000000000044'::uuid, 'b0000005-0000-0000-0000-000000000005'::uuid, 'Overland Bespoke Leather Seat',        'Seat',        'reference', null,                                   'Distressed brown leather',              true, '2024-03-15'),

  -- The Anniversary (2022 Yamaha XSR900) ─ seven11moto
  ('d0000051-0000-0000-0000-000000000051'::uuid, 'b0000006-0000-0000-0000-000000000006'::uuid, 'Spark Exhaust Moto-GP RKT Full System','Exhaust',     'linkable',  'https://spark-exhaust.com',            'Stainless collector, carbon can',       true, '2024-03-18'),
  ('d0000052-0000-0000-0000-000000000052'::uuid, 'b0000006-0000-0000-0000-000000000006'::uuid, 'Rizoma Stealth Bar End Mirrors',       'Mirrors',     'linkable',  'https://rizoma.com',                   'CNC aluminium, anodized',               true, '2024-03-20'),
  ('d0000053-0000-0000-0000-000000000053'::uuid, 'b0000006-0000-0000-0000-000000000006'::uuid, 'Rizoma Rider Footpeg Kit',             'Ergonomics',  'linkable',  'https://rizoma.com',                   'Billet aluminium, black',               true, '2024-03-22'),
  ('d0000054-0000-0000-0000-000000000054'::uuid, 'b0000006-0000-0000-0000-000000000006'::uuid, 'Motogadget M-Unit Blue',               'Electronics', 'linkable',  'https://motogadget.com',               'Smart bike controller',                 true, '2024-03-25'),
  ('d0000055-0000-0000-0000-000000000055'::uuid, 'b0000006-0000-0000-0000-000000000006'::uuid, 'GIVI Windshield D2145ST',              'Bodywork',    'linkable',  'https://givi.it',                      'Smoked 310mm, quick release',           true, '2024-03-28'),

  -- Cold Brew (2023 Indian FTR Carbon R) ─ coldbrewmoto
  ('d0000061-0000-0000-0000-000000000061'::uuid, 'b0000007-0000-0000-0000-000000000007'::uuid, 'Öhlins FGR 300 Suspension Kit',       'Suspension',  'linkable',  'https://ohlins.com',                   'Full race spec front forks',            true, '2024-04-12'),
  ('d0000062-0000-0000-0000-000000000062'::uuid, 'b0000007-0000-0000-0000-000000000007'::uuid, 'Akrapovic Racing Full Exhaust',        'Exhaust',     'linkable',  'https://akrapovic.com',                'Full titanium system',                  true, '2024-04-15'),
  ('d0000063-0000-0000-0000-000000000063'::uuid, 'b0000007-0000-0000-0000-000000000007'::uuid, 'Indian Motorcycle Carbon Tank Shrouds','Bodywork',    'reference', null,                                   'OEM factory carbon fibre',              true, '2024-04-18'),
  ('d0000064-0000-0000-0000-000000000064'::uuid, 'b0000007-0000-0000-0000-000000000007'::uuid, 'Brembo M50 Monobloc Calipers',         'Brakes',      'linkable',  'https://brembo.com',                   '4-piston radial mount',                 true, '2024-04-20'),

  -- The Croc (2021 Ducati Scrambler 1100) ─ thecrocodile
  ('d0000071-0000-0000-0000-000000000071'::uuid, 'b0000008-0000-0000-0000-000000000008'::uuid, 'Arrow Pro Race Exhaust',               'Exhaust',     'linkable',  'https://arrowexhaust.com',             'Full titanium, DB killer incl.',        true, '2024-03-22'),
  ('d0000072-0000-0000-0000-000000000072'::uuid, 'b0000008-0000-0000-0000-000000000008'::uuid, 'Rizoma Bar End Mirrors',               'Mirrors',     'linkable',  'https://rizoma.com',                   'Spy R model, black',                    true, '2024-03-24'),
  ('d0000073-0000-0000-0000-000000000073'::uuid, 'b0000008-0000-0000-0000-000000000008'::uuid, 'SW-Motech Crash Bars',                 'Bodywork',    'linkable',  'https://sw-motech.com',                'Stainless, black powder coat',          true, '2024-03-26'),
  ('d0000074-0000-0000-0000-000000000074'::uuid, 'b0000008-0000-0000-0000-000000000008'::uuid, 'Ducati Performance Comfort Seat',      'Seat',        'reference', null,                                   'Low profile, 790mm height',             true, '2024-03-28'),
  ('d0000075-0000-0000-0000-000000000075'::uuid, 'b0000008-0000-0000-0000-000000000008'::uuid, 'Pirelli Scorpion Trail II Tires',      'Tires',       'linkable',  'https://pirelli.com',                  '120/70-19 front, 180/55-17 rear',       true, '2024-04-01'),

  -- The Thunderbird Jr. (2020 Triumph Bonneville T120) ─ motozuc
  ('d0000081-0000-0000-0000-000000000081'::uuid, 'b0000009-0000-0000-0000-000000000009'::uuid, 'British Customs Predator Exhaust',     'Exhaust',     'linkable',  'https://britishcustoms.com',           'Stainless steel, reverse mega',         true, '2024-04-03'),
  ('d0000082-0000-0000-0000-000000000082'::uuid, 'b0000009-0000-0000-0000-000000000009'::uuid, 'Triumph Accessories Rack & Panniers',  'Accessories', 'linkable',  'https://triumphmotorcycles.com',       'OEM expedition luggage set',            true, '2024-04-05'),
  ('d0000083-0000-0000-0000-000000000083'::uuid, 'b0000009-0000-0000-0000-000000000009'::uuid, 'Skidmarx Classic Screen',              'Bodywork',    'linkable',  'https://skidmarx.co.uk',               'Dark tint, 250mm height',               true, '2024-04-08'),
  ('d0000084-0000-0000-0000-000000000084'::uuid, 'b0000009-0000-0000-0000-000000000009'::uuid, 'Barkbusters Storm Handguards',         'Handlebars',  'reference', null,                                   'Black aluminium backbone',              true, '2024-04-10'),
  ('d0000085-0000-0000-0000-000000000085'::uuid, 'b0000009-0000-0000-0000-000000000009'::uuid, 'Motone Customs Gauge Surround',        'Instruments', 'linkable',  'https://motonecustoms.com',            'Aluminium, brushed finish',             true, '2024-04-12')

ON CONFLICT (id) DO NOTHING;
