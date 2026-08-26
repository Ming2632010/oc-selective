-- Migration: expand the writing "modules" (now called Units) to a per-text-type
-- model with 11 units, and widen the prompt_type set. Idempotent.

-- 1) Rename the legacy 'newspaper_report' type to 'news_report' BEFORE tightening
--    the prompt_type constraint (otherwise existing rows would violate it).
ALTER TABLE prompts DROP CONSTRAINT IF EXISTS prompts_prompt_type_check;
UPDATE prompts SET prompt_type = 'news_report' WHERE prompt_type = 'newspaper_report';
ALTER TABLE prompts ADD CONSTRAINT prompts_prompt_type_check CHECK (
  prompt_type IN (
    'narrative', 'diary_entry', 'news_report', 'explanation', 'advice_sheet',
    'review', 'advertisement', 'persuasive_text', 'formal_letter', 'speech',
    'email'
  )
);

-- 2) Widen the allowed unit range (stored in module_id) from 1..6 to 1..11.
ALTER TABLE prompts DROP CONSTRAINT IF EXISTS prompts_module_id_check;
ALTER TABLE prompts ADD CONSTRAINT prompts_module_id_check CHECK (module_id BETWEEN 1 AND 11);
