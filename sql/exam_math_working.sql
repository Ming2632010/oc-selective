-- Full method write-ups for Selective Math results.
-- Additive: existing stems, options and sittings stay in place.
ALTER TABLE exam_math_items
  ADD COLUMN IF NOT EXISTS working JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE exam_math_strengthen_items
  ADD COLUMN IF NOT EXISTS working JSONB NOT NULL DEFAULT '[]'::jsonb;
