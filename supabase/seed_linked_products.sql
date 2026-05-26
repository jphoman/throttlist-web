-- Throttlist seed — linked_products tags for all 22 seed posts.
-- Run AFTER seed.sql. Safe to re-run (idempotent UPDATEs).
-- Categories match the motorcycles partCategories from constants/buildTypes.ts:
--   Engine · Exhaust · Suspension · Wheels & Tires · Front End
--   Frame & Body · Controls · Electrical · Paint & Finish

BEGIN;

-- ── cappuccinomoto — Crema (2018 Yamaha XSR700) ────────────────────────────

-- c0000001 "Crema. Done." — full build reveal shot
UPDATE public.posts SET linked_products = '[
  {"id":"e1010001-0000-0000-0000-000000000001","title":"SC Project CR-T Slip-On Exhaust","brand":"SC Project","rawUrl":"https://www.sc-project.com/product/cr-t-xsr700/","trackingUrl":"https://www.sc-project.com/product/cr-t-xsr700/","x":0.82,"y":0.68,"source":"web","category":"Exhaust"},
  {"id":"e1010002-0000-0000-0000-000000000001","title":"Tarozzi Clipon Handlebars 50mm Drop","brand":"Tarozzi","rawUrl":"https://tarozzi.it/en/product/clip-on-handlebars-xsr700/","trackingUrl":"https://tarozzi.it/en/product/clip-on-handlebars-xsr700/","x":0.35,"y":0.28,"source":"web","category":"Controls"},
  {"id":"e1010003-0000-0000-0000-000000000001","title":"Motogadget M-Blaze Disc Bar-End Turn Signals","brand":"Motogadget","rawUrl":"https://motogadget.com/en/m-blaze-disc.html","trackingUrl":"https://motogadget.com/en/m-blaze-disc.html","x":0.22,"y":0.35,"source":"web","category":"Electrical"},
  {"id":"e1010004-0000-0000-0000-000000000001","title":"Brat Style One-Piece Cafe Seat","brand":"Brat Style","rawUrl":"","trackingUrl":"","x":0.55,"y":0.72,"source":"manual","category":"Frame & Body"},
  {"id":"e1010005-0000-0000-0000-000000000001","title":"Rizoma Fluid Reservoir Covers","brand":"Rizoma","rawUrl":"https://www.rizoma.com/en/catalog/covers","trackingUrl":"https://www.rizoma.com/en/catalog/covers","x":0.68,"y":0.38,"source":"web","category":"Frame & Body"}
]'::jsonb
WHERE id = 'c0000001-0000-0000-0000-000000000001';

-- c0000002 "You know me" — rider wearing AGV X3000 + Fastersons gear
UPDATE public.posts SET linked_products = '[
  {"id":"e1020001-0000-0000-0000-000000000001","title":"AGV X3000 Legends Full-Face Helmet","brand":"AGV","rawUrl":"https://www.agv.com/en-us/helmets/x3000.html","trackingUrl":"https://www.agv.com/en-us/helmets/x3000.html","x":0.50,"y":0.18,"source":"web","category":"Controls"},
  {"id":"e1020002-0000-0000-0000-000000000001","title":"Fastersons Classic Cafe Racer Jacket","brand":"Fastersons","rawUrl":"https://fastersons.com/collections/jackets","trackingUrl":"https://fastersons.com/collections/jackets","x":0.50,"y":0.45,"source":"web","category":"Controls"},
  {"id":"e1020003-0000-0000-0000-000000000001","title":"Dainese Blackjack Unisex Gloves","brand":"Dainese","rawUrl":"https://www.dainese.com/us/en/motorcycle/gloves/blackjack-unisex-gloves/","trackingUrl":"https://www.dainese.com/us/en/motorcycle/gloves/blackjack-unisex-gloves/","x":0.30,"y":0.62,"source":"web","category":"Controls"}
]'::jsonb
WHERE id = 'c0000002-0000-0000-0000-000000000002';

-- c0000003 "Sunday morning light." — ambient side profile of Crema
UPDATE public.posts SET linked_products = '[
  {"id":"e1030001-0000-0000-0000-000000000001","title":"SC Project CR-T Slip-On Exhaust","brand":"SC Project","rawUrl":"https://www.sc-project.com/product/cr-t-xsr700/","trackingUrl":"https://www.sc-project.com/product/cr-t-xsr700/","x":0.78,"y":0.65,"source":"web","category":"Exhaust"},
  {"id":"e1030002-0000-0000-0000-000000000001","title":"Brat Style One-Piece Cafe Seat","brand":"Brat Style","rawUrl":"","trackingUrl":"","x":0.55,"y":0.58,"source":"manual","category":"Frame & Body"},
  {"id":"e1030003-0000-0000-0000-000000000001","title":"Tarozzi Clipon Handlebars 50mm Drop","brand":"Tarozzi","rawUrl":"https://tarozzi.it/en/product/clip-on-handlebars-xsr700/","trackingUrl":"https://tarozzi.it/en/product/clip-on-handlebars-xsr700/","x":0.32,"y":0.30,"source":"web","category":"Controls"}
]'::jsonb
WHERE id = 'c0000003-0000-0000-0000-000000000003';

