-- Seed Patch reward tables (also created by ensureWritingEnhancements)

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
