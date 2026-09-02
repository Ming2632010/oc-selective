import { query } from '@/lib/db';
import { extraCapacity, pickMiniFocus, selectExtraPack, type SkillStat } from '@/lib/mini-weakness';
import {
  calendarDateInSydney,
  focusedSecondsToCount,
  growthStage,
  harvestBonus,
  nextPlotState,
  seedsForMini,
  seedsForWriting,
  sumSeeds,
  weekStartSydney,
  WEEKLY_HARVEST_GOAL,
  type AwardLine,
} from '@/lib/rewards';
import { MINI_SKILLS, SEED_MINI_DRILLS, type MiniSkill } from '@/lib/seed-mini-drills';
import { SEED_EXTRA_MINI_DRILLS } from '@/lib/seed-extra-mini-drills';
import { buildDecodeGuide, defaultPurposes } from '@/lib/decode-guide';
import { SEED_PROMPTS } from '@/lib/seed-prompts';
import { getUnitInfo, typeLabel } from '@/lib/units';
import { buildWeekNote, type WeekNoteData } from '@/lib/week-note';
import {
  recommendNextTask,
  weakestDimension,
  type AttemptSummary,
  type NextTaskRecommendation,
  type PromptSummary,
  type UnitProgressRow,
} from '@/lib/writing-guidance';

let schemaReady = false;
let seededLength = 0;
let seededPrompts = 0;
const WRITING_SCHEMA = 6;
let appliedSchema = 0;

const SEEDED_DRILL_COUNT = SEED_MINI_DRILLS.length + SEED_EXTRA_MINI_DRILLS.length;

function markSchemaReady() {
  schemaReady = true;
  seededLength = SEEDED_DRILL_COUNT;
  seededPrompts = SEED_PROMPTS.length;
  appliedSchema = WRITING_SCHEMA;
}

