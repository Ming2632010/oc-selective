import { query } from '@/lib/db';
import { extraCapacity, pickMiniFocus, type SkillStat } from '@/lib/mini-weakness';
import { MINI_SKILLS, SEED_MINI_DRILLS, type MiniSkill } from '@/lib/seed-mini-drills';
import { getUnitInfo } from '@/lib/units';
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
const WRITING_SCHEMA = 2;
let appliedSchema = 0;

export async function ensureWritingEnhancements(): Promise<void> {
  if (
    schemaReady &&
    seededLength === SEED_MINI_DRILLS.length &&
    appliedSchema === WRITING_SCHEMA
  ) {
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

  schemaReady = true;
  seededLength = SEED_MINI_DRILLS.length;
  appliedSchema = WRITING_SCHEMA;
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
       AND (d.student_id IS NULL OR d.student_id = $1)
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

export async function getGuidanceForStudent(studentId: string): Promise<{
  progress: UnitProgressRow[];
  unlocked_unit: number;
  recommendation: NextTaskRecommendation | null;
  history: Awaited<ReturnType<typeof getScoreHistory>>;
  mini_progress: Awaited<ReturnType<typeof getMiniProgress>>;
}> {
  const progress = await getUnitProgress(studentId);
  const unlocked_unit = 11;
  const mini_progress = await getMiniProgress(studentId);

  const promptRows = await query<PromptSummary>(
    `SELECT id, title, prompt_type, module_id
     FROM prompts
     WHERE is_active = TRUE
     ORDER BY module_id ASC, title ASC`,
  );

  const attemptRows = await query<
    AttemptSummary & { scores_breakdown: AttemptSummary['scores_breakdown'] }
  >(
    `SELECT prompt_id, draft_number, overall_score, scores_breakdown
     FROM writing_attempts
     WHERE student_id = $1
     ORDER BY created_at ASC`,
    [studentId],
  );

  const recommendation = recommendNextTask(
    promptRows.rows,
    attemptRows.rows,
    unlocked_unit,
  );
  const history = await getScoreHistory(studentId);

  return { progress, unlocked_unit, recommendation, history, mini_progress };
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

export async function getExtraDrillCounts(studentId: string, moduleId: number) {
  const total = await query<{ n: string }>(
    `SELECT COUNT(*)::text AS n
     FROM mini_drills
     WHERE student_id = $1 AND module_id = $2 AND source = 'ai' AND is_active = TRUE`,
    [studentId, moduleId],
  );
  const today = await query<{ n: string }>(
    `SELECT COUNT(*)::text AS n
     FROM mini_drills
     WHERE student_id = $1 AND module_id = $2 AND source = 'ai' AND is_active = TRUE
       AND created_at >= date_trunc('day', NOW())`,
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

export async function assertOwnedStudent(userId: string, studentId: string) {
  const result = await query<{ id: string }>(
    `SELECT id FROM students WHERE id = $1 AND user_id = $2 LIMIT 1`,
    [studentId, userId],
  );
  return result.rows[0] ?? null;
}
