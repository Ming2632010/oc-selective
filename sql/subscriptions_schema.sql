-- Per-subject subscription model (Neon PostgreSQL)
-- Safe to re-run: uses IF NOT EXISTS and an idempotent backfill.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  student_id UUID REFERENCES students (id) ON DELETE CASCADE,
  subject TEXT NOT NULL CHECK (subject IN ('writing', 'math', 'thinking', 'reading')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'cancelled')),
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  stripe_promotion_code_id TEXT,
  stripe_coupon_id TEXT,
  amount_paid INTEGER,
  currency TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Existing production tables predate per-child licences. Add the columns
-- before creating their indexes; CREATE TABLE IF NOT EXISTS does not alter an
-- already-existing table.
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students (id) ON DELETE CASCADE;
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS stripe_promotion_code_id TEXT;
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS stripe_coupon_id TEXT;
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS amount_paid INTEGER;
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS currency TEXT;

-- One row per Stripe subscription. NULL allowed (migrated rows have no Stripe id),
-- and Postgres permits multiple NULLs under a UNIQUE constraint. This lets the
-- webhook upsert by stripe_subscription_id while still allowing a parent to hold
-- two subscriptions to the same subject (one per child) as distinct Stripe subs.
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_subscriptions_stripe_sub
  ON user_subscriptions (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user
  ON user_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_subject_status
  ON user_subscriptions (user_id, subject, status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_student_subject_status
  ON user_subscriptions (student_id, subject, status);

DROP TRIGGER IF EXISTS user_subscriptions_set_updated_at ON user_subscriptions;
CREATE TRIGGER user_subscriptions_set_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE PROCEDURE set_updated_at();

-- One-time backfill from the legacy users.subscription_* columns into the new
-- per-subject table (as the 'writing' subject). Idempotent: skips users that
-- already have a 'writing' row. Legacy 'lifetime' becomes an active writing
-- subscription with no expiry.
INSERT INTO user_subscriptions (user_id, subject, status, stripe_price_id, expires_at)
SELECT
  u.id,
  'writing',
  CASE
    WHEN u.subscription_status IN ('active', 'lifetime') THEN 'active'
    WHEN u.subscription_status = 'cancelled' THEN 'cancelled'
    ELSE 'expired'
  END,
  NULL,
  u.subscription_expiry
FROM users u
WHERE u.subscription_status IN ('active', 'lifetime', 'cancelled')
  AND NOT EXISTS (
    SELECT 1 FROM user_subscriptions s
    WHERE s.user_id = u.id AND s.subject = 'writing'
  );