export async function ensureWritingEnhancements(): Promise<void> {
  if (
    schemaReady &&
    seededLength === SEEDED_DRILL_COUNT &&
    seededPrompts === SEED_PROMPTS.length &&
    appliedSchema === WRITING_SCHEMA
  ) {
    return;
  }

  await query(`
    CREATE TABLE IF NOT EXISTS writing_schema_meta (
      id SMALLINT PRIMARY KEY CHECK (id = 1),
      version INTEGER NOT NULL,
      seeded_prompts INTEGER NOT NULL DEFAULT 0,
      seeded_drills INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  const meta = await query<{
    version: number;
    seeded_prompts: number;
    seeded_drills: number;
  }>(
    `SELECT version, seeded_prompts, seeded_drills
     FROM writing_schema_meta WHERE id = 1`,
  );
  const row = meta.rows[0];
  if (
    row &&
    row.version === WRITING_SCHEMA &&
    row.seeded_prompts === SEED_PROMPTS.length &&
    row.seeded_drills === SEEDED_DRILL_COUNT
  ) {
    markSchemaReady();
    return;
  }

  await query(`
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
    )
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_subject_messages_thread
      ON subject_messages (user_id, student_id, subject, created_at)
  `);
  await query(
    `UPDATE prompts SET is_locked = FALSE WHERE is_active = TRUE AND is_locked = TRUE`,
  );

  await query(`
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
      is_active BOOLEAN NOT NULL DEFAULT TRUE
    )
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_mini_drills_module
      ON mini_drills (module_id, sort_order)
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS mini_drill_attempts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
      drill_id UUID NOT NULL REFERENCES mini_drills (id) ON DELETE CASCADE,
      answer_index INTEGER NOT NULL,
      is_correct BOOLEAN NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_mini_drill_attempts_student
      ON mini_drill_attempts (student_id, drill_id, created_at DESC)
  `);
  await query(`
    ALTER TABLE mini_drills
      ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students (id) ON DELETE CASCADE
  `);
  await query(`
    ALTER TABLE mini_drills
      ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'seed'
  `);
  await query(`
    ALTER TABLE mini_drills
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `);
  await query(`
    ALTER TABLE mini_drills
      ADD COLUMN IF NOT EXISTS focus_note TEXT
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_mini_drills_student
      ON mini_drills (student_id, module_id, sort_order)
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS mini_drill_unlocks (
      student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
      drill_id UUID NOT NULL REFERENCES mini_drills (id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (student_id, drill_id)
    )
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_mini_drill_unlocks_student
      ON mini_drill_unlocks (student_id, created_at DESC)
  `);

  await query(`
    ALTER TABLE prompts
      ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'practice'
  `);
  await query(`
    UPDATE prompts SET kind = 'practice' WHERE kind IS NULL OR kind = ''
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_prompts_kind_module
      ON prompts (kind, module_id, is_active)
  `);
  await query(`ALTER TABLE prompts ADD COLUMN IF NOT EXISTS stimulus_image TEXT`);
  await query(`ALTER TABLE prompts ADD COLUMN IF NOT EXISTS stimulus_quote TEXT`);
  await query(
    `ALTER TABLE prompts ADD COLUMN IF NOT EXISTS purposes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]`,
  );
  await query(`ALTER TABLE prompts ADD COLUMN IF NOT EXISTS purpose_note TEXT`);
  await query(`ALTER TABLE prompts ADD COLUMN IF NOT EXISTS decode_guide JSONB`);
  await query(`
    CREATE TABLE IF NOT EXISTS writing_warmups (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
      prompt_id UUID NOT NULL REFERENCES prompts (id) ON DELETE CASCADE,
      answers JSONB NOT NULL DEFAULT '[]'::jsonb,
      correct_count INTEGER NOT NULL DEFAULT 0,
      completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (student_id, prompt_id)
    )
  `);

  await query(`
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
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS seed_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
      source TEXT NOT NULL,
      seeds INTEGER NOT NULL,
      label TEXT NOT NULL,
      meta JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_seed_events_student
      ON seed_events (student_id, created_at DESC)
  `);

  for (const prompt of SEED_PROMPTS) {
    const purposes =
      prompt.purposes && prompt.purposes.length > 0
        ? prompt.purposes
        : defaultPurposes(prompt.prompt_type);
    const values = [
      prompt.title,
      prompt.description,
      prompt.prompt_type,
      prompt.module_id,
      JSON.stringify(prompt.hint_points),
      prompt.sample_answer_high,
      prompt.sample_answer_medium,
      prompt.is_locked,
      prompt.time_limit_minutes,
      prompt.is_active,
      prompt.kind ?? 'practice',
      purposes,
      prompt.purpose_note ?? null,
      prompt.stimulus_image ?? null,
      prompt.stimulus_quote ?? null,
      JSON.stringify(buildDecodeGuide(prompt)),
    ];
    const existing = await query<{ id: string }>(
      'SELECT id FROM prompts WHERE title = $1',
      [prompt.title],
    );
    if ((existing.rowCount ?? existing.rows.length) > 0) {
      await query(
        `UPDATE prompts SET
           description = $2, prompt_type = $3, module_id = $4,
           hint_points = $5::jsonb, sample_answer_high = $6,
           sample_answer_medium = $7, is_locked = $8,
           time_limit_minutes = $9, is_active = $10, kind = $11,
           purposes = $12::text[], purpose_note = $13,
           stimulus_image = $14, stimulus_quote = $15, decode_guide = $16::jsonb
         WHERE title = $1`,
        values,
      );
    } else {
      await query(
        `INSERT INTO prompts (
           title, description, prompt_type, module_id, hint_points,
           sample_answer_high, sample_answer_medium, is_locked,
           time_limit_minutes, is_active, kind,
           purposes, purpose_note, stimulus_image, stimulus_quote, decode_guide
         ) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11,$12::text[],$13,$14,$15,$16::jsonb)`,
        values,
      );
    }
  }

  for (const drill of SEED_MINI_DRILLS) {
    await query(
      `INSERT INTO mini_drills (
         slug, module_id, prompt_type, skill, title, stem, options,
         correct_index, explanation, sort_order, is_active, source, student_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10, TRUE, 'seed', NULL)
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
         source = 'seed',
         student_id = NULL`,
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

  for (const drill of SEED_EXTRA_MINI_DRILLS) {
    await query(
      `INSERT INTO mini_drills (
         slug, module_id, prompt_type, skill, title, stem, options,
         correct_index, explanation, sort_order, is_active, source, student_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10, TRUE, 'extra', NULL)
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
         source = 'extra',
         student_id = NULL`,
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

  await query(
    `INSERT INTO writing_schema_meta (id, version, seeded_prompts, seeded_drills)
     VALUES (1, $1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET
       version = EXCLUDED.version,
       seeded_prompts = EXCLUDED.seeded_prompts,
       seeded_drills = EXCLUDED.seeded_drills,
       updated_at = NOW()`,
    [WRITING_SCHEMA, SEED_PROMPTS.length, SEEDED_DRILL_COUNT],
  );

  markSchemaReady();
}

export async function getUnitProgress(
  studentId: string,
): Promise<UnitProgressRow[]> {
  const result = await query<{
    module_id: number;
    prompt_count: string;
    completed_count: string;
  }>(
    `SELECT p.module_id,
            COUNT(DISTINCT p.id)::text AS prompt_count,
            COUNT(DISTINCT CASE WHEN a.id IS NOT NULL THEN p.id END)::text AS completed_count
     FROM prompts p
     LEFT JOIN writing_attempts a
       ON a.prompt_id = p.id
      AND a.student_id = $1
      AND a.draft_number >= 1
     WHERE p.is_active = TRUE
       AND COALESCE(p.kind, 'practice') = 'practice'
     GROUP BY p.module_id
     ORDER BY p.module_id ASC`,
    [studentId],
  );

  return result.rows.map((row) => {
    const promptCount = Number(row.prompt_count);
    const completedCount = Number(row.completed_count);
    return {
      module_id: row.module_id,
      prompt_count: promptCount,
      completed_count: completedCount,
      is_completed: promptCount > 0 && completedCount >= promptCount,
    };
  });
}

export async function getScoreHistory(studentId: string) {
  const result = await query<{
    created_at: Date;
    overall_score: number | null;
    draft_number: number;
    prompt_title: string;
    prompt_type: string;
    module_id: number;
    prompt_id: string;
  }>(
    `SELECT a.created_at, a.overall_score, a.draft_number,
            p.title AS prompt_title, p.prompt_type, p.module_id, p.id AS prompt_id
     FROM writing_attempts a
     JOIN prompts p ON p.id = a.prompt_id
     WHERE a.student_id = $1
     ORDER BY a.created_at ASC`,
    [studentId],
  );

  return result.rows.map((row) => ({
    created_at: row.created_at,
    overall_score: row.overall_score,
    draft_number: row.draft_number,
    prompt_title: row.prompt_title,
    prompt_type: row.prompt_type,
    module_id: row.module_id,
    prompt_id: row.prompt_id,
  }));
}

export async function getMiniProgress(studentId: string) {
  const result = await query<{
    module_id: number;
    drill_count: string;
    completed_count: string;
  }>(
    `SELECT d.module_id,
            COUNT(DISTINCT d.id)::text AS drill_count,
            COUNT(DISTINCT CASE WHEN a.drill_id IS NOT NULL THEN d.id END)::text AS completed_count
     FROM mini_drills d
     LEFT JOIN (
       SELECT DISTINCT drill_id
       FROM mini_drill_attempts
       WHERE student_id = $1
     ) a ON a.drill_id = d.id
     WHERE d.is_active = TRUE
       AND (
         (d.student_id IS NULL AND COALESCE(d.source, 'seed') = 'seed')
         OR d.student_id = $1
         OR (
           d.student_id IS NULL AND d.source = 'extra'
           AND EXISTS (
             SELECT 1 FROM mini_drill_unlocks u
             WHERE u.student_id = $1 AND u.drill_id = d.id
           )
         )
       )
     GROUP BY d.module_id
     ORDER BY d.module_id ASC`,
    [studentId],
  );

  return result.rows.map((row) => ({
    module_id: row.module_id,
    drill_count: Number(row.drill_count),
    completed_count: Number(row.completed_count),
  }));
}

export type TermTestRow = {
  id: string;
  title: string;
  prompt_type: string;
  module_id: number;
  overall_score: number | null;
  sat: boolean;
};

export async function getTermTests(studentId: string): Promise<TermTestRow[]> {
  const result = await query<{
    id: string;
    title: string;
    prompt_type: string;
    module_id: number;
    overall_score: number | null;
    attempt_id: string | null;
  }>(
    `SELECT p.id, p.title, p.prompt_type, p.module_id,
            a.overall_score, a.id AS attempt_id
     FROM prompts p
     LEFT JOIN LATERAL (
       SELECT id, overall_score
       FROM writing_attempts
       WHERE student_id = $1 AND prompt_id = p.id
       ORDER BY draft_number DESC
       LIMIT 1
     ) a ON TRUE
     WHERE p.is_active = TRUE
       AND COALESCE(p.kind, 'practice') = 'test'
     ORDER BY p.module_id ASC, p.title ASC`,
    [studentId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    prompt_type: row.prompt_type,
    module_id: row.module_id,
    overall_score: row.overall_score,
    sat: Boolean(row.attempt_id),
  }));
}

export async function hasCompletedWarmup(
  studentId: string,
  promptId: string,
): Promise<boolean> {
  const result = await query<{ n: string }>(
    `SELECT COUNT(*)::text AS n
     FROM writing_warmups
     WHERE student_id = $1 AND prompt_id = $2`,
    [studentId, promptId],
  );
  return Number(result.rows[0]?.n ?? 0) > 0;
}

async function getLastSatTest(studentId: string) {
  const result = await query<{ title: string; overall_score: number | null }>(
    `SELECT p.title, a.overall_score
     FROM writing_attempts a
     JOIN prompts p ON p.id = a.prompt_id
     WHERE a.student_id = $1
       AND COALESCE(p.kind, 'practice') = 'test'
     ORDER BY a.created_at DESC
     LIMIT 1`,
    [studentId],
  );
  return result.rows[0] ?? null;
}

export async function getGuidanceForStudent(studentId: string): Promise<{
  progress: UnitProgressRow[];
  unlocked_unit: number;
  recommendation: NextTaskRecommendation | null;
  history: Awaited<ReturnType<typeof getScoreHistory>>;
  mini_progress: Awaited<ReturnType<typeof getMiniProgress>>;
  term_tests: TermTestRow[];
  rewards: SeedPatchView;
  week_note: WeekNoteData;
}> {
  const unlocked_unit = 11;
  const [
    progress,
    mini_progress,
    term_tests,
    promptRows,
    attemptRows,
    history,
    rewards,
    lastTest,
  ] = await Promise.all([
    getUnitProgress(studentId),
    getMiniProgress(studentId),
    getTermTests(studentId),
    query<PromptSummary>(
      `SELECT id, title, prompt_type, module_id,
              COALESCE(kind, 'practice') AS kind
       FROM prompts
       WHERE is_active = TRUE
         AND COALESCE(kind, 'practice') = 'practice'
       ORDER BY module_id ASC, title ASC`,
    ),
    query<
      AttemptSummary & { scores_breakdown: AttemptSummary['scores_breakdown'] }
    >(
      `SELECT prompt_id, draft_number, overall_score, scores_breakdown
       FROM writing_attempts
       WHERE student_id = $1
       ORDER BY created_at ASC`,
      [studentId],
    ),
    getScoreHistory(studentId),
    getSeedPatchView(studentId),
    getLastSatTest(studentId),
  ]);

  const recommendation = recommendNextTask(
    promptRows.rows,
    attemptRows.rows,
    unlocked_unit,
  );
  const week_note = buildWeekNote({
    plot_days: rewards.plot_days,
    focused_minutes: rewards.focused_minutes_week,
    lastTest,
    nextFormLabel: recommendation ? typeLabel(recommendation.prompt_type) : null,
    nextTitle: recommendation?.title ?? null,
  });

  return {
    progress,
    unlocked_unit,
    recommendation,
    history,
    mini_progress,
    term_tests,
    rewards,
    week_note,
  };
}

export async function getNextRecommendation(studentId: string) {
  const [promptRows, attemptRows] = await Promise.all([
    query<PromptSummary>(
      `SELECT id, title, prompt_type, module_id,
              COALESCE(kind, 'practice') AS kind
       FROM prompts
       WHERE is_active = TRUE
         AND COALESCE(kind, 'practice') = 'practice'
       ORDER BY module_id ASC, title ASC`,
    ),
    query<AttemptSummary>(
      `SELECT prompt_id, draft_number, overall_score, scores_breakdown
       FROM writing_attempts
       WHERE student_id = $1
       ORDER BY created_at ASC`,
      [studentId],
    ),
  ]);
  return recommendNextTask(promptRows.rows, attemptRows.rows, 11);
}

function emptySkillStats(): SkillStat[] {
  return MINI_SKILLS.map((skill) => ({ skill, attempted: 0, correct: 0 }));
}

export async function getMiniSkillStats(
  studentId: string,
  moduleId?: number,
): Promise<SkillStat[]> {
  const result = await query<{
    skill: string;
    attempted: string;
    correct: string;
  }>(
    moduleId
      ? `SELECT d.skill,
                COUNT(*)::text AS attempted,
                COUNT(*) FILTER (WHERE a.is_correct)::text AS correct
         FROM mini_drill_attempts a
         JOIN mini_drills d ON d.id = a.drill_id
         WHERE a.student_id = $1 AND d.module_id = $2 AND d.is_active = TRUE
         GROUP BY d.skill`
      : `SELECT d.skill,
                COUNT(*)::text AS attempted,
                COUNT(*) FILTER (WHERE a.is_correct)::text AS correct
         FROM mini_drill_attempts a
         JOIN mini_drills d ON d.id = a.drill_id
         WHERE a.student_id = $1 AND d.is_active = TRUE
         GROUP BY d.skill`,
    moduleId ? [studentId, moduleId] : [studentId],
  );

  const bySkill = new Map(
    result.rows.map((row) => [
      row.skill,
      {
        skill: row.skill as MiniSkill,
        attempted: Number(row.attempted),
        correct: Number(row.correct),
      },
    ]),
  );

  return emptySkillStats().map((row) => bySkill.get(row.skill) ?? row);
}

export async function getMissedMiniStems(studentId: string, moduleId: number) {
  const result = await query<{ stem: string; skill: string }>(
    `SELECT d.stem, d.skill
     FROM mini_drill_attempts a
     JOIN mini_drills d ON d.id = a.drill_id
     WHERE a.student_id = $1 AND d.module_id = $2 AND a.is_correct = FALSE
     ORDER BY a.created_at DESC
     LIMIT 8`,
    [studentId, moduleId],
  );
  return result.rows.map((row) => row.stem);
}

export async function getUnitMiniQuestionRefs(studentId: string, moduleId: number) {
  const result = await query<{ title: string; stem: string; options: unknown }>(
    `SELECT title, stem, options
     FROM mini_drills
     WHERE module_id = $1 AND is_active = TRUE
       AND (student_id IS NULL OR student_id = $2)`,
    [moduleId, studentId],
  );
  return result.rows.map((row) => ({
    title: row.title,
    stem: row.stem,
    options: Array.isArray(row.options)
      ? row.options.map((item) => String(item))
      : [],
  }));
}

/** Hide extra questions that copied a starter drill so the student can get new ones. */
export async function deactivateCopiedExtraDrills(
  studentId: string,
  moduleId: number,
) {
  const result = await query<{ id: string }>(
    `UPDATE mini_drills AS extra
     SET is_active = FALSE
     WHERE extra.student_id = $1
       AND extra.module_id = $2
       AND extra.source = 'ai'
       AND extra.is_active = TRUE
       AND EXISTS (
         SELECT 1
         FROM mini_drills AS seed
         WHERE seed.module_id = extra.module_id
           AND seed.student_id IS NULL
           AND seed.is_active = TRUE
           AND (
             lower(btrim(seed.stem)) = lower(btrim(extra.stem))
             OR seed.options = extra.options
           )
       )
     RETURNING extra.id`,
    [studentId, moduleId],
  );
  return result.rowCount ?? result.rows.length;
}

export async function getExtraDrillCounts(studentId: string, moduleId: number) {
  const total = await query<{ n: string }>(
    `SELECT (
        (SELECT COUNT(*) FROM mini_drill_unlocks u
         JOIN mini_drills d ON d.id = u.drill_id
         WHERE u.student_id = $1 AND d.module_id = $2 AND d.is_active = TRUE)
        +
        (SELECT COUNT(*) FROM mini_drills
         WHERE student_id = $1 AND module_id = $2 AND source = 'ai' AND is_active = TRUE)
      )::text AS n`,
    [studentId, moduleId],
  );
  const today = await query<{ n: string }>(
    `SELECT (
        (SELECT COUNT(*) FROM mini_drill_unlocks u
         JOIN mini_drills d ON d.id = u.drill_id
         WHERE u.student_id = $1 AND d.module_id = $2
           AND u.created_at >= date_trunc('day', NOW()))
        +
        (SELECT COUNT(*) FROM mini_drills
         WHERE student_id = $1 AND module_id = $2 AND source = 'ai' AND is_active = TRUE
           AND created_at >= date_trunc('day', NOW()))
      )::text AS n`,
    [studentId, moduleId],
  );
  const maxOrder = await query<{ n: string }>(
    `SELECT COALESCE(MAX(sort_order), 0)::text AS n
     FROM mini_drills
     WHERE module_id = $1 AND is_active = TRUE
       AND (student_id IS NULL OR student_id = $2)`,
    [moduleId, studentId],
  );
  return {
    existing: Number(total.rows[0]?.n ?? 0),
    createdToday: Number(today.rows[0]?.n ?? 0),
    maxSortOrder: Number(maxOrder.rows[0]?.n ?? 0),
  };
}

export async function getMiniExtraMeta(studentId: string, moduleId: number) {
  const unit = getUnitInfo(moduleId);
  const [unitStats, overallStats, counts, attempts] = await Promise.all([
    getMiniSkillStats(studentId, moduleId),
    getMiniSkillStats(studentId),
    getExtraDrillCounts(studentId, moduleId),
    query<AttemptSummary>(
      `SELECT prompt_id, draft_number, overall_score, scores_breakdown
       FROM writing_attempts
       WHERE student_id = $1
       ORDER BY created_at ASC`,
      [studentId],
    ),
  ]);
  const writingWeakest = weakestDimension(attempts.rows);
  const focus = pickMiniFocus({
    unitLabel: unit.title,
    unitStats,
    overallStats,
    writingWeakest,
  });
  return {
    ...extraCapacity(counts.existing, counts.createdToday),
    suggested_skills: focus.skills,
    reason: focus.reason,
    focus,
    counts,
    prompt_type: unit.type,
    unit_label: unit.title,
  };
}

export async function extraIsUnlocked(studentId: string, drillId: string) {
  const result = await query<{ student_id: string }>(
    `SELECT student_id FROM mini_drill_unlocks
     WHERE student_id = $1 AND drill_id = $2
     LIMIT 1`,
    [studentId, drillId],
  );
  return (result.rowCount ?? result.rows.length) > 0;
}

export async function unlockExtraPack(studentId: string, moduleId: number) {
  const extra = await getMiniExtraMeta(studentId, moduleId);
  if (!extra.can_generate || extra.pack_size < 1) {
    return { extra, drills: [] as const, blocked: true as const };
  }

  const unused = await query<{
    id: string;
    slug: string;
    skill: MiniSkill;
    title: string;
    sort_order: number;
  }>(
    `SELECT id, slug, skill, title, sort_order
     FROM mini_drills d
     WHERE d.module_id = $1 AND d.is_active = TRUE
       AND d.source = 'extra' AND d.student_id IS NULL
       AND NOT EXISTS (
         SELECT 1 FROM mini_drill_unlocks u
         WHERE u.student_id = $2 AND u.drill_id = d.id
       )`,
    [moduleId, studentId],
  );

  const picked = selectExtraPack(unused.rows, extra.focus.skills, extra.pack_size);
  if (picked.length === 0) {
    return { extra, drills: [] as const, blocked: true as const };
  }

  for (const drill of picked) {
    await query(
      `INSERT INTO mini_drill_unlocks (student_id, drill_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [studentId, drill.id],
    );
  }

  const refreshed = await getMiniExtraMeta(studentId, moduleId);
  return {
    extra: refreshed,
    reason: extra.reason,
    drills: picked.map((drill) => ({
      id: drill.id,
      slug: drill.slug,
      skill: drill.skill,
      title: drill.title,
      source: 'ai' as const,
      attempted: false,
    })),
    blocked: false as const,
  };
}

