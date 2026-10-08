-- 7-day Selective Writing trial. Additive: existing licences stay paid.
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS access_kind TEXT NOT NULL DEFAULT 'paid';

ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;

UPDATE user_subscriptions
SET access_kind = 'paid'
WHERE access_kind IS NULL OR access_kind NOT IN ('paid', 'trial');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_subscriptions_access_kind_check'
  ) THEN
    ALTER TABLE user_subscriptions
      ADD CONSTRAINT user_subscriptions_access_kind_check
      CHECK (access_kind IN ('paid', 'trial'));
  END IF;
END $$;

-- One 7-day trial per child. Convert keeps this row (trial_started_at stays),
-- so a second INSERT cannot open another trial after expiry or purchase.
CREATE UNIQUE INDEX IF NOT EXISTS uq_writing_one_trial_per_student
  ON user_subscriptions (student_id)
  WHERE subject = 'writing'
    AND student_id IS NOT NULL
    AND trial_started_at IS NOT NULL;

-- Extra trial pack uses kind = 'trial' so paid unit queries stay unchanged.
DO $$
BEGIN
  ALTER TABLE prompts DROP CONSTRAINT IF EXISTS prompts_kind_check;
  ALTER TABLE prompts
    ADD CONSTRAINT prompts_kind_check
    CHECK (kind IN ('practice', 'test', 'bonus', 'custom', 'trial'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