-- c0000004 "Saturday is for the motos" — caption mentions Quad Lock, custom mirror, Fastersons
UPDATE public.posts SET linked_products = '[
  {"id":"e1040001-0000-0000-0000-000000000001","title":"Quad Lock Motorcycle Phone Mount Kit","brand":"Quad Lock","rawUrl":"https://www.quadlockcase.com/collections/shop-mounts/products/motorcycle-mount","trackingUrl":"https://www.quadlockcase.com/collections/shop-mounts/products/motorcycle-mount","x":0.42,"y":0.30,"source":"web","category":"Electrical"},
  {"id":"e1040002-0000-0000-0000-000000000001","title":"Motogadget M-Blaze Disc Bar-End Turn Signals","brand":"Motogadget","rawUrl":"https://motogadget.com/en/m-blaze-disc.html","trackingUrl":"https://motogadget.com/en/m-blaze-disc.html","x":0.20,"y":0.33,"source":"web","category":"Electrical"},
  {"id":"e1040003-0000-0000-0000-000000000001","title":"Fastersons Classic Cafe Racer Jacket","brand":"Fastersons","rawUrl":"https://fastersons.com/collections/jackets","trackingUrl":"https://fastersons.com/collections/jackets","x":0.55,"y":0.42,"source":"web","category":"Controls"},
  {"id":"e1040004-0000-0000-0000-000000000001","title":"Custom CNC Bar-End Mirrors","brand":"","rawUrl":"","trackingUrl":"","x":0.22,"y":0.28,"source":"manual","category":"Controls"}
]'::jsonb
WHERE id = 'c0000004-0000-0000-0000-000000000004';

-- c0000005 "After the ECU flash the SC Project really opened up." — exhaust detail
UPDATE public.posts SET linked_products = '[
  {"id":"e1050001-0000-0000-0000-000000000001","title":"SC Project CR-T Slip-On Exhaust","brand":"SC Project","rawUrl":"https://www.sc-project.com/product/cr-t-xsr700/","trackingUrl":"https://www.sc-project.com/product/cr-t-xsr700/","x":0.75,"y":0.60,"source":"web","category":"Exhaust"},
  {"id":"e1050002-0000-0000-0000-000000000001","title":"Woolich Racing Flash Tool — Yamaha XSR700","brand":"Woolich Racing","rawUrl":"https://woolich.com/products/yamaha-xsr700/","trackingUrl":"https://woolich.com/products/yamaha-xsr700/","x":0.48,"y":0.48,"source":"web","category":"Electrical"},
  {"id":"e1050003-0000-0000-0000-000000000001","title":"Dynojet Power Commander V","brand":"Dynojet","rawUrl":"https://www.dynojet.com/power-commander-v/","trackingUrl":"https://www.dynojet.com/power-commander-v/","x":0.35,"y":0.55,"source":"web","category":"Electrical"}
]'::jsonb
WHERE id = 'c0000005-0000-0000-0000-000000000005';

-- ── cappuccinomoto — Scarlett (2015 Ducati Scrambler Icon) ─────────────────

-- c0000006 "Scarlett and Crema. Both cappuccinos." — garage two-bike shot
UPDATE public.posts SET linked_products = '[
  {"id":"e1060001-0000-0000-0000-000000000001","title":"Arrow Full System Exhaust — Ducati Scrambler","brand":"Arrow","rawUrl":"https://www.arrowexhaust.com/arrow-full-system-exhaust-ducati-scrambler/","trackingUrl":"https://www.arrowexhaust.com/arrow-full-system-exhaust-ducati-scrambler/","x":0.70,"y":0.65,"source":"web","category":"Exhaust"},
  {"id":"e1060002-0000-0000-0000-000000000001","title":"Hepco & Becker Rear Carrier — Ducati Scrambler","brand":"Hepco & Becker","rawUrl":"https://www.hepco-becker.de/en/ducati/scrambler/","trackingUrl":"https://www.hepco-becker.de/en/ducati/scrambler/","x":0.60,"y":0.45,"source":"web","category":"Frame & Body"},
  {"id":"e1060003-0000-0000-0000-000000000001","title":"Rizoma Open End Handlebar Grips","brand":"Rizoma","rawUrl":"https://www.rizoma.com/en/catalog/grips","trackingUrl":"https://www.rizoma.com/en/catalog/grips","x":0.38,"y":0.30,"source":"web","category":"Controls"},
  {"id":"e1060004-0000-0000-0000-000000000001","title":"Touratech Aluminium Skid Plate — Ducati Scrambler","brand":"Touratech","rawUrl":"https://touratech.com/Product/Skid-Plate-Ducati-Scrambler","trackingUrl":"https://touratech.com/Product/Skid-Plate-Ducati-Scrambler","x":0.55,"y":0.78,"source":"web","category":"Frame & Body"}
]'::jsonb
WHERE id = 'c0000006-0000-0000-0000-000000000006';

