/**
 * Creates the 'posts' storage bucket and RLS policies in Supabase.
 * Run with your service role key:
 *   SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/setup-storage.mjs
 */

const SUPABASE_URL = 'https://ypptiyhbwzgzheqkvazo.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY env var is required.')
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/setup-storage.mjs')
  process.exit(1)
}

async function sql(query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })
  // exec_sql may not exist; fall back to pg REST
  return res
}

async function runSQL(statements) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ query: statements }),
  })
  return res
}

// Use the Management API to run SQL
async function execSQL(sql) {
  const projectRef = 'ypptiyhbwzgzheqkvazo'
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })
  const text = await res.text()
  return { status: res.status, body: text }
}

// Alternatively use the Supabase Storage API directly
async function createBucket() {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: 'posts', name: 'posts', public: true }),
  })
  const json = await res.json()
  return { status: res.status, json }
}

async function main() {
  console.log('Creating "posts" storage bucket...')
  const bucket = await createBucket()
  if (bucket.status === 200 || bucket.status === 201) {
    console.log('✓ Bucket created')
  } else if (bucket.json?.error === 'Duplicate') {
    console.log('✓ Bucket already exists — updating to public...')
    // Update to ensure it's public
    const upd = await fetch(`${SUPABASE_URL}/storage/v1/bucket/posts`, {
      method: 'PUT',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ public: true }),
    })
    console.log(upd.status === 200 ? '✓ Bucket updated to public' : `  PUT /bucket/posts → ${upd.status}`)
  } else {
    console.error('  Bucket create response:', JSON.stringify(bucket.json))
  }

  console.log('\nCreating storage policies via SQL...')
  const policies = `
-- Allow authenticated users to upload to their own folder
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can upload their own posts'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can upload their own posts" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''posts'' AND auth.uid()::text = (storage.foldername(name))[1])';
  END IF;
END $$;

-- Allow public to read post photos
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Public can read posts'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can read posts" ON storage.objects FOR SELECT TO public USING (bucket_id = ''posts'')';
  END IF;
END $$;

-- Allow users to delete their own uploads
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can delete their own posts'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete their own posts" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = ''posts'' AND auth.uid()::text = (storage.foldername(name))[1])';
  END IF;
END $$;

-- Ensure posts table allows authenticated inserts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='posts' AND policyname='Authenticated users can create posts'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can create posts" ON posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;
`

  const result = await execSQL(policies)
  if (result.status === 200 || result.status === 201) {
    console.log('✓ Storage policies created')
    console.log('\nAll done! Photo uploads should work now.')
  } else {
    console.log(`  Management API response (${result.status}): ${result.body}`)
    console.log('\nIf the above failed, paste this SQL into Supabase SQL Editor manually:')
    console.log('─'.repeat(60))
    console.log(policies)
  }
}

main().catch(console.error)
