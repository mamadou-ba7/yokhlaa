-- ============================================
-- Phase 1: real payments + enforcement
-- Already applied to fpjyfctwjiivusbzxmrg on 2026-04-09
-- ============================================

-- 1a. Add driver_status to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS driver_status TEXT DEFAULT 'pending';

-- 1b. Add subscription_ends_at to profiles (denormalized for fast enforcement)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

-- 1c. Widen subscriptions.status enum to include pending/failed
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('pending', 'active', 'failed', 'expired', 'cancelled'));

-- 1d. Widen subscriptions.payment_method to include free_money
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_payment_method_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_payment_method_check
  CHECK (payment_method IN ('wave', 'orange_money', 'free_money'));

-- 1e. Add payment tracking columns to subscriptions
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'cinetpay',
  ADD COLUMN IF NOT EXISTS transaction_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS provider_token TEXT,
  ADD COLUMN IF NOT EXISTS provider_operator_id TEXT,
  ADD COLUMN IF NOT EXISTS webhook_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS webhook_payload JSONB,
  ADD COLUMN IF NOT EXISTS error_message TEXT;

CREATE INDEX IF NOT EXISTS idx_subscriptions_transaction_id ON subscriptions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_driver_status ON subscriptions(driver_id, status);

-- 1f. Default subscription status to 'pending'
ALTER TABLE subscriptions ALTER COLUMN status SET DEFAULT 'pending';

-- 1g. Trigger: sync profile when subscription status changes
CREATE OR REPLACE FUNCTION sync_profile_subscription()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE profiles
       SET subscription_active = TRUE,
           subscription_ends_at = NEW.ends_at,
           updated_at = NOW()
     WHERE id = NEW.driver_id;
  ELSIF NEW.status IN ('expired', 'cancelled', 'failed') THEN
    IF NOT EXISTS (
      SELECT 1 FROM subscriptions
       WHERE driver_id = NEW.driver_id
         AND status = 'active'
         AND ends_at > NOW()
         AND id <> NEW.id
    ) THEN
      UPDATE profiles
         SET subscription_active = FALSE,
             updated_at = NOW()
       WHERE id = NEW.driver_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_profile_subscription ON subscriptions;
CREATE TRIGGER trg_sync_profile_subscription
AFTER INSERT OR UPDATE OF status ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION sync_profile_subscription();

-- 1h. Add subscriptions to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;
