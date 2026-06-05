-- ============================================================
-- Throttlist — Auto-maintain posts.comment_count via triggers
-- Run in Supabase SQL editor
-- This replaces the broken client-side rpc('increment') calls
-- ============================================================

-- Trigger function: increment comment_count when a post comment is inserted
CREATE OR REPLACE FUNCTION public.handle_comment_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Only count comments on posts (post_id NOT NULL), not build-scoped comments
  IF NEW.post_id IS NOT NULL THEN
    UPDATE public.posts
    SET comment_count = COALESCE(comment_count, 0) + 1
    WHERE id = NEW.post_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger function: decrement comment_count when a post comment is deleted
CREATE OR REPLACE FUNCTION public.handle_comment_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.post_id IS NOT NULL THEN
    UPDATE public.posts
    SET comment_count = GREATEST(0, COALESCE(comment_count, 0) - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_comment_insert ON public.comments;
CREATE TRIGGER trg_comment_insert
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_insert();

DROP TRIGGER IF EXISTS trg_comment_delete ON public.comments;
CREATE TRIGGER trg_comment_delete
  AFTER DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_delete();