-- c0000007 "That Ducati red doesn't get old." — glamour close-up of Scarlett
UPDATE public.posts SET linked_products = '[
  {"id":"e1070001-0000-0000-0000-000000000001","title":"Arrow Full System Exhaust — Ducati Scrambler","brand":"Arrow","rawUrl":"https://www.arrowexhaust.com/arrow-full-system-exhaust-ducati-scrambler/","trackingUrl":"https://www.arrowexhaust.com/arrow-full-system-exhaust-ducati-scrambler/","x":0.72,"y":0.62,"source":"web","category":"Exhaust"},
  {"id":"e1070002-0000-0000-0000-000000000001","title":"Rizoma Open End Handlebar Grips","brand":"Rizoma","rawUrl":"https://www.rizoma.com/en/catalog/grips","trackingUrl":"https://www.rizoma.com/en/catalog/grips","x":0.28,"y":0.30,"source":"web","category":"Controls"},
  {"id":"e1070003-0000-0000-0000-000000000001","title":"Touratech Aluminium Skid Plate — Ducati Scrambler","brand":"Touratech","rawUrl":"https://touratech.com/Product/Skid-Plate-Ducati-Scrambler","trackingUrl":"https://touratech.com/Product/Skid-Plate-Ducati-Scrambler","x":0.50,"y":0.80,"source":"web","category":"Frame & Body"}
]'::jsonb
WHERE id = 'c0000007-0000-0000-0000-000000000007';

-- c0000008 "First ride on Scarlett." — low-angle first-ride shot
UPDATE public.posts SET linked_products = '[
  {"id":"e1080001-0000-0000-0000-000000000001","title":"Arrow Full System Exhaust — Ducati Scrambler","brand":"Arrow","rawUrl":"https://www.arrowexhaust.com/arrow-full-system-exhaust-ducati-scrambler/","trackingUrl":"https://www.arrowexhaust.com/arrow-full-system-exhaust-ducati-scrambler/","x":0.75,"y":0.65,"source":"web","category":"Exhaust"},
  {"id":"e1080002-0000-0000-0000-000000000001","title":"Rizoma Open End Handlebar Grips","brand":"Rizoma","rawUrl":"https://www.rizoma.com/en/catalog/grips","trackingUrl":"https://www.rizoma.com/en/catalog/grips","x":0.30,"y":0.28,"source":"web","category":"Controls"},
  {"id":"e1080003-0000-0000-0000-000000000001","title":"Touratech Aluminium Skid Plate — Ducati Scrambler","brand":"Touratech","rawUrl":"https://touratech.com/Product/Skid-Plate-Ducati-Scrambler","trackingUrl":"https://touratech.com/Product/Skid-Plate-Ducati-Scrambler","x":0.50,"y":0.80,"source":"web","category":"Frame & Body"},
  {"id":"e1080004-0000-0000-0000-000000000001","title":"Hepco & Becker Rear Carrier — Ducati Scrambler","brand":"Hepco & Becker","rawUrl":"https://www.hepco-becker.de/en/ducati/scrambler/","trackingUrl":"https://www.hepco-becker.de/en/ducati/scrambler/","x":0.62,"y":0.55,"source":"web","category":"Frame & Body"}
]'::jsonb
WHERE id = 'c0000008-0000-0000-0000-000000000008';

-- ── thecrocodile — The Croc (2021 Ducati Scrambler 1100) ──────────────────

