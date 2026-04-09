-- ============================================
-- Chat messages + rating columns (deja applique)
-- ============================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID REFERENCES rides(id) NOT NULL,
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ride participants can read messages" ON messages;
CREATE POLICY "Ride participants can read messages" ON messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM rides
      WHERE rides.id = messages.ride_id
      AND (rides.passenger_id = auth.uid() OR rides.driver_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Ride participants can send messages" ON messages;
CREATE POLICY "Ride participants can send messages" ON messages
  FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM rides
      WHERE rides.id = messages.ride_id
      AND (rides.passenger_id = auth.uid() OR rides.driver_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Sender can update own messages" ON messages;
CREATE POLICY "Sender can update own messages" ON messages
  FOR UPDATE TO authenticated USING (sender_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_messages_ride ON messages(ride_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(ride_id, created_at);

ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Rating columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS rating_comment_driver TEXT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS rating_passenger SMALLINT;