export async function assertOwnedStudent(userId: string, studentId: string) {
  const result = await query<{ id: string }>(
    `SELECT id FROM students WHERE id = $1 AND user_id = $2 LIMIT 1`,
    [studentId, userId],
  );
  return result.rows[0] ?? null;
}

type PatchRow = {
  student_id: string;
  lifetime_seeds: number;
  week_seeds: number;
  week_start: string;
  harvest_claimed: boolean;
  plot_days: number;
  last_plot_date: string | null;
  rain_cheques: number;
  focused_seconds_week: number;
};

export type SeedPatchView = {
  lifetime_seeds: number;
  week_seeds: number;
  week_goal: number;
  harvest_claimed: boolean;
  plot_days: number;
  rain_cheques: number;
  focused_minutes_week: number;
  stage: ReturnType<typeof growthStage>;
  recent: { seeds: number; label: string; source: string; created_at: Date }[];
};

export type SeedAwardResult = {
  total: number;
  lines: AwardLine[];
  patch: SeedPatchView;
};

function asDateString(value: string | Date | null): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

async function loadPatchRow(studentId: string): Promise<PatchRow> {
  const today = calendarDateInSydney();
  const weekStart = weekStartSydney(today);
  const existing = await query<PatchRow>(
    `SELECT student_id, lifetime_seeds, week_seeds, week_start::text,
            harvest_claimed, plot_days, last_plot_date::text, rain_cheques,
            focused_seconds_week
     FROM student_seed_patch WHERE student_id = $1`,
    [studentId],
  );
  if (existing.rows[0]) {
    const row = existing.rows[0];
    const storedWeek = asDateString(row.week_start);
    if (storedWeek !== weekStart) {
      await query(
        `UPDATE student_seed_patch SET
           week_seeds = 0, week_start = $2, harvest_claimed = FALSE,
           focused_seconds_week = 0, updated_at = NOW()
         WHERE student_id = $1`,
        [studentId, weekStart],
      );
      return {
        ...row,
        week_seeds: 0,
        week_start: weekStart,
        harvest_claimed: false,
        focused_seconds_week: 0,
      };
    }
    return { ...row, week_start: storedWeek ?? weekStart };
  }

  await query(
    `INSERT INTO student_seed_patch (student_id, week_start)
     VALUES ($1, $2)
     ON CONFLICT (student_id) DO NOTHING`,
    [studentId, weekStart],
  );
  return {
    student_id: studentId,
    lifetime_seeds: 0,
    week_seeds: 0,
    week_start: weekStart,
    harvest_claimed: false,
    plot_days: 0,
    last_plot_date: null,
    rain_cheques: 0,
    focused_seconds_week: 0,
  };
}

