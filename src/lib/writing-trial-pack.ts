import { runSql } from '@/lib/db';
import { buildDecodeGuide } from '@/lib/decode-guide';
import {
  TRIAL_PACK_DRILLS,
  TRIAL_PACK_PROMPT,
  TRIAL_PACK_PROMPT_TITLE,
} from '@/lib/seed-trial-pack';

let ready: Promise<void> | null = null;

export function isTrialPackPromptKind(kind: string | null | undefined) {
  return kind === 'trial';
}

export function isTrialPackDrillSource(source: string | null | undefined) {
  return source === 'trial';
}

/**
 * Insert the extra trial pack once. Paid unit rows are not updated.
 * Safe on a student request: IF NOT EXISTS / ON CONFLICT only.
 */
export async function ensureWritingTrialPack() {
  if (!ready) {
    ready = applyWritingTrialPack().catch((error) => {
      ready = null;
      throw error;
    });
  }
  await ready;
}

async function applyWritingTrialPack() {
  await runSql(`
    DO $$
    BEGIN
      ALTER TABLE prompts DROP CONSTRAINT IF EXISTS prompts_kind_check;
      ALTER TABLE prompts
        ADD CONSTRAINT prompts_kind_check
        CHECK (kind IN ('practice', 'test', 'bonus', 'custom', 'trial'));
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);

  const purposes = ['narrate'];
  const decode = buildDecodeGuide({
    prompt_type: TRIAL_PACK_PROMPT.prompt_type,
    title: TRIAL_PACK_PROMPT.title,
    description: TRIAL_PACK_PROMPT.description,
    decode_topic: 'what happens after the yellow raincoat is put on',
    decode_audience: 'a reader who does not already know the story',
  });
  const existing = await runSql<{ id: string }>(
    `SELECT id FROM prompts WHERE title = $1 AND COALESCE(kind, 'practice') = 'trial' LIMIT 1`,
    [TRIAL_PACK_PROMPT_TITLE],
  );
  const values = [
    TRIAL_PACK_PROMPT.title,
    TRIAL_PACK_PROMPT.description,
    TRIAL_PACK_PROMPT.prompt_type,
    TRIAL_PACK_PROMPT.module_id,
    JSON.stringify(TRIAL_PACK_PROMPT.hint_points),
    TRIAL_PACK_PROMPT.sample_answer_high,
    TRIAL_PACK_PROMPT.sample_answer_medium,
    TRIAL_PACK_PROMPT.is_locked,
    TRIAL_PACK_PROMPT.time_limit_minutes,
    TRIAL_PACK_PROMPT.is_active,
    TRIAL_PACK_PROMPT.kind,
    purposes,
    'Tell what happens after the raincoat is put on.',
    JSON.stringify(decode),
  ];
  if (existing.rows[0]) {
    await runSql(
      `UPDATE prompts SET
         description = $2, prompt_type = $3, module_id = $4,
         hint_points = $5::jsonb, sample_answer_high = $6,
         sample_answer_medium = $7, is_locked = $8,
         time_limit_minutes = $9, is_active = $10, kind = $11,
         purposes = $12::text[], purpose_note = $13, decode_guide = $14::jsonb
       WHERE title = $1 AND COALESCE(kind, 'practice') = 'trial'`,
      values,
    );
  } else {
    await runSql(
      `INSERT INTO prompts (
         title, description, prompt_type, module_id, hint_points,
         sample_answer_high, sample_answer_medium, is_locked,
         time_limit_minutes, is_active, kind,
         purposes, purpose_note, decode_guide
       ) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11,$12::text[],$13,$14::jsonb)`,
      values,
    );
  }

  for (const drill of TRIAL_PACK_DRILLS) {
    await runSql(
      `INSERT INTO mini_drills (
         slug, module_id, prompt_type, skill, title, stem, options,
         correct_index, explanation, sort_order, is_active, source, student_id,
         item_kind, prompt
       ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10, TRUE, 'trial', NULL, 'choice', '{}'::jsonb)
       ON CONFLICT (slug) DO UPDATE SET
         module_id = EXCLUDED.module_id,
         prompt_type = EXCLUDED.prompt_type,
         skill = EXCLUDED.skill,
         title = EXCLUDED.title,
         stem = EXCLUDED.stem,
         options = EXCLUDED.options,
         correct_index = EXCLUDED.correct_index,
         explanation = EXCLUDED.explanation,
         sort_order = EXCLUDED.sort_order,
         is_active = TRUE,
         source = 'trial',
         student_id = NULL,
         item_kind = 'choice',
         prompt = '{}'::jsonb`,
      [
        drill.slug,
        drill.module_id,
        drill.prompt_type,
        drill.skill,
        drill.title,
        drill.stem,
        JSON.stringify(drill.options),
        drill.correct_index,
        drill.explanation,
        drill.sort_order,
      ],
    );
  }
}

export type TrialPackView = {
  prompt: {
    id: string;
    title: string;
    description: string;
    prompt_type: string;
    module_id: number;
    max_draft: number;
  };
  drills: Array<{
    id: string;
    slug: string;
    title: string;
    skill: string;
    attempted: boolean;
  }>;
};

export async function getTrialPackView(studentId: string): Promise<TrialPackView | null> {
  await ensureWritingTrialPack();
  const prompt = await runSql<{
    id: string;
    title: string;
    description: string;
    prompt_type: string;
    module_id: number;
  }>(
    `SELECT id, title, description, prompt_type, module_id
     FROM prompts
     WHERE COALESCE(kind, 'practice') = 'trial' AND is_active = TRUE
     ORDER BY created_at ASC
     LIMIT 1`,
  );
  const row = prompt.rows[0];
  if (!row) return null;

  const draft = await runSql<{ n: string }>(
    `SELECT COALESCE(MAX(draft_number), 0)::text AS n
     FROM writing_attempts
     WHERE student_id = $1 AND prompt_id = $2`,
    [studentId, row.id],
  );
  const drills = await runSql<{
    id: string;
    slug: string;
    title: string;
    skill: string;
    attempted: boolean;
  }>(
    `SELECT d.id, d.slug, d.title, d.skill,
            EXISTS (
              SELECT 1 FROM mini_drill_attempts a
              WHERE a.student_id = $1 AND a.drill_id = d.id
            ) AS attempted
     FROM mini_drills d
     WHERE d.source = 'trial' AND d.is_active = TRUE AND d.student_id IS NULL
     ORDER BY d.sort_order ASC`,
    [studentId],
  );

  return {
    prompt: {
      ...row,
      max_draft: Number(draft.rows[0]?.n ?? 0),
    },
    drills: drills.rows,
  };
}
