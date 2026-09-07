-- Release migration: per-child Writing licences and server-owned exam sessions.
-- Run this once during deployment, before routing external users to the app.

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

-- Legacy account-level licences deliberately stay unassigned: the database has
-- no evidence of which child the parent intended to licence. Allocate them
-- through the parent-facing migration/admin flow before enforcing per-child
-- access for an existing family.

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_student_subject_status
  ON user_subscriptions (student_id, subject, status);

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_writing_subscription_per_student
  ON user_subscriptions (student_id, subject)
  WHERE student_id IS NOT NULL AND subject = 'writing' AND status = 'active';

CREATE TABLE IF NOT EXISTS writing_exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES prompts (id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deadline_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  UNIQUE (student_id, prompt_id)
);

CREATE INDEX IF NOT EXISTS idx_writing_exam_sessions_deadline
  ON writing_exam_sessions (student_id, prompt_id, deadline_at);

-- Stripe retries webhook deliveries. Keep a durable ledger so a completed
-- delivery cannot grant duplicate access after a process restart.
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'completed', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 1,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  last_error TEXT
);
