-- Per-subject family chat (parent and student on the same account).
CREATE TABLE IF NOT EXISTS subject_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  subject TEXT NOT NULL CHECK (
    subject IN ('writing', 'math', 'thinking', 'reading')
  ),
  sender TEXT NOT NULL CHECK (sender IN ('parent', 'student')),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subject_messages_thread
  ON subject_messages (user_id, student_id, subject, created_at);