-- c0000009 "The Croc in the wild. 🐊" — outdoor action/parked shot
UPDATE public.posts SET linked_products = '[
  {"id":"e1090001-0000-0000-0000-000000000001","title":"Arrow Pro Race Full Titanium Exhaust — Scrambler 1100","brand":"Arrow","rawUrl":"https://www.arrowexhaust.com/arrow-pro-race-full-system-ducati-scrambler-1100/","trackingUrl":"https://www.arrowexhaust.com/arrow-pro-race-full-system-ducati-scrambler-1100/","x":0.80,"y":0.65,"source":"web","category":"Exhaust"},
  {"id":"e1090002-0000-0000-0000-000000000001","title":"Rizoma Spy R Bar-End Mirrors","brand":"Rizoma","rawUrl":"https://www.rizoma.com/en/catalog/spy-r-mirror","trackingUrl":"https://www.rizoma.com/en/catalog/spy-r-mirror","x":0.25,"y":0.30,"source":"web","category":"Controls"},
  {"id":"e1090003-0000-0000-0000-000000000001","title":"SW-Motech Crash Bars — Ducati Scrambler 1100","brand":"SW-Motech","rawUrl":"https://sw-motech.com/en/products/body/engine+protectors/","trackingUrl":"https://sw-motech.com/en/products/body/engine+protectors/","x":0.45,"y":0.70,"source":"web","category":"Frame & Body"},
  {"id":"e1090004-0000-0000-0000-000000000001","title":"Pirelli Scorpion Trail II Tires","brand":"Pirelli","rawUrl":"https://www.pirelli.com/tyres/en-ww/moto/scorpion-trail-ii","trackingUrl":"https://www.pirelli.com/tyres/en-ww/moto/scorpion-trail-ii","x":0.20,"y":0.80,"source":"web","category":"Wheels & Tires"}
]'::jsonb
WHERE id = 'c0000009-0000-0000-0000-000000000009';

-- c0000010 "Scrambler 1100 — still the most character" — studio/detail shot
UPDATE public.posts SET linked_products = '[
  {"id":"e1100001-0000-0000-0000-000000000001","title":"Arrow Pro Race Full Titanium Exhaust — Scrambler 1100","brand":"Arrow","rawUrl":"https://www.arrowexhaust.com/arrow-pro-race-full-system-ducati-scrambler-1100/","trackingUrl":"https://www.arrowexhaust.com/arrow-pro-race-full-system-ducati-scrambler-1100/","x":0.78,"y":0.63,"source":"web","category":"Exhaust"},
  {"id":"e1100002-0000-0000-0000-000000000001","title":"Rizoma Spy R Bar-End Mirrors","brand":"Rizoma","rawUrl":"https://www.rizoma.com/en/catalog/spy-r-mirror","trackingUrl":"https://www.rizoma.com/en/catalog/spy-r-mirror","x":0.22,"y":0.28,"source":"web","category":"Controls"},
  {"id":"e1100003-0000-0000-0000-000000000001","title":"Pirelli Scorpion Trail II Tires","brand":"Pirelli","rawUrl":"https://www.pirelli.com/tyres/en-ww/moto/scorpion-trail-ii","trackingUrl":"https://www.pirelli.com/tyres/en-ww/moto/scorpion-trail-ii","x":0.18,"y":0.82,"source":"web","category":"Wheels & Tires"}
]'::jsonb
WHERE id = 'c0000010-0000-0000-0000-000000000010';

-- c0000011 "Golden hour + loud pipe = therapy." — golden hour exhaust shot
UPDATE public.posts SET linked_products = '[
  {"id":"e1110001-0000-0000-0000-000000000001","title":"Arrow Pro Race Full Titanium Exhaust — Scrambler 1100","brand":"Arrow","rawUrl":"https://www.arrowexhaust.com/arrow-pro-race-full-system-ducati-scrambler-1100/","trackingUrl":"https://www.arrowexhaust.com/arrow-pro-race-full-system-ducati-scrambler-1100/","x":0.80,"y":0.65,"source":"web","category":"Exhaust"},
  {"id":"e1110002-0000-0000-0000-000000000001","title":"SW-Motech Crash Bars — Ducati Scrambler 1100","brand":"SW-Motech","rawUrl":"https://sw-motech.com/en/products/body/engine+protectors/","trackingUrl":"https://sw-motech.com/en/products/body/engine+protectors/","x":0.42,"y":0.68,"source":"web","category":"Frame & Body"},
  {"id":"e1110003-0000-0000-0000-000000000001","title":"Ducati Performance Low Comfort Seat","brand":"Ducati Performance","rawUrl":"","trackingUrl":"","x":0.55,"y":0.52,"source":"manual","category":"Frame & Body"}
]'::jsonb
WHERE id = 'c0000011-0000-0000-0000-000000000011';

-- ── moto_feelz — The Black Tank (1977 Honda CB750) ─────────────────────────

