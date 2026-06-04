-- ============================================================
-- Throttlist — Notifications system
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID       NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id     UUID       NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL CHECK (type IN ('like', 'comment', 'follow')),
  target_type TEXT        CHECK (target_type IN ('post', 'build')),
  target_id   TEXT,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS notifications_recipient_created_idx
  ON public.notifications (recipient_id, created_at DESC);

-- 2. Row-level security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Recipients can read own notifications" ON public.notifications;
CREATE POLICY "Recipients can read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Recipients can mark own notifications read" ON public.notifications;
CREATE POLICY "Recipients can mark own notifications read"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = recipient_id);

-- Service-role only for INSERTs (triggers run as SECURITY DEFINER)
DROP POLICY IF EXISTS "Triggers can insert notifications" ON public.notifications;
CREATE POLICY "Triggers can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- 3. Add notification-preference columns to profiles (no-op if already present)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_likes     BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notify_comments  BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notify_follows   BOOLEAN DEFAULT TRUE;

-- 4. Trigger: like created → notify post owner
CREATE OR REPLACE FUNCTION public.handle_new_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_owner UUID;
BEGIN
  SELECT user_id INTO v_owner FROM public.posts WHERE id = NEW.post_id;
  -- skip if post not found or actor is the owner
  IF v_owner IS NULL OR v_owner = NEW.user_id THEN RETURN NEW; END IF;
  -- respect owner's preference
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = v_owner AND notify_likes = TRUE
  ) THEN RETURN NEW; END IF;
  INSERT INTO public.notifications (recipient_id, actor_id, type, target_type, target_id)
  VALUES (v_owner, NEW.user_id, 'like', 'post', NEW.post_id::TEXT);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_like_created ON public.likes;
CREATE TRIGGER trg_like_created
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_like();

-- 5. Trigger: comment created → notify post owner
CREATE OR REPLACE FUNCTION public.handle_new_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_owner UUID;
BEGIN
  SELECT user_id INTO v_owner FROM public.posts WHERE id = NEW.post_id;
  IF v_owner IS NULL OR v_owner = NEW.user_id THEN RETURN NEW; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = v_owner AND notify_comments = TRUE
  ) THEN RETURN NEW; END IF;
  INSERT INTO public.notifications (recipient_id, actor_id, type, target_type, target_id)
  VALUES (v_owner, NEW.user_id, 'comment', 'post', NEW.post_id::TEXT);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comment_created ON public.comments;
CREATE TRIGGER trg_comment_created
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_comment();

-- 6. Trigger: build follow created → notify build owner
CREATE OR REPLACE FUNCTION public.handle_new_build_follow()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_owner UUID;
BEGIN
  SELECT user_id INTO v_owner FROM public.builds WHERE id = NEW.build_id;
  IF v_owner IS NULL OR v_owner = NEW.follower_id THEN RETURN NEW; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = v_owner AND notify_follows = TRUE
  ) THEN RETURN NEW; END IF;
  INSERT INTO public.notifications (recipient_id, actor_id, type, target_type, target_id)
  VALUES (v_owner, NEW.follower_id, 'follow', 'build', NEW.build_id::TEXT);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_build_follow_created ON public.build_follows;
CREATE TRIGGER trg_build_follow_created
  AFTER INSERT ON public.build_follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_build_follow();

-- 7. Enable Realtime on notifications so the app can subscribe
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