async function recentSeedEvents(studentId: string, limit = 6) {
  const result = await query<{
    seeds: number;
    label: string;
    source: string;
    created_at: Date;
  }>(
    `SELECT seeds, label, source, created_at
     FROM seed_events
     WHERE student_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [studentId, limit],
  );
  return result.rows;
}

export async function getSeedPatchView(studentId: string): Promise<SeedPatchView> {
  const row = await loadPatchRow(studentId);
  return {
    lifetime_seeds: row.lifetime_seeds,
    week_seeds: row.week_seeds,
    week_goal: WEEKLY_HARVEST_GOAL,
    harvest_claimed: row.harvest_claimed,
    plot_days: row.plot_days,
    rain_cheques: row.rain_cheques,
    focused_minutes_week: Math.round(row.focused_seconds_week / 60),
    stage: growthStage(row.lifetime_seeds),
    recent: await recentSeedEvents(studentId),
  };
}

async function persistSeedAwards(
  studentId: string,
  lines: AwardLine[],
  extras: {
    source: string;
    meta: Record<string, unknown>;
    focusedSeconds?: number;
  },
): Promise<SeedAwardResult> {
  const today = calendarDateInSydney();
  const row = await loadPatchRow(studentId);
  const plot = nextPlotState({
    plotDays: row.plot_days,
    lastPlotDate: asDateString(row.last_plot_date),
    rainCheques: row.rain_cheques,
    today,
  });

  const activityLines = lines.filter((line) => line.seeds > 0);
  if (activityLines.length === 0 && plot.alreadyCounted) {
    return { total: 0, lines: [], patch: await getSeedPatchView(studentId) };
  }

  const awarded: AwardLine[] = [...activityLines];
  if (plot.milestone) awarded.push(plot.milestone);
  if (plot.gainedCheque) {
    awarded.push({ seeds: 0, label: 'Rain cheque ready — covers one missed day' });
  } else if (plot.usedCheque) {
    awarded.push({ seeds: 0, label: 'Rain cheque used — plot kept going' });
  } else if (plot.reset) {
    awarded.push({ seeds: 0, label: 'New plot day — the run starts again' });
  }

  const activitySeeds = sumSeeds(awarded);
  const harvest = harvestBonus({
    weekSeedsBefore: row.week_seeds,
    justEarned: activitySeeds,
    alreadyClaimed: row.harvest_claimed,
  });
  if (harvest) awarded.push(harvest);

  const total = sumSeeds(awarded);
  const focusedAdd = extras.focusedSeconds ?? 0;

  for (const line of awarded) {
    await query(
      `INSERT INTO seed_events (student_id, source, seeds, label, meta)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [studentId, extras.source, line.seeds, line.label, JSON.stringify(extras.meta)],
    );
  }

  await query(
    `UPDATE student_seed_patch SET
       lifetime_seeds = lifetime_seeds + $2,
       week_seeds = week_seeds + $2,
       harvest_claimed = harvest_claimed OR $3,
       plot_days = $4,
       last_plot_date = $5,
       rain_cheques = $6,
       focused_seconds_week = focused_seconds_week + $7,
       updated_at = NOW()
     WHERE student_id = $1`,
    [
      studentId,
      total,
      Boolean(harvest),
      plot.plotDays,
      plot.lastPlotDate,
      plot.rainCheques,
      focusedAdd,
    ],
  );

  return { total, lines: awarded, patch: await getSeedPatchView(studentId) };
}

