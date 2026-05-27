-- Ensure the builds UPDATE policy exists and is correct.
-- Run this in Supabase SQL editor if cover_photo_url changes are not persisting.
--
-- The USING clause controls which rows can be targeted.
-- The WITH CHECK clause controls whether the resulting row is allowed.
-- Both need to pass for an update to succeed.

drop policy if exists "builds_owner_update" on builds;

create policy "builds_owner_update"
  on builds
  for update
  using    (user_id = auth.uid())
  with check (user_id = auth.uid());