-- c0000012 "The @insta360 GPS Preview Remote" — camera tech focus shot
UPDATE public.posts SET linked_products = '[
  {"id":"e1120001-0000-0000-0000-000000000001","title":"Insta360 GPS Preview Remote","brand":"Insta360","rawUrl":"https://www.amazon.com/Insta360-Preview-Remote-ONE-X2/dp/B09NXD43KX/","trackingUrl":"https://www.amazon.com/Insta360-Preview-Remote-ONE-X2/dp/B09NXD43KX/?tag=throttlist-20","x":0.45,"y":0.28,"source":"amazon","category":"Electrical"},
  {"id":"e1120002-0000-0000-0000-000000000001","title":"Insta360 X3 Action Camera","brand":"Insta360","rawUrl":"https://www.amazon.com/Insta360-X3-Waterproof-Action-Camera/dp/B0BF6FZVQB/","trackingUrl":"https://www.amazon.com/Insta360-X3-Waterproof-Action-Camera/dp/B0BF6FZVQB/?tag=throttlist-20","x":0.55,"y":0.22,"source":"amazon","category":"Electrical"},
  {"id":"e1120003-0000-0000-0000-000000000001","title":"Quad Lock Pro Motorcycle Phone Mount","brand":"Quad Lock","rawUrl":"https://www.quadlockcase.com/collections/shop-mounts/products/motorcycle-mount","trackingUrl":"https://www.quadlockcase.com/collections/shop-mounts/products/motorcycle-mount","x":0.40,"y":0.35,"source":"web","category":"Electrical"},
  {"id":"e1120004-0000-0000-0000-000000000001","title":"K&N Pod Air Filter Set — Honda CB750","brand":"K&N","rawUrl":"https://www.knfilters.com/search?query=cb750+pod","trackingUrl":"https://www.knfilters.com/search?query=cb750+pod","x":0.60,"y":0.60,"source":"web","category":"Engine"}
]'::jsonb
WHERE id = 'c0000012-0000-0000-0000-000000000012';

-- c0000013 "My favorite kind of therapy 🌅" — sunset ride shot
UPDATE public.posts SET linked_products = '[
  {"id":"e1130001-0000-0000-0000-000000000001","title":"Clubman Clip-On Handlebars — Honda CB750","brand":"Cognimoto","rawUrl":"https://cognimoto.com/products/clubman-clip-ons","trackingUrl":"https://cognimoto.com/products/clubman-clip-ons","x":0.35,"y":0.28,"source":"web","category":"Controls"},
  {"id":"e1130002-0000-0000-0000-000000000001","title":"Dunlop TT100 GP Classic Tires","brand":"Dunlop","rawUrl":"https://www.dunlopmotorcycle.com/tires/tt100-gp/","trackingUrl":"https://www.dunlopmotorcycle.com/tires/tt100-gp/","x":0.20,"y":0.78,"source":"web","category":"Wheels & Tires"},
  {"id":"e1130003-0000-0000-0000-000000000001","title":"K&N Pod Air Filter Set — Honda CB750","brand":"K&N","rawUrl":"https://www.knfilters.com/search?query=cb750+pod","trackingUrl":"https://www.knfilters.com/search?query=cb750+pod","x":0.50,"y":0.55,"source":"web","category":"Engine"}
]'::jsonb
WHERE id = 'c0000013-0000-0000-0000-000000000013';

-- ── investomoto — Desert Rat (2020 BMW R nineT) ────────────────────────────

-- c0000014 "A work in progress..." — caption lists all mods explicitly
UPDATE public.posts SET linked_products = '[
  {"id":"e1140001-0000-0000-0000-000000000001","title":"Touratech Fork Spring Kit — BMW R nineT","brand":"Touratech","rawUrl":"https://touratech.com/Product/Fork-Spring-Kit-BMW-R-nineT","trackingUrl":"https://touratech.com/Product/Fork-Spring-Kit-BMW-R-nineT","x":0.30,"y":0.25,"source":"web","category":"Suspension"},
  {"id":"e1140002-0000-0000-0000-000000000001","title":"Wilbers 640 Road Rear Shock Absorber","brand":"Wilbers","rawUrl":"https://www.wilbers.de/en/shocks/640-road/","trackingUrl":"https://www.wilbers.de/en/shocks/640-road/","x":0.65,"y":0.60,"source":"web","category":"Suspension"},
  {"id":"e1140003-0000-0000-0000-000000000001","title":"Motoz Tractionator Adventure Tires","brand":"Motoz","rawUrl":"https://motoz.com.au/product-category/tractionator-adventure/","trackingUrl":"https://motoz.com.au/product-category/tractionator-adventure/","x":0.18,"y":0.82,"source":"web","category":"Wheels & Tires"},
  {"id":"e1140004-0000-0000-0000-000000000001","title":"SW-Motech Crash Bars — BMW R nineT","brand":"SW-Motech","rawUrl":"https://sw-motech.com/en/products/body/engine+protectors/","trackingUrl":"https://sw-motech.com/en/products/body/engine+protectors/","x":0.48,"y":0.65,"source":"web","category":"Frame & Body"},
  {"id":"e1140005-0000-0000-0000-000000000001","title":"Quad Lock Motorcycle Phone Mount Kit","brand":"Quad Lock","rawUrl":"https://www.quadlockcase.com/collections/shop-mounts/products/motorcycle-mount","trackingUrl":"https://www.quadlockcase.com/collections/shop-mounts/products/motorcycle-mount","x":0.45,"y":0.32,"source":"web","category":"Electrical"}
]'::jsonb
WHERE id = 'c0000014-0000-0000-0000-000000000014';

