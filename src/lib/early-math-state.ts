import { query } from '@/lib/db';
import {
  EARLY_MATH_UNITS,
  mathsPracticePair,
  recommendedUnitOrder,
  type EarlyMathItem,
} from '@/lib/early-math';
import { markEarlyMathItem } from '@/lib/mark-early-math';
import { seedEarlyMathContent } from '@/lib/seed-early-math-db';
import { usesMathsDashboard } from '@/lib/student-grades';
import { awardMathsSeeds, getSeedPatchView } from '@/lib/writing-state';

export { seedEarlyMathContent };

export async function assertMathsStudent(userId: string, studentId: string) {
  const result = await query<{ id: string; grade: string; name: string }>(
    `SELECT id, grade, name FROM students
     WHERE id = $1 AND user_id = $2
     LIMIT 1`,
    [studentId, userId],
  );
  const student = result.rows[0];
  if (!student || !usesMathsDashboard(student.grade)) return null;
  return student;
}

export type MathsAccessState = 'granted' | 'unlicensed' | 'not-found' | 'wrong-grade';

export async function getMathsAccessState(
  userId: string,
  studentId: string,
): Promise<MathsAccessState> {
  const result = await query<{ grade: string; granted: boolean }>(
    `SELECT student.grade,
            EXISTS (
              SELECT 1 FROM user_subscriptions subscription
              WHERE subscription.student_id = student.id
                AND subscription.user_id = student.user_id
                AND subscription.subject = 'math'
                AND subscription.status = 'active'
                AND COALESCE(subscription.access_kind, 'paid') <> 'trial'
                AND (subscription.expires_at IS NULL OR subscription.expires_at > NOW())
            ) AS granted
     FROM students student
     WHERE student.id = $1
       AND student.user_id = $2
     LIMIT 1`,
    [studentId, userId],
  );
  const student = result.rows[0];
  if (!student) return 'not-found';
  if (!usesMathsDashboard(student.grade)) return 'wrong-grade';
  return student.granted ? 'granted' : 'unlicensed';
}

export async function requireLicensedMathsStudent(userId: string, studentId: string) {
  const access = await getMathsAccessState(userId, studentId);
  if (access === 'not-found') {
    return { error: 'Student not found', status: 404 as const };
  }
  if (access === 'wrong-grade') {
    return { error: 'Maths is for Kindergarten and Year 1 profiles', status: 403 as const };
  }
  if (access === 'unlicensed') {
    return { error: 'K–Y1 Maths access is required for this child.', status: 403 as const };
  }
  const student = await assertMathsStudent(userId, studentId);
  if (!student) {
    return { error: 'Maths is for Kindergarten and Year 1 profiles', status: 403 as const };
  }
  return { student };
}

type ItemRow = {
  id: string;
  slug: string;
  unit_id: number;
  skill: string;
  item_kind: string;
  title: string;
  stem: string;
  stimulus: unknown;
  options: unknown;
  correct_index: number | null;
  accepted: unknown;
  explanation: string;
  parent_prompt: string;
  difficulty: string;
  sort_order: number;
};

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

export function publicMathsItem(row: ItemRow, attempted: boolean) {
  return {
    id: row.id,
    slug: row.slug,
    unitId: row.unit_id,
    skill: row.skill,
    kind: row.item_kind,
    title: row.title,
    stem: row.stem,
    stimulus: row.stimulus ?? {},
    options: asStringArray(row.options),
    difficulty: row.difficulty,
    sortOrder: row.sort_order,
    parentPrompt: row.parent_prompt,
    attempted,
  };
}

function toMarkItem(row: ItemRow): Pick<
  EarlyMathItem,
  'kind' | 'correctIndex' | 'accepted' | 'options' | 'explanation'
> {
  return {
    kind: row.item_kind as EarlyMathItem['kind'],
    correctIndex: row.correct_index ?? undefined,
    accepted: asStringArray(row.accepted),
    options: asStringArray(row.options),
    explanation: row.explanation,
  };
}

export async function getMathsOverview(studentId: string, grade: string) {
  const [progressResult, nextTried, rewards] = await Promise.all([
    query<{ unit_id: number; total: string; tried: string; correct: string }>(
      `SELECT i.unit_id,
              COUNT(*)::text AS total,
              COUNT(a.item_id)::text AS tried,
              COUNT(a.item_id) FILTER (WHERE a.is_correct)::text AS correct
       FROM early_math_items i
       LEFT JOIN LATERAL (
         SELECT DISTINCT ON (item_id) item_id, is_correct
         FROM early_math_attempts
         WHERE student_id = $1 AND item_id = i.id
         ORDER BY item_id, created_at DESC
       ) a ON TRUE
       WHERE i.is_active = TRUE
       GROUP BY i.unit_id
       ORDER BY i.unit_id`,
      [studentId],
    ),
    query<{ slug: string; unit_id: number; title: string }>(
      `SELECT i.slug, i.unit_id, i.title
       FROM early_math_items i
       WHERE i.is_active = TRUE
         AND NOT EXISTS (
           SELECT 1 FROM early_math_attempts a
           WHERE a.student_id = $1 AND a.item_id = i.id
         )
       ORDER BY i.unit_id ASC, i.sort_order ASC`,
      [studentId],
    ),
    getSeedPatchView(studentId),
  ]);

  const byUnit = new Map(
    progressResult.rows.map((row) => [
      row.unit_id,
      {
        total: Number(row.total),
        tried: Number(row.tried),
        correct: Number(row.correct),
      },
    ]),
  );

  const order = recommendedUnitOrder(grade);
  const units = order.map((unitId) => {
    const unit = EARLY_MATH_UNITS.find((row) => row.id === unitId);
    if (!unit) throw new Error(`Missing Maths unit ${unitId}`);
    return {
      ...unit,
      total: byUnit.get(unit.id)?.total ?? 0,
      tried: byUnit.get(unit.id)?.tried ?? 0,
      correct: byUnit.get(unit.id)?.correct ?? 0,
    };
  });
  const untried = nextTried.rows;
  const nextRow =
    order
      .map((unitId) => untried.find((row) => row.unit_id === unitId))
      .find(Boolean) ?? untried[0] ?? null;

  return {
    units,
    rewards,
    next: nextRow
      ? {
          slug: nextRow.slug,
          unitId: nextRow.unit_id,
          title: nextRow.title,
          reason:
            grade === 'Year 1'
              ? 'Year 1 starts with parts of 10, then stories and tens.'
              : 'Start by seeing small amounts, then counting.',
        }
      : null,
  };
}

