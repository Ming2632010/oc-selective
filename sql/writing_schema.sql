-- Writing practice tables (Neon PostgreSQL)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  prompt_type TEXT NOT NULL CHECK (
    prompt_type IN ('newspaper_report', 'diary_entry', 'email', 'advice_sheet')
  ),
  module_id INTEGER NOT NULL CHECK (module_id BETWEEN 1 AND 6),
  hint_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  sample_answer_high TEXT NOT NULL,
  sample_answer_medium TEXT NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT TRUE,
  time_limit_minutes INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS writing_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES prompts (id) ON DELETE CASCADE,
  draft_number INTEGER NOT NULL CHECK (draft_number BETWEEN 1 AND 3),
  content TEXT NOT NULL,
  plan_content TEXT,
  score_set_a INTEGER CHECK (score_set_a IS NULL OR (score_set_a BETWEEN 0 AND 15)),
  score_set_b INTEGER CHECK (score_set_b IS NULL OR (score_set_b BETWEEN 0 AND 10)),
  overall_score INTEGER CHECK (overall_score IS NULL OR (overall_score BETWEEN 0 AND 25)),
  scores_breakdown JSONB,
  ai_feedback TEXT,
  checked_hint_1 BOOLEAN NOT NULL DEFAULT FALSE,
  checked_hint_2 BOOLEAN NOT NULL DEFAULT FALSE,
  checked_hint_3 BOOLEAN NOT NULL DEFAULT FALSE,
  word_count INTEGER NOT NULL DEFAULT 0,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  has_seen_sample BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, prompt_id, draft_number)
);

CREATE INDEX IF NOT EXISTS idx_prompts_module_active ON prompts (module_id, is_active);
CREATE INDEX IF NOT EXISTS idx_writing_attempts_student_prompt
  ON writing_attempts (student_id, prompt_id);
