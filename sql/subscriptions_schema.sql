-- Per-subject subscription model (Neon PostgreSQL)
-- Safe to re-run: uses IF NOT EXISTS and an idempotent backfill.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  subject TEXT NOT NULL CHECK (subject IN ('writing', 'math', 'thinking', 'reading')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'cancelled')),
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