export async function awardMiniSeeds(input: {
  studentId: string;
  drillId: string;
  isCorrect: boolean;
  alreadyTried: boolean;
}): Promise<SeedAwardResult> {
  const today = calendarDateInSydney();
  const used = await query<{ n: string }>(
    `SELECT COALESCE(SUM(seeds), 0)::text AS n
     FROM seed_events
     WHERE student_id = $1 AND source = 'mini'
       AND created_at >= ($2::date AT TIME ZONE 'Australia/Sydney')
       AND created_at < (($2::date + 1) AT TIME ZONE 'Australia/Sydney')`,
    [input.studentId, today],
  );
  const mini = seedsForMini({
    isCorrect: input.isCorrect,
    alreadyTried: input.alreadyTried,
    miniSeedsToday: Number(used.rows[0]?.n ?? 0),
  });
  const lines: AwardLine[] = mini.seeds > 0 || mini.label
    ? [{ seeds: mini.seeds, label: mini.label }]
    : [];
  return persistSeedAwards(input.studentId, lines, {
    source: 'mini',
    meta: { drill_id: input.drillId, capped: mini.capped },
  });
}

export async function awardWritingSeeds(input: {
  studentId: string;
  promptId: string;
  kind: 'practice' | 'test';
  draftNumber: number;
  overallScore: number;
  wordCount: number;
  timeSpentSeconds: number;
}): Promise<SeedAwardResult> {
  const lines = seedsForWriting({
    kind: input.kind,
    draftNumber: input.draftNumber,
    overallScore: input.overallScore,
    wordCount: input.wordCount,
    timeSpentSeconds: input.timeSpentSeconds,
  });
  return persistSeedAwards(input.studentId, lines, {
    source: input.kind === 'test' ? 'test' : 'writing',
    meta: {
      prompt_id: input.promptId,
      draft_number: input.draftNumber,
      overall_score: input.overallScore,
    },
    focusedSeconds: focusedSecondsToCount(input.timeSpentSeconds),
  });
}

export async function getAwardsForPrompt(studentId: string, promptId: string) {
  const result = await query<{
    seeds: number;
    label: string;
    source: string;
    created_at: Date;
  }>(
    `SELECT seeds, label, source, created_at
     FROM seed_events
     WHERE student_id = $1 AND meta ->> 'prompt_id' = $2
     ORDER BY created_at DESC
     LIMIT 12`,
    [studentId, promptId],
  );
  return result.rows;
}