-- c0000015 "The Project Bike Returns." — full bike reveal, ready to ride
UPDATE public.posts SET linked_products = '[
  {"id":"e1150001-0000-0000-0000-000000000001","title":"Akrapovic Slip-On Line Exhaust — BMW R nineT","brand":"Akrapovic","rawUrl":"https://www.akrapovic.com/en/product/motorcycle/bmw-r-ninet/","trackingUrl":"https://www.akrapovic.com/en/product/motorcycle/bmw-r-ninet/","x":0.80,"y":0.65,"source":"web","category":"Exhaust"},
  {"id":"e1150002-0000-0000-0000-000000000001","title":"Wunderlich Bar Riser Kit 25mm — R nineT","brand":"Wunderlich","rawUrl":"https://www.wunderlich.de/en/bmw-r-ninet/handlebars/bar-risers/","trackingUrl":"https://www.wunderlich.de/en/bmw-r-ninet/handlebars/bar-risers/","x":0.40,"y":0.28,"source":"web","category":"Controls"},
  {"id":"e1150003-0000-0000-0000-000000000001","title":"Motogadget Motoscope Mini Digital Gauge","brand":"Motogadget","rawUrl":"https://motogadget.com/en/motoscope-mini.html","trackingUrl":"https://motogadget.com/en/motoscope-mini.html","x":0.48,"y":0.32,"source":"web","category":"Electrical"}
]'::jsonb
WHERE id = 'c0000015-0000-0000-0000-000000000015';

-- ── seven11moto — The Anniversary (2022 Yamaha XSR900) ────────────────────

-- c0000016 "View from behind 🍑 Working on a new tail tidy setup..."
UPDATE public.posts SET linked_products = '[
  {"id":"e1160001-0000-0000-0000-000000000001","title":"Spark Exhaust Moto-GP RKT Full System — XSR900","brand":"Spark Exhaust","rawUrl":"https://www.spark-exhaust.com/en/yamaha/xsr900.html","trackingUrl":"https://www.spark-exhaust.com/en/yamaha/xsr900.html","x":0.75,"y":0.65,"source":"web","category":"Exhaust"},
  {"id":"e1160002-0000-0000-0000-000000000001","title":"Rizoma Stealth Bar-End Mirrors","brand":"Rizoma","rawUrl":"https://www.rizoma.com/en/catalog/stealth-mirror","trackingUrl":"https://www.rizoma.com/en/catalog/stealth-mirror","x":0.20,"y":0.28,"source":"web","category":"Controls"},
  {"id":"e1160003-0000-0000-0000-000000000001","title":"Fastersons XSR900 Patch Set","brand":"Fastersons","rawUrl":"https://fastersons.com/collections/patches","trackingUrl":"https://fastersons.com/collections/patches","x":0.55,"y":0.50,"source":"web","category":"Paint & Finish"},
  {"id":"e1160004-0000-0000-0000-000000000001","title":"Evotech Performance Tail Tidy — Yamaha XSR900","brand":"Evotech Performance","rawUrl":"https://www.evotechperformance.com/yamaha/xsr-900/tail-tidy/","trackingUrl":"https://www.evotechperformance.com/yamaha/xsr-900/tail-tidy/","x":0.60,"y":0.72,"source":"web","category":"Frame & Body"}
]'::jsonb
WHERE id = 'c0000016-0000-0000-0000-000000000016';

