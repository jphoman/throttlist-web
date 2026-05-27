-- Ensure the posts UPDATE policy has an explicit WITH CHECK clause.
-- Without it, some Postgres/PostgREST versions silently reject writes.
-- Run this in the Supabase SQL editor.

drop policy if exists "posts_owner_update" on posts;

create policy "posts_owner_update"
  on posts
  for update
  using    (user_id = auth.uid())
  with check (user_id = auth.uid());
