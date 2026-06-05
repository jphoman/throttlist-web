-- ============================================================
-- Throttlist — Fix messages RLS so recipients can mark as read
-- Run in Supabase SQL editor if DM unread badges won't clear
-- ============================================================

-- Allow message recipients to mark their received messages as read.
-- Without this policy, markMessagesRead() is silently rejected by RLS
-- and is_read stays false, so unread badges never clear.

DROP POLICY IF EXISTS "Recipients can mark messages as read" ON public.messages;
CREATE POLICY "Recipients can mark messages as read"
  ON public.messages
  FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);