-- c0000017 "Making the most of late evenings and riding when I can! 🖤⚡" — dusk ride
UPDATE public.posts SET linked_products = '[
  {"id":"e1170001-0000-0000-0000-000000000001","title":"Spark Exhaust Moto-GP RKT Full System — XSR900","brand":"Spark Exhaust","rawUrl":"https://www.spark-exhaust.com/en/yamaha/xsr900.html","trackingUrl":"https://www.spark-exhaust.com/en/yamaha/xsr900.html","x":0.78,"y":0.65,"source":"web","category":"Exhaust"},
  {"id":"e1170002-0000-0000-0000-000000000001","title":"Rizoma Rider Footpeg Kit — XSR900","brand":"Rizoma","rawUrl":"https://www.rizoma.com/en/catalog/footpegs","trackingUrl":"https://www.rizoma.com/en/catalog/footpegs","x":0.40,"y":0.75,"source":"web","category":"Controls"},
  {"id":"e1170003-0000-0000-0000-000000000001","title":"GIVI D2145ST Windshield — Yamaha XSR900","brand":"GIVI","rawUrl":"https://www.givi.it/en/products/screens/specific-screens/D2145ST/","trackingUrl":"https://www.givi.it/en/products/screens/specific-screens/D2145ST/","x":0.50,"y":0.28,"source":"web","category":"Front End"}
]'::jsonb
WHERE id = 'c0000017-0000-0000-0000-000000000017';

-- ── retroscrambler_ — The Retro (2019 Triumph Street Scrambler) ───────────

-- c0000018 "Escaping to the outskirts — open roads... Arrow exhaust." — road shot
UPDATE public.posts SET linked_products = '[
  {"id":"e1180001-0000-0000-0000-000000000001","title":"Triumph High Pipe Exhaust Kit — Street Scrambler","brand":"Triumph","rawUrl":"https://www.triumphmotorcycles.com/accessories/scrambler-900/exhaust","trackingUrl":"https://www.triumphmotorcycles.com/accessories/scrambler-900/exhaust","x":0.72,"y":0.60,"source":"web","category":"Exhaust"},
  {"id":"e1180002-0000-0000-0000-000000000001","title":"Continental TKC80 Twinduro Tires","brand":"Continental","rawUrl":"https://www.continental-tires.com/motorcycle/tires/on-off-road/tkc-80","trackingUrl":"https://www.continental-tires.com/motorcycle/tires/on-off-road/tkc-80","x":0.20,"y":0.80,"source":"web","category":"Wheels & Tires"},
  {"id":"e1180003-0000-0000-0000-000000000001","title":"Pyramid Plastics Belly Pan — Street Scrambler","brand":"Pyramid Plastics","rawUrl":"https://www.pyramidplastics.co.uk/triumph/scrambler/","trackingUrl":"https://www.pyramidplastics.co.uk/triumph/scrambler/","x":0.50,"y":0.75,"source":"web","category":"Frame & Body"},
  {"id":"e1180004-0000-0000-0000-000000000001","title":"Overland Bespoke Leather Seat","brand":"Overland","rawUrl":"","trackingUrl":"","x":0.55,"y":0.55,"source":"manual","category":"Frame & Body"}
]'::jsonb
WHERE id = 'c0000018-0000-0000-0000-000000000018';

-- c0000019 "Gotta love industrial environments — clean lines, minimal color palette."
UPDATE public.posts SET linked_products = '[
  {"id":"e1190001-0000-0000-0000-000000000001","title":"Triumph High Pipe Exhaust Kit — Street Scrambler","brand":"Triumph","rawUrl":"https://www.triumphmotorcycles.com/accessories/scrambler-900/exhaust","trackingUrl":"https://www.triumphmotorcycles.com/accessories/scrambler-900/exhaust","x":0.75,"y":0.62,"source":"web","category":"Exhaust"},
  {"id":"e1190002-0000-0000-0000-000000000001","title":"Overland Bespoke Leather Seat","brand":"Overland","rawUrl":"","trackingUrl":"","x":0.50,"y":0.52,"source":"manual","category":"Frame & Body"},
  {"id":"e1190003-0000-0000-0000-000000000001","title":"Continental TKC80 Twinduro Tires","brand":"Continental","rawUrl":"https://www.continental-tires.com/motorcycle/tires/on-off-road/tkc-80","trackingUrl":"https://www.continental-tires.com/motorcycle/tires/on-off-road/tkc-80","x":0.22,"y":0.82,"source":"web","category":"Wheels & Tires"}
]'::jsonb
WHERE id = 'c0000019-0000-0000-0000-000000000019';

-- ── coldbrewmoto — Cold Brew (2023 Indian FTR Carbon R) ───────────────────

