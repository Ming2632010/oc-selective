import { query } from '@/lib/db';
import { makeExamMathFamilyItem } from '@/lib/exam-math-bank';
import {
  emptyExamMathOverview,
  examMathFamilyLabel,
  examMathSetsOfKind,
  examMathSkillLabel,
  findExamMathSet,
  usesExamMathDashboard,
  type ExamMathDifficultyBand,
  type ExamMathOverview,
  type ExamMathQuestion,
  type ExamMathSet,
  type ExamMathSetKind,
} from '@/lib/exam-math';
import { seedExamMathContent } from '@/lib/seed-exam-math-db';
import { seedExamMathSets } from '@/lib/seed-exam-math-sets';

export { seedExamMathSets, seedExamMathContent };

function isMissingExamMathTable(error: unknown): boolean {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code === '42P01') return true;
  const message = error instanceof Error ? error.message : String(error);
  return /exam_math_/i.test(message) && /does not exist/i.test(message);
}

export type ExamMathAccessState = 'ok' | 'not-found' | 'wrong-grade';

export async function getExamMathAccessState(
  userId: string,
  studentId: string,
): Promise<{ state: ExamMathAccessState; grade?: string; name?: string }> {
  const result = await query<{ grade: string; name: string }>(
    `SELECT grade, name FROM students
     WHERE id = $1 AND user_id = $2 AND is_active = TRUE
     LIMIT 1`,
    [studentId, userId],
  );
  const student = result.rows[0];
  if (!student) return { state: 'not-found' };
  if (!usesExamMathDashboard(student.grade)) {
    return { state: 'wrong-grade', grade: student.grade, name: student.name };
  }
  return { state: 'ok', grade: student.grade, name: student.name };
}

export async function requireExamMathStudent(userId: string, studentId: string) {
  const access = await getExamMathAccessState(userId, studentId);
  if (access.state === 'not-found') {
    return { error: 'Student not found', status: 404 as const };
  }
  if (access.state === 'wrong-grade') {
    return {
      error: 'Selective Math is for Year 4–7 profiles. Kindergarten and Year 1 use K–Y1 Maths.',
      status: 403 as const,
    };
  }
  return { student: { id: studentId, grade: access.grade!, name: access.name! } };
}

export type { ExamMathOverview };

function emptyOverview(): ExamMathOverview {
  return emptyExamMathOverview();
}

type SetRow = {
  kind: ExamMathSetKind;
  set_number: number;
  title: string;
  question_count: number;
  time_limit_seconds: number;
  difficulty_band: ExamMathSet['difficultyBand'];
  is_ready: boolean;
  item_count: string;
};

const SET_OVERVIEW_SQL = `SELECT exam_set.kind, exam_set.set_number, exam_set.title, exam_set.question_count,
        exam_set.time_limit_seconds, exam_set.difficulty_band, exam_set.is_ready,
        COUNT(item.id)::text AS item_count
 FROM exam_math_sets exam_set
 LEFT JOIN exam_math_items item
   ON item.set_id = exam_set.id AND item.is_active = TRUE
 GROUP BY exam_set.id
 ORDER BY exam_set.kind ASC, exam_set.set_number ASC`;

