import { runSql } from '@/lib/db';

let ready: Promise<void> | null = null;

/**
 * Create Selective Math tables on a live database that shipped the player
 * before migrate ran. Idempotent: IF NOT EXISTS, no student rows touched.
 */
export async function ensureExamMathSchema() {
  if (!ready) {
    ready = applyExamMathSchema().catch((error) => {
      ready = null;
      throw error;
    });
  }
  await ready;
}

export function isMissingExamMathTable(error: unknown): boolean {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code === '42P01') {
    const message = error instanceof Error ? error.message : String(error);
    return /exam_math_/i.test(message);
  }
  const message = error instanceof Error ? error.message : String(error);
  return /relation ["']?exam_math_[a-z_]+["']? does not exist/i.test(message);
}

async function applyExamMathSchema() {
  await runSql(`
CREATE TABLE IF NOT EXISTS exam_math_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('mini', 'paper', 'trial')),
  set_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  question_count INTEGER NOT NULL,
  time_limit_seconds INTEGER NOT NULL,
  difficulty_band TEXT NOT NULL,
  is_ready BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (kind, set_number)
)`);
  await runSql(`
CREATE INDEX IF NOT EXISTS idx_exam_math_sets_kind
  ON exam_math_sets (kind, set_number)`);
  await runSql(`
CREATE TABLE IF NOT EXISTS exam_math_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL REFERENCES exam_math_sets (id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  family_id TEXT,
  skill TEXT,
  stem TEXT NOT NULL,
  stimulus JSONB NOT NULL DEFAULT '{}'::jsonb,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_index INTEGER NOT NULL CHECK (correct_index BETWEEN 0 AND 4),
  explanation TEXT NOT NULL DEFAULT '',
  working JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (set_id, sort_order)
)`);
  await runSql(`
CREATE INDEX IF NOT EXISTS idx_exam_math_items_set
  ON exam_math_items (set_id, sort_order)`);
  await runSql(`
CREATE INDEX IF NOT EXISTS idx_exam_math_items_family
  ON exam_math_items (family_id)`);
  await runSql(`
CREATE TABLE IF NOT EXISTS exam_math_sittings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  set_id UUID NOT NULL REFERENCES exam_math_sets (id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deadline_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  timed_out BOOLEAN NOT NULL DEFAULT FALSE,
  timer_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`);
  await runSql(`
CREATE INDEX IF NOT EXISTS idx_exam_math_sittings_student
  ON exam_math_sittings (student_id, started_at DESC)`);
  await runSql(`
CREATE TABLE IF NOT EXISTS exam_math_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sitting_id UUID NOT NULL REFERENCES exam_math_sittings (id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES exam_math_items (id) ON DELETE CASCADE,
  chosen_index INTEGER CHECK (chosen_index BETWEEN 0 AND 4),
  flagged BOOLEAN NOT NULL DEFAULT FALSE,
  is_correct BOOLEAN,
  answered_at TIMESTAMPTZ,
  UNIQUE (sitting_id, item_id)
)`);
  await runSql(`
CREATE INDEX IF NOT EXISTS idx_exam_math_answers_sitting
  ON exam_math_answers (sitting_id)`);
  await runSql(`
CREATE TABLE IF NOT EXISTS exam_math_wrongs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES exam_math_items (id) ON DELETE CASCADE,
  family_id TEXT,
  skill TEXT,
  first_wrong_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_wrong_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  times_wrong INTEGER NOT NULL DEFAULT 1,
  similar_correct INTEGER NOT NULL DEFAULT 0,
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (student_id, item_id)
)`);
  await runSql(`
CREATE INDEX IF NOT EXISTS idx_exam_math_wrongs_student
  ON exam_math_wrongs (student_id, is_open, last_wrong_at DESC)`);
  await runSql(`
CREATE TABLE IF NOT EXISTS exam_math_strengthen_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  source_item_id UUID NOT NULL REFERENCES exam_math_items (id) ON DELETE CASCADE,
  family_id TEXT NOT NULL,
  skill TEXT NOT NULL,
  stem TEXT NOT NULL,
  stimulus JSONB NOT NULL DEFAULT '{}'::jsonb,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_index INTEGER NOT NULL CHECK (correct_index BETWEEN 0 AND 4),
  explanation TEXT NOT NULL DEFAULT '',
  working JSONB NOT NULL DEFAULT '[]'::jsonb,
  chosen_index INTEGER CHECK (chosen_index BETWEEN 0 AND 4),
  is_correct BOOLEAN,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`);
  await runSql(`
CREATE INDEX IF NOT EXISTS idx_exam_math_strengthen_student
  ON exam_math_strengthen_items (student_id, family_id, created_at DESC)`);
  await runSql(`
ALTER TABLE exam_math_items
  ADD COLUMN IF NOT EXISTS working JSONB NOT NULL DEFAULT '[]'::jsonb`);
  await runSql(`
ALTER TABLE exam_math_strengthen_items
  ADD COLUMN IF NOT EXISTS stimulus JSONB NOT NULL DEFAULT '{}'::jsonb`);
  await runSql(`
ALTER TABLE exam_math_strengthen_items
  ADD COLUMN IF NOT EXISTS working JSONB NOT NULL DEFAULT '[]'::jsonb`);
}
