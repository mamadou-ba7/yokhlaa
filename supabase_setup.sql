-- ============================================
-- YOKH LAA - Database Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Table liste d'attente (waitlist)
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('chauffeur', 'passager')),
  zone TEXT,
  vehicule TEXT,
  flyer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('chauffeur', 'passager')),
  zone TEXT,
  vehicule TEXT,
  plaque TEXT,
  photo_url TEXT,
  rating NUMERIC(3,2) DEFAULT 5.00,
  total_rides INTEGER DEFAULT 0,
  is_online BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  subscription_active BOOLEAN DEFAULT FALSE,
  push_token TEXT,
  home_address TEXT,
  home_lat DOUBLE PRECISION,
  home_lng DOUBLE PRECISION,
  work_address TEXT,
  work_lat DOUBLE PRECISION,
  work_lng DOUBLE PRECISION,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table des courses
CREATE TABLE IF NOT EXISTS rides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  passenger_id UUID REFERENCES profiles(id),
  driver_id UUID REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'arriving', 'in_progress', 'completed', 'cancelled')),
  pickup_address TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION NOT NULL,
  pickup_lng DOUBLE PRECISION NOT NULL,
  dropoff_address TEXT NOT NULL,
  dropoff_lat DOUBLE PRECISION NOT NULL,
  dropoff_lng DOUBLE PRECISION NOT NULL,
  distance_km NUMERIC(6,2),
  duration_min INTEGER,
  price INTEGER NOT NULL,
  ride_class TEXT DEFAULT 'confort',
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'wave', 'orange_money')),
  rating_driver SMALLINT,
  rating_passenger SMALLINT,
  comment_passenger TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- 4. Table abonnements chauffeurs
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES profiles(id) NOT NULL,
  amount INTEGER DEFAULT 18500,
  payment_method TEXT CHECK (payment_method IN ('wave', 'orange_money')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Row Level Security
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. SECURE RLS POLICIES
-- ============================================

-- Waitlist: anon can insert and read count
CREATE POLICY "Anyone can join waitlist" ON waitlist
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anyone can read waitlist count" ON waitlist
  FOR SELECT TO anon USING (true);

-- Profiles: authenticated users
-- Everyone can read profiles (needed for driver info display)
CREATE POLICY "Authenticated users can read profiles" ON profiles
  FOR SELECT TO authenticated USING (true);

-- Users can only insert their own profile (id must match auth.uid)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- Rides: authenticated users only
-- Passengers can read their own rides, drivers can read rides they accepted or pending ones
CREATE POLICY "Users can read relevant rides" ON rides
  FOR SELECT TO authenticated USING (
    passenger_id = auth.uid()
    OR driver_id = auth.uid()
    OR status = 'pending'
  );

-- Only authenticated users can create rides (as passenger)
CREATE POLICY "Authenticated users can create rides" ON rides
  FOR INSERT TO authenticated WITH CHECK (
    passenger_id = auth.uid()
  );

-- Ride updates: passenger can cancel own ride, driver can update accepted ride
CREATE POLICY "Participants can update rides" ON rides
  FOR UPDATE TO authenticated USING (
    passenger_id = auth.uid()
    OR driver_id = auth.uid()
    OR (status = 'pending' AND driver_id IS NULL)
  );

-- Subscriptions: drivers can read their own
CREATE POLICY "Drivers can read own subscriptions" ON subscriptions
  FOR SELECT TO authenticated USING (driver_id = auth.uid());

CREATE POLICY "Drivers can insert own subscriptions" ON subscriptions
  FOR INSERT TO authenticated WITH CHECK (driver_id = auth.uid());

-- ============================================
-- 7. Enable realtime
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE rides;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- ============================================
-- 8. Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_driver ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_passenger ON rides(passenger_id);
CREATE INDEX IF NOT EXISTS idx_rides_created ON rides(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_online ON profiles(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_profiles_push_token ON profiles(push_token) WHERE push_token IS NOT NULL;

-- ============================================
-- 9. Migration: add columns if upgrading from v1
-- Run these if tables already exist
-- ============================================
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plaque TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;
-- ALTER TABLE rides ADD COLUMN IF NOT EXISTS ride_class TEXT DEFAULT 'confort';
-- ALTER TABLE rides ADD COLUMN IF NOT EXISTS comment_passenger TEXT;
-- ALTER TABLE rides ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS home_address TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS home_lat DOUBLE PRECISION;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS home_lng DOUBLE PRECISION;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS work_address TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS work_lat DOUBLE PRECISION;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS work_lng DOUBLE PRECISION;