export async function getExamMathOverview(studentId: string): Promise<ExamMathOverview> {
  try {
    const [sets, wrongs] = await Promise.all([
      query<SetRow>(SET_OVERVIEW_SQL),
      query<{ n: string }>(
        `SELECT COUNT(DISTINCT family_id)::text AS n FROM exam_math_wrongs
         WHERE student_id = $1 AND is_open = TRUE AND family_id IS NOT NULL`,
        [studentId],
      ),
    ]);

    let setRows = sets.rows;
    const itemTotal = setRows.reduce((sum, row) => sum + Number(row.item_count), 0);
    if (setRows.length === 0 || itemTotal === 0) {
      await seedExamMathContent();
      setRows = (await query<SetRow>(SET_OVERVIEW_SQL)).rows;
    }
    if (setRows.length === 0) return emptyOverview();

    const byKey = new Map(
      setRows.map((row) => [`${row.kind}:${row.set_number}`, row] as const),
    );
    const overlay = (set: ExamMathSet): ExamMathSet => {
      const row = byKey.get(`${set.kind}:${set.setNumber}`);
      if (!row) return set;
      const itemCount = Number(row.item_count);
      return {
        ...set,
        title: row.title,
        isReady: row.is_ready && itemCount >= set.questionCount,
      };
    };
    const minis = examMathSetsOfKind('mini').map(overlay);
    const papers = examMathSetsOfKind('paper').map(overlay);
    return {
      minis,
      papers,
      readyMiniCount: minis.filter((set) => set.isReady).length,
      readyPaperCount: papers.filter((set) => set.isReady).length,
      openWrongCount: Number(wrongs.rows[0]?.n ?? 0),
    };
  } catch (error) {
    if (isMissingExamMathTable(error)) return emptyOverview();
    throw error;
  }
}

export function examMathCatalogueFallback(): ExamMathOverview {
  return emptyExamMathOverview();
}

type QuestionRow = {
  id: string;
  stem: string;
  options: unknown;
  correct_index: number;
};

export async function getExamMathSetQuestions(
  kind: ExamMathSetKind,
  setNumber: number,
): Promise<ExamMathQuestion[]> {
  try {
    const existing = await query<QuestionRow>(
      `SELECT item.id, item.stem, item.options, item.correct_index
       FROM exam_math_items item
       JOIN exam_math_sets exam_set ON exam_set.id = item.set_id
       WHERE exam_set.kind = $1 AND exam_set.set_number = $2 AND item.is_active = TRUE
       ORDER BY item.sort_order ASC`,
      [kind, setNumber],
    );
    if (existing.rows.length === 0) {
      await seedExamMathContent();
    }
    const rows =
      existing.rows.length > 0
        ? existing.rows
        : (
            await query<QuestionRow>(
              `SELECT item.id, item.stem, item.options, item.correct_index
               FROM exam_math_items item
               JOIN exam_math_sets exam_set ON exam_set.id = item.set_id
               WHERE exam_set.kind = $1 AND exam_set.set_number = $2 AND item.is_active = TRUE
               ORDER BY item.sort_order ASC`,
              [kind, setNumber],
            )
          ).rows;
    return rows.map((row) => ({
      id: row.id,
      stem: row.stem,
      options: Array.isArray(row.options) ? row.options.map(String) : [],
      correctIndex: row.correct_index,
    }));
  } catch (error) {
    if (isMissingExamMathTable(error)) return [];
    throw error;
  }
}

export type ExamMathSavedSitting = {
  sittingId: string;
  correct: number;
  marked: number;
  openWrongCount: number;
};