-- c0000020 "Build update — Brembo master, Woodcraft rear sets, repainted panels."
UPDATE public.posts SET linked_products = '[
  {"id":"e1200001-0000-0000-0000-000000000001","title":"Brembo M50 Monobloc Brake Calipers","brand":"Brembo","rawUrl":"https://www.brembo.com/en/bike/products/brake-calipers/monobloc-calipers/m50","trackingUrl":"https://www.brembo.com/en/bike/products/brake-calipers/monobloc-calipers/m50","x":0.22,"y":0.72,"source":"web","category":"Front End"},
  {"id":"e1200002-0000-0000-0000-000000000001","title":"Woodcraft Technologies Rearsets — Indian FTR","brand":"Woodcraft","rawUrl":"https://www.woodcrafttech.com/indian-ftr/","trackingUrl":"https://www.woodcrafttech.com/indian-ftr/","x":0.60,"y":0.75,"source":"web","category":"Controls"},
  {"id":"e1200003-0000-0000-0000-000000000001","title":"Akrapovic Racing Full Titanium Exhaust — FTR","brand":"Akrapovic","rawUrl":"https://www.akrapovic.com/en/product/motorcycle/indian-ftr/","trackingUrl":"https://www.akrapovic.com/en/product/motorcycle/indian-ftr/","x":0.78,"y":0.65,"source":"web","category":"Exhaust"},
  {"id":"e1200004-0000-0000-0000-000000000001","title":"Öhlins FGR 300 Front Suspension Kit","brand":"Öhlins","rawUrl":"https://www.ohlins.com/motorcycle/forks/fgr-300/","trackingUrl":"https://www.ohlins.com/motorcycle/forks/fgr-300/","x":0.32,"y":0.30,"source":"web","category":"Suspension"}
]'::jsonb
WHERE id = 'c0000020-0000-0000-0000-000000000020';

-- ── motozuc — The Thunderbird Jr. (2020 Triumph Bonneville T120) ──────────

-- c0000021 "Dirt roads 🏍" — gravel/dirt road adventure shot
UPDATE public.posts SET linked_products = '[
  {"id":"e1210001-0000-0000-0000-000000000001","title":"British Customs Predator Exhaust — Bonneville T120","brand":"British Customs","rawUrl":"https://britishcustoms.com/collections/t120/exhaust","trackingUrl":"https://britishcustoms.com/collections/t120/exhaust","x":0.78,"y":0.65,"source":"web","category":"Exhaust"},
  {"id":"e1210002-0000-0000-0000-000000000001","title":"Barkbusters Storm Handguards","brand":"Barkbusters","rawUrl":"https://www.barkbusters.com.au/products/storm/","trackingUrl":"https://www.barkbusters.com.au/products/storm/","x":0.25,"y":0.28,"source":"web","category":"Controls"},
  {"id":"e1210003-0000-0000-0000-000000000001","title":"Motone Customs Speedo Surround — Bonneville","brand":"Motone Customs","rawUrl":"https://motonecustoms.com/collections/gauges/bonneville/","trackingUrl":"https://motonecustoms.com/collections/gauges/bonneville/","x":0.48,"y":0.30,"source":"web","category":"Electrical"}
]'::jsonb
WHERE id = 'c0000021-0000-0000-0000-000000000021';

-- c0000022 "The Thunderbird Jr. and me — we both started on British iron."
UPDATE public.posts SET linked_products = '[
  {"id":"e1220001-0000-0000-0000-000000000001","title":"British Customs Predator Exhaust — Bonneville T120","brand":"British Customs","rawUrl":"https://britishcustoms.com/collections/t120/exhaust","trackingUrl":"https://britishcustoms.com/collections/t120/exhaust","x":0.80,"y":0.65,"source":"web","category":"Exhaust"},
  {"id":"e1220002-0000-0000-0000-000000000001","title":"Skidmarx Classic Screen — Bonneville T120","brand":"Skidmarx","rawUrl":"https://www.skidmarx.co.uk/triumph/bonneville-t120/","trackingUrl":"https://www.skidmarx.co.uk/triumph/bonneville-t120/","x":0.50,"y":0.22,"source":"web","category":"Front End"},
  {"id":"e1220003-0000-0000-0000-000000000001","title":"Triumph Accessories Pannier Rack & Bag Set","brand":"Triumph","rawUrl":"https://www.triumphmotorcycles.com/accessories/bonneville-t120/luggage","trackingUrl":"https://www.triumphmotorcycles.com/accessories/bonneville-t120/luggage","x":0.60,"y":0.52,"source":"web","category":"Frame & Body"}
]'::jsonb
WHERE id = 'c0000022-0000-0000-0000-000000000022';

COMMIT;
