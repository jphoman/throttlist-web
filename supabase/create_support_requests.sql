-- Support / contact form submissions
CREATE TABLE IF NOT EXISTS support_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  name        text NOT NULL,
  email       text NOT NULL,
  subject     text NOT NULL,
  message     text NOT NULL,
  status      text NOT NULL DEFAULT 'open',  -- open | answered | closed
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Only admins / service role should read rows; logged-in users can insert their own
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit support requests"
  ON support_requests FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their own requests"
  ON support_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
