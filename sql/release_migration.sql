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

-- Legacy account-level licences are assigned to the oldest active child. Parents
-- with additional children can buy a separate licence for each of them.
UPDATE user_subscriptions subscription
SET student_id = (
  SELECT student.id
  FROM students student
  WHERE student.user_id = subscription.user_id AND student.is_active = TRUE
  ORDER BY student.created_at ASC
  LIMIT 1
)
WHERE subscription.student_id IS NULL;

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
