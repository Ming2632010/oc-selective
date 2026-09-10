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
  module_id INTEGER NOT NULL CHECK (module_id BETWEEN 1 AND 12),
  hint_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  sample_answer_high TEXT NOT NULL,
  sample_answer_medium TEXT NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT TRUE,
  time_limit_minutes INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  kind TEXT NOT NULL DEFAULT 'practice' CHECK (kind IN ('practice', 'test', 'bonus')),
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
CREATE INDEX IF NOT EXISTS idx_writing_attempts_student_created
  ON writing_attempts (student_id, created_at);

-- Additive learning enhancements. This is applied by `npm run db:migrate`,
-- never by a student-facing request.
CREATE TABLE IF NOT EXISTS subject_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  subject TEXT NOT NULL CHECK (subject IN ('writing', 'math', 'thinking', 'reading')),
  sender TEXT NOT NULL CHECK (sender IN ('parent', 'student')),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subject_messages_thread
  ON subject_messages (user_id, student_id, subject, created_at);

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
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  student_id UUID REFERENCES students (id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'seed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  focus_note TEXT,
  item_kind TEXT NOT NULL DEFAULT 'choice',
  prompt JSONB NOT NULL DEFAULT '{}'::jsonb
);
ALTER TABLE mini_drills ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students (id) ON DELETE CASCADE;
ALTER TABLE mini_drills ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'seed';
ALTER TABLE mini_drills ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE mini_drills ADD COLUMN IF NOT EXISTS focus_note TEXT;
ALTER TABLE mini_drills ADD COLUMN IF NOT EXISTS item_kind TEXT NOT NULL DEFAULT 'choice';
ALTER TABLE mini_drills ADD COLUMN IF NOT EXISTS prompt JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_mini_drills_module ON mini_drills (module_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_mini_drills_student ON mini_drills (student_id, module_id, sort_order);

CREATE TABLE IF NOT EXISTS mini_drill_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  drill_id UUID NOT NULL REFERENCES mini_drills (id) ON DELETE CASCADE,
  answer_index INTEGER,
  is_correct BOOLEAN NOT NULL,
  answer_text TEXT,
  answer_payload JSONB,
  feedback JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE mini_drill_attempts ALTER COLUMN answer_index DROP NOT NULL;
ALTER TABLE mini_drill_attempts ADD COLUMN IF NOT EXISTS answer_text TEXT;
ALTER TABLE mini_drill_attempts ADD COLUMN IF NOT EXISTS answer_payload JSONB;
ALTER TABLE mini_drill_attempts ADD COLUMN IF NOT EXISTS feedback JSONB;
CREATE INDEX IF NOT EXISTS idx_mini_drill_attempts_student
  ON mini_drill_attempts (student_id, drill_id, created_at DESC);

CREATE TABLE IF NOT EXISTS mini_drill_unlocks (
  student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  drill_id UUID NOT NULL REFERENCES mini_drills (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, drill_id)
);
CREATE INDEX IF NOT EXISTS idx_mini_drill_unlocks_student
  ON mini_drill_unlocks (student_id, created_at DESC);

CREATE TABLE IF NOT EXISTS writing_exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES prompts (id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deadline_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  UNIQUE (student_id, prompt_id)
);
CREATE INDEX IF NOT EXISTS idx_writing_exam_sessions_deadline
  ON writing_exam_sessions (student_id, prompt_id, deadline_at);

CREATE TABLE IF NOT EXISTS student_seed_patch (
  student_id UUID PRIMARY KEY REFERENCES students (id) ON DELETE CASCADE,
  lifetime_seeds INTEGER NOT NULL DEFAULT 0,
  week_seeds INTEGER NOT NULL DEFAULT 0,
  week_start DATE NOT NULL,
  harvest_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  plot_days INTEGER NOT NULL DEFAULT 0,
  last_plot_date DATE,
  rain_cheques INTEGER NOT NULL DEFAULT 0,
  focused_seconds_week INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS seed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  seeds INTEGER NOT NULL,
  label TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_seed_events_student
  ON seed_events (student_id, created_at DESC);
