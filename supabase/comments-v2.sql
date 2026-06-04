-- ============================================================
-- Throttlist — Build-scoped comments + comment likes
-- Run in Supabase SQL editor after notifications.sql
-- ============================================================

-- 1. Allow comments to be scoped to a build (not just a post)
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS build_id UUID REFERENCES public.builds(id) ON DELETE CASCADE;

-- Make post_id nullable so build-scoped comments don't need a post_id
ALTER TABLE public.comments ALTER COLUMN post_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS comments_build_id_idx ON public.comments(build_id);

-- 2. comment_likes — tracks which users have liked which comments
CREATE TABLE IF NOT EXISTS public.comment_likes (
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, comment_id)
);

CREATE INDEX IF NOT EXISTS comment_likes_comment_id_idx ON public.comment_likes(comment_id);

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read comment likes" ON public.comment_likes;
CREATE POLICY "Anyone can read comment likes"
  ON public.comment_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can toggle their own comment likes" ON public.comment_likes;
CREATE POLICY "Users can toggle their own comment likes"
  ON public.comment_likes FOR ALL USING (auth.uid() = user_id);

-- 3. Add like_count to comments (maintained by triggers below)
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0 NOT NULL;

-- Trigger: increment like_count on insert
CREATE OR REPLACE FUNCTION public.handle_comment_like_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comment_like_insert ON public.comment_likes;
CREATE TRIGGER trg_comment_like_insert
  AFTER INSERT ON public.comment_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_like_insert();

-- Trigger: decrement like_count on delete
CREATE OR REPLACE FUNCTION public.handle_comment_like_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.comments SET like_count = GREATEST(0, like_count - 1) WHERE id = NEW.comment_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_comment_like_delete ON public.comment_likes;
CREATE TRIGGER trg_comment_like_delete
  AFTER DELETE ON public.comment_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_like_delete();
