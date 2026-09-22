import { runSql } from '@/lib/db';

let ready: Promise<void> | null = null;

/**
 * Additive trial columns. Safe to run on every cold start: existing paid
 * licences stay paid, and IF NOT EXISTS keeps the change idempotent.
 */
export async function ensureWritingTrialColumns() {
  if (!ready) {
    ready = applyWritingTrialColumns().catch((error) => {
      ready = null;
      throw error;
    });
  }
  await ready;
}

export function isMissingTrialColumn(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('column "access_kind" does not exist') ||
    message.includes('column "trial_started_at" does not exist')
  );
}

async function applyWritingTrialColumns() {
  await runSql(
    `ALTER TABLE user_subscriptions
     ADD COLUMN IF NOT EXISTS access_kind TEXT NOT NULL DEFAULT 'paid'`,
  );
  await runSql(
    `ALTER TABLE user_subscriptions
     ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ`,
  );
  await runSql(
    `UPDATE user_subscriptions
     SET access_kind = 'paid'
     WHERE access_kind IS NULL OR access_kind NOT IN ('paid', 'trial')`,
  );
  await runSql(`
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
  `);
}
