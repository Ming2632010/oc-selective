-- Short auto-marked practice questions inside each writing unit.
CREATE TABLE IF NOT EXISTS mini_drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  module_id INTEGER NOT NULL CHECK (module_id BETWEEN 1 AND 11),
  prompt_type TEXT NOT NULL,
  skill TEXT NOT NULL,
  title TEXT NOT NULL,
  stem TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INTEGER NOT NULL,
  explanation TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_mini_drills_module
  ON mini_drills (module_id, sort_order);

CREATE TABLE IF NOT EXISTS mini_drill_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  drill_id UUID NOT NULL REFERENCES mini_drills (id) ON DELETE CASCADE,
  answer_index INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mini_drill_attempts_student
  ON mini_drill_attempts (student_id, drill_id, created_at DESC);
