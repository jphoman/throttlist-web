-- For You Feed — scored recommendation function
-- Run once in the Supabase SQL Editor.
--
-- Algorithm weights (tunable at the bottom of the CTE chain):
--   50%  engagement   — LN(1 + likes + comments×3 + views×0.05)  log-scale
--   30%  social       — fraction of your network that follows this build
--   20%  affinity     — how much this build type matches your 30-day history
--   ×    spike        — bonus for posts gaining traction in the last 24 h
--   ×    follow boost — 1.3× for builds you already follow
--   ×    recency      — exponential decay, half-life ≈ 48 h
--
-- Candidate pool (union, deduped):
--   • Posts from builds you follow                  (last 14 days)
--   • Posts from builds your network follows        (last 7 days, discovery)
--   • Global trending posts                         (last 48 h, ≥5 engagement)

CREATE OR REPLACE FUNCTION public.get_for_you_feed(
  p_user_id uuid,
  p_limit   int DEFAULT 40
)
RETURNS TABLE (
  id                    uuid,
  user_id               uuid,
  build_id              uuid,
  photos                text[],
  caption               text,
  tagged_part_ids       text[],
  linked_products       jsonb,
  like_count            int,
  comment_count         int,
  view_count            int,
  is_pinned             boolean,
  created_at            timestamptz,
  username              text,
  display_name          text,
  avatar_url            text,
  is_pro                boolean,
  build_nickname        text,
  build_slug            text,
  build_year            int,
  build_make            text,
  build_model           text,
  build_type            text,
  build_cover_photo_url text,
  score                 float8,
  user_follows_build    boolean,
  mutual_followers      int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH

-- ── 1. Builds this user already follows ──────────────────────────────────────
my_builds AS (
  SELECT build_id
  FROM   build_follows
  WHERE  follower_id = p_user_id
),

-- ── 2. Users this user follows (social graph) ─────────────────────────────────
my_network AS (
  SELECT following_id AS uid
  FROM   follows
  WHERE  follower_id = p_user_id
),

-- ── 3. Builds followed by the network + mutual-follower count ─────────────────
network_builds AS (
  SELECT   bf.build_id,
           COUNT(DISTINCT bf.follower_id) AS mutual_count
  FROM     build_follows bf
  WHERE    bf.follower_id IN (SELECT uid FROM my_network)
  GROUP BY bf.build_id
),

-- ── 4. Build-type affinity from the user's last 30 days of interaction ────────
affinity_raw AS (
  -- Likes (weight 1)
  SELECT b.build_type, COUNT(*) AS n
  FROM   likes l
  JOIN   posts  p ON p.id = l.post_id
  JOIN   builds b ON b.id = p.build_id
  WHERE  l.user_id    = p_user_id
    AND  l.created_at > now() - INTERVAL '30 days'
  GROUP  BY b.build_type

  UNION ALL

  -- Comments (weight 2 — higher intent signal)
  SELECT b.build_type, COUNT(*) * 2
  FROM   comments c
  JOIN   posts  p ON p.id = c.post_id
  JOIN   builds b ON b.id = p.build_id
  WHERE  c.user_id    = p_user_id
    AND  c.created_at > now() - INTERVAL '30 days'
  GROUP  BY b.build_type
),
affinity AS (
  SELECT build_type, SUM(n) AS total
  FROM   affinity_raw
  GROUP  BY build_type
),
max_affinity AS (
  SELECT GREATEST(MAX(total), 1) AS val FROM affinity
),

-- ── 5. Trending spike — likes added in the last 24 hours ─────────────────────
spike AS (
  SELECT   post_id, COUNT(*) AS recent_likes
  FROM     likes
  WHERE    created_at > now() - INTERVAL '24 hours'
  GROUP BY post_id
),

-- ── 6. Candidate pool (three sources, unioned) ────────────────────────────────
candidates AS (

  -- Builds I already follow (last 14 days)
  SELECT p.id,
         TRUE                         AS i_follow,
         COALESCE(nb.mutual_count, 0) AS mutual
  FROM   posts p
  JOIN   my_builds       mb ON mb.build_id = p.build_id
  LEFT   JOIN network_builds nb ON nb.build_id = p.build_id
  WHERE  p.created_at > now() - INTERVAL '14 days'
    AND  p.user_id != p_user_id

  UNION

  -- Builds my network follows (discovery, last 7 days)
  SELECT p.id,
         FALSE             AS i_follow,
         nb.mutual_count   AS mutual
  FROM   posts p
  JOIN   network_builds nb ON nb.build_id = p.build_id
  WHERE  p.created_at > now() - INTERVAL '7 days'
    AND  p.user_id != p_user_id

  UNION

  -- Global trending (last 48 h, minimum engagement floor)
  SELECT p.id,
         (p.build_id IN (SELECT build_id FROM my_builds)) AS i_follow,
         COALESCE(nb.mutual_count, 0)                     AS mutual
  FROM   posts p
  LEFT   JOIN network_builds nb ON nb.build_id = p.build_id
  WHERE  p.created_at > now() - INTERVAL '48 hours'
    AND  p.user_id != p_user_id
    AND  (p.like_count + p.comment_count * 2) >= 5
),

-- ── 7. Deduplicate, keeping the strongest follow / mutual signal ──────────────
deduped AS (
  SELECT   id,
           bool_or(i_follow) AS i_follow,
           MAX(mutual)       AS mutual
  FROM     candidates
  GROUP BY id
),

-- ── 8. Join full post + profile + build data and compute signal components ────
scored AS (
  SELECT
    p.id, p.user_id, p.build_id,
    p.photos, p.caption, p.tagged_part_ids, p.linked_products,
    p.like_count, p.comment_count,
    COALESCE(p.view_count, 0) AS view_count,
    p.is_pinned, p.created_at,

    pr.username, pr.display_name, pr.avatar_url, pr.is_pro,

    b.nickname        AS build_nickname,
    b.slug            AS build_slug,
    b.year            AS build_year,
    b.make            AS build_make,
    b.model           AS build_model,
    b.build_type,
    b.cover_photo_url AS build_cover_photo_url,

    d.i_follow,
    d.mutual::int AS mutual_followers,

    -- Recency decay — exponential, half-life = 48 h (172 800 s)
    EXP(-EXTRACT(EPOCH FROM (now() - p.created_at)) / 172800.0)
      AS recency,

    -- Engagement (log scale keeps viral posts from monopolising the feed)
    LN(1 + p.like_count
         + p.comment_count * 3.0
         + COALESCE(p.view_count, 0) * 0.05)
      AS eng,

    -- Trending spike: share of total likes that arrived in the last 24 h
    COALESCE(s.recent_likes, 0)::float / GREATEST(p.like_count, 1)
      AS spike,

    -- Content affinity with the user's history (0 – 1)
    COALESCE(
      (SELECT total FROM affinity WHERE build_type = b.build_type)
        / NULLIF((SELECT val FROM max_affinity), 0),
      0.0
    ) AS affinity_score,

    -- Social signal: fraction of network following this build (0 – 1, capped at 10)
    LEAST(d.mutual::float, 10.0) / 10.0 AS social_score

  FROM  deduped d
  JOIN  posts    p  ON p.id  = d.id
  JOIN  profiles pr ON pr.id = p.user_id
  JOIN  builds   b  ON b.id  = p.build_id
  LEFT  JOIN spike s ON s.post_id = p.id
)

-- ── 9. Final select: apply composite score formula ────────────────────────────
SELECT
  id, user_id, build_id,
  photos, caption, tagged_part_ids, linked_products,
  like_count, comment_count, view_count,
  is_pinned, created_at,
  username, display_name, avatar_url, is_pro,
  build_nickname, build_slug, build_year, build_make, build_model,
  build_type, build_cover_photo_url,

  recency
    * (  eng           * 0.5   -- 50%  engagement (log-normalised)
       + social_score  * 3.0   -- 30%  social graph signal
       + affinity_score * 2.0  -- 20%  content affinity
       + spike                 -- +    trending spike bonus
    )
    * CASE WHEN i_follow THEN 1.3 ELSE 1.0 END  -- 30% boost for followed builds
    AS score,

  i_follow        AS user_follows_build,
  mutual_followers

FROM  scored
ORDER BY score DESC
LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_for_you_feed(uuid, int) TO authenticated;
