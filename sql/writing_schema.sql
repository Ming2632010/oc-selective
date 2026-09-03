-- Writing practice tables (Neon PostgreSQL)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  prompt_type TEXT NOT NULL CHECK (
    prompt_type IN (
      'narrative', 'diary_entry', 'news_report', 'explanation', 'advice_sheet',
      'review', 'advertisement', 'persuasive_text', 'formal_letter', 'speech',
      'email'
    )
  ),
  module_id INTEGER NOT NULL CHECK (module_id BETWEEN 1 AND 11),
  hint_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  sample_answer_high TEXT NOT NULL,
  sample_answer_medium TEXT NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT TRUE,
  time_limit_minutes INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  kind TEXT NOT NULL DEFAULT 'practice' CHECK (kind IN ('practice', 'test')),
  stimulus_image TEXT,
  stimulus_quote TEXT,
  purposes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  purpose_note TEXT,
  decode_guide JSONB,
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
  marker_notes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, prompt_id, draft_number)
);

ALTER TABLE prompts
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'practice';
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS stimulus_image TEXT;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS stimulus_quote TEXT;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS purposes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS purpose_note TEXT;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS decode_guide JSONB;
ALTER TABLE writing_attempts ADD COLUMN IF NOT EXISTS marker_notes JSONB;

CREATE TABLE IF NOT EXISTS writing_warmups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES prompts (id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_count INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, prompt_id)
);

CREATE INDEX IF NOT EXISTS idx_prompts_module_active ON prompts (module_id, is_active);
CREATE INDEX IF NOT EXISTS idx_prompts_kind_module ON prompts (kind, module_id, is_active);
CREATE INDEX IF NOT EXISTS idx_writing_attempts_student_prompt
  ON writing_attempts (student_id, prompt_id);
