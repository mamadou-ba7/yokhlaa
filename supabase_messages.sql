-- ============================================
-- YOKH LAA - Messages Table (Chat in-app)
-- Run this in Supabase SQL Editor
-- ============================================

-- Table messages pour le chat passager <-> chauffeur
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID REFERENCES rides(id) NOT NULL,
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies: only ride participants can read/write messages
CREATE POLICY "Ride participants can read messages" ON messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM rides
      WHERE rides.id = messages.ride_id
      AND (rides.passenger_id = auth.uid() OR rides.driver_id = auth.uid())
    )
  );

CREATE POLICY "Ride participants can send messages" ON messages
  FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM rides
      WHERE rides.id = messages.ride_id
      AND (rides.passenger_id = auth.uid() OR rides.driver_id = auth.uid())
    )
  );

CREATE POLICY "Sender can update own messages" ON messages
  FOR UPDATE TO authenticated USING (sender_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_ride ON messages(ride_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(ride_id, created_at);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ============================================
-- Migration: update profiles for rating system
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS rating_comment_driver TEXT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS rating_passenger SMALLINT;