export async function recordExamMathSitting(input: {
  studentId: string;
  kind: ExamMathSetKind;
  setNumber: number;
  answers: Array<{ id: string; chosen: number | null; flagged: boolean }>;
  timedOut: boolean;
  timerHidden: boolean;
}): Promise<ExamMathSavedSitting> {
  const set = findExamMathSet(input.kind, input.setNumber);
  if (!set) throw new Error('Set not found');
  const setRow = await query<{ id: string; time_limit_seconds: number }>(
    `SELECT id, time_limit_seconds FROM exam_math_sets
     WHERE kind = $1 AND set_number = $2
     LIMIT 1`,
    [input.kind, input.setNumber],
  );
  const examSet = setRow.rows[0];
  if (!examSet) throw new Error('Set not found');

  const items = await query<{
    id: string;
    family_id: string | null;
    skill: string | null;
    correct_index: number;
  }>(
    `SELECT id, family_id, skill, correct_index
     FROM exam_math_items
     WHERE set_id = $1 AND is_active = TRUE`,
    [examSet.id],
  );
  const byId = new Map(items.rows.map((row) => [row.id, row]));
  const now = new Date();
  const limitSeconds = examSet.time_limit_seconds > 0 ? examSet.time_limit_seconds : 24 * 60 * 60;
  const sitting = await query<{ id: string }>(
    `INSERT INTO exam_math_sittings (
       student_id, set_id, started_at, deadline_at, submitted_at, timed_out, timer_hidden
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      input.studentId,
      examSet.id,
      now,
      new Date(now.getTime() + limitSeconds * 1000),
      now,
      input.timedOut,
      input.timerHidden,
    ],
  );
  const sittingId = sitting.rows[0]!.id;
  let correct = 0;
  let marked = 0;
  for (const answer of input.answers) {
    const item = byId.get(answer.id);
    if (!item) continue;
    marked += 1;
    const isCorrect = answer.chosen === item.correct_index;
    if (isCorrect) correct += 1;
    await query(
      `INSERT INTO exam_math_answers (
         sitting_id, item_id, chosen_index, flagged, is_correct, answered_at
       ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [sittingId, item.id, answer.chosen, answer.flagged, isCorrect, now],
    );
    if (isCorrect) continue;
    await query(
      `INSERT INTO exam_math_wrongs (
         student_id, item_id, family_id, skill, first_wrong_at, last_wrong_at,
         times_wrong, similar_correct, is_open
       ) VALUES ($1, $2, $3, $4, $5, $5, 1, 0, TRUE)
       ON CONFLICT (student_id, item_id) DO UPDATE SET
         last_wrong_at = EXCLUDED.last_wrong_at,
         times_wrong = exam_math_wrongs.times_wrong + 1,
         is_open = TRUE`,
      [input.studentId, item.id, item.family_id, item.skill, now],
    );
  }
  const open = await countOpenExamMathTypes(input.studentId);
  return { sittingId, correct, marked, openWrongCount: open };
}

export async function countOpenExamMathTypes(studentId: string): Promise<number> {
  const result = await query<{ n: string }>(
    `SELECT COUNT(DISTINCT family_id)::text AS n FROM exam_math_wrongs
     WHERE student_id = $1 AND is_open = TRUE AND family_id IS NOT NULL`,
    [studentId],
  );
  return Number(result.rows[0]?.n ?? 0);
}

export type ExamMathStrengthenType = {
  familyId: string;
  skill: string;
  skillLabel: string;
  familyLabel: string;
  openItems: number;
  timesWrong: number;
  lastWrongAt: string;
};

export async function listExamMathStrengthen(studentId: string): Promise<{
  types: ExamMathStrengthenType[];
  openWrongCount: number;
}> {
  const rows = await query<{
    family_id: string;
    skill: string | null;
    open_items: string;
    times_wrong: string;
    last_wrong_at: Date;
  }>(
    `SELECT family_id, MAX(skill) AS skill, COUNT(*)::text AS open_items,
            MAX(times_wrong)::text AS times_wrong, MAX(last_wrong_at) AS last_wrong_at
     FROM exam_math_wrongs
     WHERE student_id = $1 AND is_open = TRUE AND family_id IS NOT NULL
     GROUP BY family_id
     ORDER BY MAX(last_wrong_at) DESC`,
    [studentId],
  );
  const types = rows.rows.map((row) => ({
    familyId: row.family_id,
    skill: row.skill ?? '',
    skillLabel: examMathSkillLabel(row.skill ?? ''),
    familyLabel: examMathFamilyLabel(row.family_id),
    openItems: Number(row.open_items),
    timesWrong: Number(row.times_wrong),
    lastWrongAt: row.last_wrong_at.toISOString(),
  }));
  return { types, openWrongCount: types.length };
}

