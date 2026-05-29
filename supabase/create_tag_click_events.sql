-- Tag click events: fired whenever a user taps a product/affiliate link in a post
create table if not exists tag_click_events (
  id          uuid         default gen_random_uuid() primary key,
  post_id     uuid         references posts(id) on delete cascade not null,
  build_id    uuid         references builds(id) on delete set null,
  user_id     uuid         references profiles(id) on delete set null,
  product_url text,
  created_at  timestamptz  default now()
);

alter table tag_click_events enable row level security;

-- Anyone (anon + authed) can insert a click — no friction on tracking
create policy "tag_clicks_anyone_insert"
  on tag_click_events for insert with check (true);

-- Reads are public (needed for RPC aggregations)
create policy "tag_clicks_public_read"
  on tag_click_events for select using (true);

-- Index for the 14-day window aggregation
create index if not exists tag_click_events_post_id_created
  on tag_click_events (post_id, created_at desc);

create index if not exists tag_click_events_created
  on tag_click_events (created_at desc);
