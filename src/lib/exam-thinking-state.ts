import { query } from '@/lib/db';
import {
  emptyExamThinkingOverview,
  examThinkingSetsOfKind,
  usesExamThinkingDashboard,
  type ExamThinkingOverview,
  type ExamThinkingSet,
  type ExamThinkingSetKind,
} from '@/lib/exam-thinking';
import { seedExamThinkingSets } from '@/lib/seed-exam-thinking-sets';

export { seedExamThinkingSets };

function isMissingExamThinkingTable(error: unknown): boolean {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code === '42P01') return true;
  const message = error instanceof Error ? error.message : String(error);
  return /exam_thinking_/i.test(message) && /does not exist/i.test(message);
}

export type ExamThinkingAccessState = 'ok' | 'not-found' | 'wrong-grade';

export async function getExamThinkingAccessState(
  userId: string,
  studentId: string,
): Promise<{ state: ExamThinkingAccessState; grade?: string; name?: string }> {
  const result = await query<{ grade: string; name: string }>(
    `SELECT grade, name FROM students
     WHERE id = $1 AND user_id = $2 AND is_active = TRUE
     LIMIT 1`,
    [studentId, userId],
  );
  const student = result.rows[0];
  if (!student) return { state: 'not-found' };
  if (!usesExamThinkingDashboard(student.grade)) {
    return { state: 'wrong-grade', grade: student.grade, name: student.name };
  }
  return { state: 'ok', grade: student.grade, name: student.name };
}

export async function requireExamThinkingStudent(userId: string, studentId: string) {
  const access = await getExamThinkingAccessState(userId, studentId);
  if (access.state === 'not-found') {
    return { error: 'Student not found', status: 404 as const };
  }
  if (access.state === 'wrong-grade') {
    return {
      error:
        'Selective Thinking Skills is for Year 4–7 profiles. Kindergarten and Year 1 use K–Y1 Maths.',
      status: 403 as const,
    };
  }
  return { student: { id: studentId, grade: access.grade!, name: access.name! } };
}

export type { ExamThinkingOverview };

function emptyOverview(): ExamThinkingOverview {
  return emptyExamThinkingOverview();
}

type SetRow = {
  kind: ExamThinkingSetKind;
  set_number: number;
  title: string;
  question_count: number;
  time_limit_seconds: number;
  difficulty_band: ExamThinkingSet['difficultyBand'];
  is_ready: boolean;
  item_count: string;
};

const SET_OVERVIEW_SQL = `SELECT exam_set.kind, exam_set.set_number, exam_set.title, exam_set.question_count,
        exam_set.time_limit_seconds, exam_set.difficulty_band, exam_set.is_ready,
        COUNT(item.id)::text AS item_count
 FROM exam_thinking_sets exam_set
 LEFT JOIN exam_thinking_items item
   ON item.set_id = exam_set.id AND item.is_active = TRUE
 GROUP BY exam_set.id
 ORDER BY exam_set.kind ASC, exam_set.set_number ASC`;

export async function getExamThinkingOverview(studentId: string): Promise<ExamThinkingOverview> {
  try {
    const [sets, wrongs] = await Promise.all([
      query<SetRow>(SET_OVERVIEW_SQL),
      query<{ n: string }>(
        `SELECT COUNT(*)::text AS n FROM exam_thinking_wrongs
         WHERE student_id = $1 AND is_open = TRUE`,
        [studentId],
      ),
    ]);

    let setRows = sets.rows;
    if (setRows.length === 0) {
      await seedExamThinkingSets();
      setRows = (await query<SetRow>(SET_OVERVIEW_SQL)).rows;
    }
    if (setRows.length === 0) return emptyOverview();

    const byKey = new Map(
      setRows.map((row) => [`${row.kind}:${row.set_number}`, row] as const),
    );
    const overlay = (set: ExamThinkingSet): ExamThinkingSet => {
      const row = byKey.get(`${set.kind}:${set.setNumber}`);
      if (!row) return set;
      const itemCount = Number(row.item_count);
      return {
        ...set,
        title: row.title,
        isReady: row.is_ready && itemCount >= set.questionCount,
      };
    };
    const minis = examThinkingSetsOfKind('mini').map(overlay);
    const papers = examThinkingSetsOfKind('paper').map(overlay);
    return {
      minis,
      papers,
      readyMiniCount: minis.filter((set) => set.isReady).length,
      readyPaperCount: papers.filter((set) => set.isReady).length,
      openWrongCount: Number(wrongs.rows[0]?.n ?? 0),
    };
  } catch (error) {
    if (isMissingExamThinkingTable(error)) return emptyOverview();
    throw error;
  }
}

export function examThinkingCatalogueFallback(): ExamThinkingOverview {
  return emptyExamThinkingOverview();
}