export async function nextExamMathStrengthen(
  studentId: string,
  familyId?: string,
): Promise<ExamMathQuestion & { familyId: string; skill: string; familyLabel: string; skillLabel: string }> {
  const source = await query<{
    item_id: string;
    family_id: string;
    skill: string | null;
    difficulty_band: ExamMathDifficultyBand;
  }>(
    `SELECT wrong.item_id, wrong.family_id, wrong.skill, exam_set.difficulty_band
     FROM exam_math_wrongs wrong
     JOIN exam_math_items item ON item.id = wrong.item_id
     JOIN exam_math_sets exam_set ON exam_set.id = item.set_id
     WHERE wrong.student_id = $1 AND wrong.is_open = TRUE
       AND wrong.family_id IS NOT NULL
       AND ($2::text IS NULL OR wrong.family_id = $2)
     ORDER BY wrong.last_wrong_at DESC
     LIMIT 1`,
    [studentId, familyId ?? null],
  );
  const row = source.rows[0];
  if (!row) {
    throw Object.assign(new Error('No Strengthen types waiting'), { status: 404 });
  }
  const used = await query<{ stem: string }>(
    `SELECT stem FROM exam_math_items
     UNION
     SELECT stem FROM exam_math_strengthen_items WHERE student_id = $1`,
    [studentId],
  );
  const minted = makeExamMathFamilyItem({
    familyId: row.family_id,
    band: row.difficulty_band,
    usedStems: used.rows.map((item) => item.stem),
    seed:
      (Date.now() ^
        row.family_id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) ^
        studentId.length * 97) >>>
      0,
  });
  const saved = await query<{ id: string }>(
    `INSERT INTO exam_math_strengthen_items (
       student_id, source_item_id, family_id, skill, stem, options, correct_index, explanation
     ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
     RETURNING id`,
    [
      studentId,
      row.item_id,
      minted.familyId,
      minted.skill,
      minted.stem,
      JSON.stringify(minted.options),
      minted.correctIndex,
      minted.explanation,
    ],
  );
  return {
    id: saved.rows[0]!.id,
    stem: minted.stem,
    options: minted.options,
    correctIndex: minted.correctIndex,
    explanation: minted.explanation,
    familyId: minted.familyId,
    skill: minted.skill,
    familyLabel: examMathFamilyLabel(minted.familyId),
    skillLabel: examMathSkillLabel(minted.skill),
  };
}

export async function attemptExamMathStrengthen(input: {
  studentId: string;
  itemId: string;
  chosen: number | null;
}): Promise<{
  correct: boolean;
  stillOpen: boolean;
  openWrongCount: number;
  explanation: string;
  correctIndex: number;
}> {
  const item = await query<{
    id: string;
    family_id: string;
    correct_index: number;
    explanation: string;
    chosen_index: number | null;
  }>(
    `SELECT id, family_id, correct_index, explanation, chosen_index
     FROM exam_math_strengthen_items
     WHERE id = $1 AND student_id = $2
     LIMIT 1`,
    [input.itemId, input.studentId],
  );
  const row = item.rows[0];
  if (!row) {
    throw Object.assign(new Error('Strengthen question not found'), { status: 404 });
  }
  const correct = input.chosen === row.correct_index;
  if (row.chosen_index === null) {
    await query(
      `UPDATE exam_math_strengthen_items
       SET chosen_index = $2, is_correct = $3, answered_at = NOW()
       WHERE id = $1`,
      [row.id, input.chosen, correct],
    );
    if (correct) {
      await query(
        `UPDATE exam_math_wrongs
         SET similar_correct = similar_correct + 1, is_open = FALSE
         WHERE student_id = $1 AND family_id = $2 AND is_open = TRUE`,
        [input.studentId, row.family_id],
      );
    } else {
      await query(
        `UPDATE exam_math_wrongs
         SET times_wrong = times_wrong + 1, last_wrong_at = NOW()
         WHERE student_id = $1 AND family_id = $2 AND is_open = TRUE`,
        [input.studentId, row.family_id],
      );
    }
  }
  return {
    correct,
    stillOpen: !correct,
    openWrongCount: await countOpenExamMathTypes(input.studentId),
    explanation: row.explanation,
    correctIndex: row.correct_index,
  };
}
