import { runSql } from '@/lib/db';
import { ensureExamMathSchema } from '@/lib/exam-math-schema';

let ready: Promise<void> | null = null;

/** Additive working JSON on items and Strengthen follow-ups. Safe on student requests. */
export async function ensureExamMathWorkingSchema() {
  if (!ready) {
    ready = applyExamMathWorkingSchema().catch((error) => {
      ready = null;
      throw error;
    });
  }
  await ready;
}

async function applyExamMathWorkingSchema() {
  await ensureExamMathSchema();
  await runSql(`
    DO $$
    BEGIN
      ALTER TABLE exam_math_items
        ADD COLUMN IF NOT EXISTS working JSONB NOT NULL DEFAULT '[]'::jsonb;
    EXCEPTION
      WHEN undefined_table THEN NULL;
    END $$;
  `);
  await runSql(`
    DO $$
    BEGIN
      ALTER TABLE exam_math_strengthen_items
        ADD COLUMN IF NOT EXISTS working JSONB NOT NULL DEFAULT '[]'::jsonb;
    EXCEPTION
      WHEN undefined_table THEN NULL;
    END $$;
  `);
}
