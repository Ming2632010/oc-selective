-- Private photos for parent-made custom writing questions.
-- Bytes stay in Postgres so they are not a public /stimuli file.

CREATE TABLE IF NOT EXISTS custom_task_images (
  prompt_id UUID PRIMARY KEY REFERENCES prompts (id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  bytes BYTEA NOT NULL,
  byte_length INTEGER NOT NULL CHECK (byte_length > 0 AND byte_length <= 5242880),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_task_images_student
  ON custom_task_images (student_id);