export async function listMathsUnit(studentId: string, unitId: number) {
  const items = await query<ItemRow & { attempted: boolean }>(
    `SELECT i.id, i.slug, i.unit_id, i.skill, i.item_kind, i.title, i.stem,
            i.stimulus, i.options, i.correct_index, i.accepted, i.explanation,
            i.parent_prompt, i.difficulty, i.sort_order,
            EXISTS (
              SELECT 1 FROM early_math_attempts a
              WHERE a.student_id = $1 AND a.item_id = i.id
            ) AS attempted
     FROM early_math_items i
     WHERE i.unit_id = $2 AND i.is_active = TRUE
     ORDER BY i.sort_order ASC`,
    [studentId, unitId],
  );
  return items.rows.map((row) => publicMathsItem(row, row.attempted));
}

export async function getMathsItem(studentId: string, slug: string) {
  const result = await query<ItemRow>(
    `SELECT id, slug, unit_id, skill, item_kind, title, stem, stimulus, options,
            correct_index, accepted, explanation, parent_prompt, difficulty, sort_order
     FROM early_math_items
     WHERE slug = $1 AND is_active = TRUE
     LIMIT 1`,
    [slug],
  );
  const row = result.rows[0];
  if (!row) return null;

  const tried = await query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM early_math_attempts
     WHERE student_id = $1 AND item_id = $2`,
    [studentId, row.id],
  );
  const attempted = Number(tried.rows[0]?.n ?? 0) > 0;

  const history = await query<{
    answer_index: number | null;
    answer_text: string | null;
    is_correct: boolean;
    created_at: Date;
  }>(
    `SELECT answer_index, answer_text, is_correct, created_at
     FROM early_math_attempts
     WHERE student_id = $1 AND item_id = $2
     ORDER BY created_at DESC
     LIMIT 6`,
    [studentId, row.id],
  );

  const unitItems = await listMathsUnit(studentId, row.unit_id);
  const grouped = mathsPracticePair(unitItems, slug);
  const pairItem = grouped?.pair.find((item) => item.slug !== slug) ?? null;

  return {
    item: publicMathsItem(row, attempted),
    pairItem,
    nextSlug: grouped?.nextSlug ?? null,
    attempts: history.rows,
  };
}

export async function submitMathsAnswer(input: {
  studentId: string;
  slug: string;
  answerIndex?: number | null;
  answerText?: string | null;
}) {
  const result = await query<ItemRow>(
    `SELECT id, slug, unit_id, skill, item_kind, title, stem, stimulus, options,
            correct_index, accepted, explanation, parent_prompt, difficulty, sort_order
     FROM early_math_items
     WHERE slug = $1 AND is_active = TRUE
     LIMIT 1`,
    [input.slug],
  );
  const row = result.rows[0];
  if (!row) return null;

  const prior = await query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM early_math_attempts
     WHERE student_id = $1 AND item_id = $2`,
    [input.studentId, row.id],
  );
  const alreadyTried = Number(prior.rows[0]?.n ?? 0) > 0;
  const mark = markEarlyMathItem(toMarkItem(row), {
    index: input.answerIndex,
    text: input.answerText,
  });

  await query(
    `INSERT INTO early_math_attempts (student_id, item_id, answer_index, answer_text, is_correct)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      input.studentId,
      row.id,
      typeof input.answerIndex === 'number' ? input.answerIndex : null,
      input.answerText?.trim() || null,
      mark.isCorrect,
    ],
  );

  const award = await awardMathsSeeds({
    studentId: input.studentId,
    itemId: row.id,
    isCorrect: mark.isCorrect,
    alreadyTried,
  });

  const next = await query<{ slug: string }>(
    `SELECT slug FROM early_math_items
     WHERE is_active = TRUE AND unit_id = $1 AND sort_order > $2
     ORDER BY sort_order ASC
     LIMIT 1`,
    [row.unit_id, row.sort_order],
  );

  return {
    isCorrect: mark.isCorrect,
    explanation: mark.explanation,
    parentPrompt: row.parent_prompt,
    nextSlug: next.rows[0]?.slug ?? null,
    award,
  };
}
