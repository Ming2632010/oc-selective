-- Selective Thinking Skills (Year 4–7) catalogue and sittings.
-- Additive only: new tables. Does not touch early_math, writing, student,
-- attempt, subscription, reward, or account rows. Question items stay empty
-- until the owner supplies sample papers.

CREATE TABLE IF NOT EXISTS exam_thinking_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('mini', 'paper')),
  set_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  question_count INTEGER NOT NULL,
  time_limit_seconds INTEGER NOT NULL,
  difficulty_band TEXT NOT NULL,
  is_ready BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (kind, set_number),
  CONSTRAINT exam_thinking_sets_mini_range CHECK (
    kind <> 'mini' OR (set_number BETWEEN 1 AND 100 AND question_count = 12)
  ),
  CONSTRAINT exam_thinking_sets_paper_range CHECK (
    kind <> 'paper' OR (set_number BETWEEN 1 AND 20 AND question_count = 40)
  )
);

CREATE INDEX IF NOT EXISTS idx_exam_thinking_sets_kind
  ON exam_thinking_sets (kind, set_number);

CREATE TABLE IF NOT EXISTS exam_thinking_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL REFERENCES exam_thinking_sets (id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  family_id TEXT,
  skill TEXT,
  stem TEXT NOT NULL,
  stimulus JSONB NOT NULL DEFAULT '{}'::jsonb,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_index INTEGER NOT NULL CHECK (correct_index BETWEEN 0 AND 3),
  explanation TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (set_id, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_exam_thinking_items_set
  ON exam_thinking_items (set_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_exam_thinking_items_family
  ON exam_thinking_items (family_id);

CREATE TABLE IF NOT EXISTS exam_thinking_sittings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  set_id UUID NOT NULL REFERENCES exam_thinking_sets (id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deadline_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  timed_out BOOLEAN NOT NULL DEFAULT FALSE,
  timer_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_thinking_sittings_student
  ON exam_thinking_sittings (student_id, started_at DESC);

CREATE TABLE IF NOT EXISTS exam_thinking_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sitting_id UUID NOT NULL REFERENCES exam_thinking_sittings (id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES exam_thinking_items (id) ON DELETE CASCADE,
  chosen_index INTEGER CHECK (chosen_index BETWEEN 0 AND 3),
  flagged BOOLEAN NOT NULL DEFAULT FALSE,
  is_correct BOOLEAN,
  answered_at TIMESTAMPTZ,
  UNIQUE (sitting_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_thinking_answers_sitting
  ON exam_thinking_answers (sitting_id);

CREATE TABLE IF NOT EXISTS exam_thinking_wrongs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES exam_thinking_items (id) ON DELETE CASCADE,
  family_id TEXT,
  skill TEXT,
  first_wrong_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_wrong_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  times_wrong INTEGER NOT NULL DEFAULT 1,
  similar_correct INTEGER NOT NULL DEFAULT 0,
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (student_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_thinking_wrongs_student
  ON exam_thinking_wrongs (student_id, is_open, last_wrong_at DESC);
