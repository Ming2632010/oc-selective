-- K–Y1 Maths practice. Additive only: new tables, no changes to writing,
-- attempt, subscription, reward, or account rows.

CREATE TABLE IF NOT EXISTS early_math_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  unit_id INTEGER NOT NULL CHECK (unit_id BETWEEN 1 AND 7),
  skill TEXT NOT NULL,
  item_kind TEXT NOT NULL,
  title TEXT NOT NULL,
  stem TEXT NOT NULL,
  stimulus JSONB NOT NULL DEFAULT '{}'::jsonb,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_index INTEGER,
  accepted JSONB NOT NULL DEFAULT '[]'::jsonb,
  explanation TEXT NOT NULL,
  parent_prompt TEXT NOT NULL DEFAULT '',
  difficulty TEXT NOT NULL DEFAULT 'core',
  sort_order INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_early_math_items_unit
  ON early_math_items (unit_id, sort_order);

CREATE TABLE IF NOT EXISTS early_math_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES early_math_items (id) ON DELETE CASCADE,
  answer_index INTEGER,
  answer_text TEXT,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_early_math_attempts_student
  ON early_math_attempts (student_id, item_id, created_at DESC);
