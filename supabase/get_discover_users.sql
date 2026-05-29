-- Weighted discover-user ranking over a rolling 14-day window.
--
-- Weights (per interaction):
--   tag click  × 10   (highest — affiliate intent signal)
--   comment    ×  5
--   follow     ×  3
--   like       ×  2
--   view       ×  1   (lowest — passive signal)

create or replace function get_discover_users(
  p_limit           int     default 20,
  p_exclude_user_id uuid    default null
)
returns table (
  id                uuid,
  username          text,
  display_name      text,
  avatar_url        text,
  bio               text,
  location          text,
  instagram_handle  text,
  youtube_handle    text,
  website_url       text,
  website_title     text,
  is_pro            boolean,
  created_at        timestamptz,
  top_build_ids     uuid[],
  interaction_score numeric
)
language sql
stable
as $$
  with
  -- ── 14-day window anchor ─────────────────────────────────────────────────────
  w as (select now() - interval '14 days' as ts),

  -- ── Tag clicks on each user's posts (× 10) ──────────────────────────────────
  tclicks as (
    select pt.user_id, count(*) as cnt
    from   tag_click_events tc
    join   posts pt on pt.id = tc.post_id
    where  tc.created_at >= (select ts from w)
    group  by pt.user_id
  ),

  -- ── Comments on each user's posts (× 5) ─────────────────────────────────────
  coms as (
    select pt.user_id, count(*) as cnt
    from   comments c
    join   posts pt on pt.id = c.post_id
    where  c.created_at >= (select ts from w)
    group  by pt.user_id
  ),

  -- ── Follows on each user's builds (× 3) ─────────────────────────────────────
  follows as (
    select b.user_id, count(*) as cnt
    from   build_follows bf
    join   builds b on b.id = bf.build_id
    where  bf.created_at >= (select ts from w)
    group  by b.user_id
  ),

  -- ── Likes on each user's posts (× 2) ────────────────────────────────────────
  lks as (
    select pt.user_id, count(*) as cnt
    from   likes l
    join   posts pt on pt.id = l.post_id
    where  l.created_at >= (select ts from w)
    group  by pt.user_id
  ),

  -- ── Views on each user's posts (× 1) ────────────────────────────────────────
  vws as (
    select pt.user_id, count(*) as cnt
    from   views v
    join   posts pt on pt.id = v.post_id
    where  v.created_at >= (select ts from w)
    group  by pt.user_id
  )

  select
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.location,
    p.instagram_handle,
    p.youtube_handle,
    p.website_url,
    p.website_title,
    p.is_pro,
    p.created_at,
    p.top_build_ids,
    (
      coalesce(tclicks.cnt, 0) * 10
    + coalesce(coms.cnt,    0) *  5
    + coalesce(follows.cnt, 0) *  3
    + coalesce(lks.cnt,     0) *  2
    + coalesce(vws.cnt,     0) *  1
    )::numeric as interaction_score
  from   profiles p
  left join tclicks on tclicks.user_id = p.id
  left join coms    on coms.user_id    = p.id
  left join follows on follows.user_id = p.id
  left join lks     on lks.user_id     = p.id
  left join vws     on vws.user_id     = p.id
  where  p.username is not null
    and  (p_exclude_user_id is null or p.id != p_exclude_user_id)
  order  by interaction_score desc, p.created_at desc
  limit  p_limit;
$$;
