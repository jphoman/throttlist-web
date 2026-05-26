-- Fix missing auth.identities rows for seed users.
-- Run once in the Supabase SQL Editor.
--
-- Background: inserting directly into auth.users does not auto-populate
-- auth.identities, which GoTrue (Supabase auth) requires to complete any
-- sign-in. Without it, /auth/v1/token returns 500 "Database error querying
-- schema" for every seed account.
--
-- This script detects whether the newer GoTrue schema (provider_id PK) or the
-- older schema (id PK) is in use and runs the correct INSERT accordingly.

BEGIN;

DO $$
DECLARE
  use_new_schema boolean;
BEGIN

  -- Detect schema version: newer GoTrue uses a "provider_id" column.
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'auth'
      AND table_name   = 'identities'
      AND column_name  = 'provider_id'
  ) INTO use_new_schema;

  IF use_new_schema THEN
    -- ── Newer GoTrue schema (PRIMARY KEY (provider, provider_id)) ──────────
    INSERT INTO auth.identities
      (id, provider_id, user_id, identity_data, provider,
       last_sign_in_at, created_at, updated_at)
    VALUES
      (gen_random_uuid(), 'cappuccinomoto@throttlist.app',
       'a0000001-0000-0000-0000-000000000001',
       '{"sub":"a0000001-0000-0000-0000-000000000001","email":"cappuccinomoto@throttlist.app","email_verified":true,"phone_verified":false}',
       'email', now(), now(), now()),

      (gen_random_uuid(), 'investomoto@throttlist.app',
       'a0000002-0000-0000-0000-000000000002',
       '{"sub":"a0000002-0000-0000-0000-000000000002","email":"investomoto@throttlist.app","email_verified":true,"phone_verified":false}',
       'email', now(), now(), now()),

      (gen_random_uuid(), 'motofeel@throttlist.app',
       'a0000003-0000-0000-0000-000000000003',
       '{"sub":"a0000003-0000-0000-0000-000000000003","email":"motofeel@throttlist.app","email_verified":true,"phone_verified":false}',
       'email', now(), now(), now()),

      (gen_random_uuid(), 'retroscrambler@throttlist.app',
       'a0000004-0000-0000-0000-000000000004',
       '{"sub":"a0000004-0000-0000-0000-000000000004","email":"retroscrambler@throttlist.app","email_verified":true,"phone_verified":false}',
       'email', now(), now(), now()),

      (gen_random_uuid(), 'seven11moto@throttlist.app',
       'a0000005-0000-0000-0000-000000000005',
       '{"sub":"a0000005-0000-0000-0000-000000000005","email":"seven11moto@throttlist.app","email_verified":true,"phone_verified":false}',
       'email', now(), now(), now()),

      (gen_random_uuid(), 'thecrocodile@throttlist.app',
       'a0000006-0000-0000-0000-000000000006',
       '{"sub":"a0000006-0000-0000-0000-000000000006","email":"thecrocodile@throttlist.app","email_verified":true,"phone_verified":false}',
       'email', now(), now(), now()),

      (gen_random_uuid(), 'motozuc@throttlist.app',
       'a0000007-0000-0000-0000-000000000007',
       '{"sub":"a0000007-0000-0000-0000-000000000007","email":"motozuc@throttlist.app","email_verified":true,"phone_verified":false}',
       'email', now(), now(), now()),

      (gen_random_uuid(), 'coldbrewmoto@throttlist.app',
       'a0000008-0000-0000-0000-000000000008',
       '{"sub":"a0000008-0000-0000-0000-000000000008","email":"coldbrewmoto@throttlist.app","email_verified":true,"phone_verified":false}',
       'email', now(), now(), now())

    ON CONFLICT (provider, provider_id) DO NOTHING;

    RAISE NOTICE 'Inserted auth.identities using newer GoTrue schema (provider_id PK).';

  ELSE
    -- ── Older GoTrue schema (PRIMARY KEY (provider, id)) ───────────────────
    INSERT INTO auth.identities
      (id, user_id, identity_data, provider,
       last_sign_in_at, created_at, updated_at)
    VALUES
      ('cappuccinomoto@throttlist.app',
       'a0000001-0000-0000-0000-000000000001',
       '{"sub":"a0000001-0000-0000-0000-000000000001","email":"cappuccinomoto@throttlist.app","email_verified":true,"phone_verified":false}',
       'email', now(), now(), now()),

      ('investomoto@throttlist.app',
       'a0000002-0000-0000-0000-000000000002',
       '{"sub":"a0000002-0000-0000-0000-000000000002","email":"investomoto@throttlist.app","email_verified":true,"phone_verified":false}',
       'email', now(), now(), now()),

      ('motofeel@throttlist.app',
       'a0000003-0000-0000-0000-000000000003',
       '{"sub":"a0000003-0000-0000-0000-000000000003","email":"motofeel@throttlist.app","email_verified":true,"phone_verified":false}',
       'email', now(), now(), now()),

      ('retroscrambler@throttlist.app',
       'a0000004-0000-0000-0000-000000000004',
       '{"sub":"a0000004-0000-0000-0000-000000000004","email":"retroscrambler@throttlist.app","email_verified":true,"phone_verified":false}',
       'email', now(), now(), now()),

      ('seven11moto@throttlist.app',
       'a0000005-0000-0000-0000-000000000005',
       '{"sub":"a0000005-0000-0000-0000-000000000005","email":"seven11moto@throttlist.app","email_verified":true,"phone_verified":false}',
       'email', now(), now(), now()),

      ('thecrocodile@throttlist.app',
       'a0000006-0000-0000-0000-000000000006',
       '{"sub":"a0000006-0000-0000-0000-000000000006","email":"thecrocodile@throttlist.app","email_verified":true,"phone_verified":false}',
       'email', now(), now(), now()),

      ('motozuc@throttlist.app',
       'a0000007-0000-0000-0000-000000000007',
       '{"sub":"a0000007-0000-0000-0000-000000000007","email":"motozuc@throttlist.app","email_verified":true,"phone_verified":false}',
       'email', now(), now(), now()),

      ('coldbrewmoto@throttlist.app',
       'a0000008-0000-0000-0000-000000000008',
       '{"sub":"a0000008-0000-0000-0000-000000000008","email":"coldbrewmoto@throttlist.app","email_verified":true,"phone_verified":false}',
       'email', now(), now(), now())

    ON CONFLICT (provider, id) DO NOTHING;

    RAISE NOTICE 'Inserted auth.identities using older GoTrue schema (id PK).';

  END IF;

END $$;

COMMIT;
