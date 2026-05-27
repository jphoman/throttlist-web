-- ─── Product Tags ────────────────────────────────────────────────────────────
-- Stores every product tagged in a post with full attribution data.
-- linked_products JSONB on the posts table stays as the source-of-truth for
-- the app UI; this table provides the analytics/payout layer on top.
--
-- Run in Supabase SQL editor.

create table if not exists product_tags (
  id                uuid        default gen_random_uuid() primary key,
  user_id           uuid        references profiles(id) on delete cascade not null,
  build_id          uuid        references builds(id)   on delete set null,
  post_id           uuid        references posts(id)    on delete set null,
  tracking_id       text        not null,
  product_url       text        not null,
  affiliate_url     text        not null,
  product_title     text        not null,
  source_domain     text,
  category          text,
  created_at        timestamptz default now()
);

alter table product_tags enable row level security;

create policy "product_tags_owner_insert"
  on product_tags for insert
  with check (user_id = auth.uid());

create policy "product_tags_owner_select"
  on product_tags for select
  using (user_id = auth.uid());

create policy "product_tags_owner_update"
  on product_tags for update
  using    (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── Affiliate Conversions (future payout tracking) ──────────────────────────
-- Populated when a click on an affiliate link converts to a purchase.
-- Left empty for now; the tracking_id in product_tags links everything.

create table if not exists affiliate_conversions (
  id                uuid        default gen_random_uuid() primary key,
  tracking_id       text        not null references product_tags(tracking_id) on delete cascade,
  user_id           uuid        references profiles(id) on delete set null,
  build_id          uuid        references builds(id)   on delete set null,
  click_timestamp   timestamptz default now(),
  conversion_status text        default 'pending',   -- pending | confirmed | paid
  commission_amount numeric(10,2),
  notes             text,
  created_at        timestamptz default now()
);

alter table affiliate_conversions enable row level security;

-- Only service-role (admin) should write conversions; users can read their own.
create policy "affiliate_conversions_owner_select"
  on affiliate_conversions for select
  using (user_id = auth.uid());
