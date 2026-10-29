import { runSql } from '@/lib/db';

let ready: Promise<void> | null = null;

/** Additive trial catalogue + one-trial-per-child index. Safe on student requests. */
export async function ensureExamMathTrialSchema() {
  if (!ready) {
    ready = applyExamMathTrialSchema().catch((error) => {
      ready = null;
      throw error;
    });
  }
  await ready;
}

async function applyExamMathTrialSchema() {
  await runSql(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_math_one_trial_per_student
      ON user_subscriptions (student_id)
      WHERE subject = 'math'
        AND student_id IS NOT NULL
        AND trial_started_at IS NOT NULL
  `);
  await runSql(`
    DO $$
    BEGIN
      ALTER TABLE exam_math_sets DROP CONSTRAINT IF EXISTS exam_math_sets_kind_check;
      ALTER TABLE exam_math_sets
        ADD CONSTRAINT exam_math_sets_kind_check
        CHECK (kind IN ('mini', 'paper', 'trial'));
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN undefined_table THEN NULL;
    END $$;
  `);
  await runSql(`
    DO $$
    BEGIN
      ALTER TABLE exam_math_sets DROP CONSTRAINT IF EXISTS exam_math_sets_trial_range;
      ALTER TABLE exam_math_sets
        ADD CONSTRAINT exam_math_sets_trial_range
        CHECK (
          kind <> 'trial'
          OR (set_number BETWEEN 1 AND 2 AND question_count IN (10, 12) AND time_limit_seconds = 0)
        );
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN undefined_table THEN NULL;
    END $$;
  `);
}
