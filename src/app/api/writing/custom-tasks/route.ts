import { NextResponse } from 'next/server';
import { appendFileSync } from 'fs';
import { getAuthUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { WRITING_TYPES, type WritingType } from '@/lib/units';
import { getWritingAccessState } from '@/lib/writing-state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_CUSTOM_TASKS = 20;

function debugCustomTask(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>,
) {
  // #region agent log
  try {
    appendFileSync('/opt/cursor/logs/debug.log', `${JSON.stringify({ hypothesisId, location, message, data, timestamp: Date.now() })}\n`);
  } catch {}
  // #endregion
}

function isWritingType(value: unknown): value is WritingType {
  return typeof value === 'string' && WRITING_TYPES.includes(value as WritingType);
}

async function assertAccess(userId: string, studentId: string) {
  const access = await getWritingAccessState(userId, studentId);
  if (access === 'not-found') return { error: 'Student not found', status: 404 };
  if (access === 'unlicensed') {
    return { error: 'Selective Writing access is required for this child.', status: 403 };
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const studentId = new URL(request.url).searchParams.get('student_id');
    if (!studentId) return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
    const denied = await assertAccess(userId, studentId);
    if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });

    const tasks = await query<{
      id: string; title: string; description: string; prompt_type: string;
      created_at: Date; max_draft: string;
    }>(
      `SELECT p.id, p.title, p.description, p.prompt_type, p.created_at,
              COALESCE(MAX(a.draft_number), 0)::text AS max_draft
       FROM prompts p
       LEFT JOIN writing_attempts a ON a.prompt_id = p.id AND a.student_id = $1
       WHERE p.student_id = $1 AND p.kind = 'custom' AND p.is_active = TRUE
       GROUP BY p.id ORDER BY p.created_at DESC`,
      [studentId],
    );
    return NextResponse.json({
      max_tasks: MAX_CUSTOM_TASKS,
      used_tasks: tasks.rows.length,
      tasks: tasks.rows.map((task) => ({ ...task, max_draft: Number(task.max_draft) })),
    });
  } catch (error) {
    console.error('[writing/custom-tasks GET]', error);
    return NextResponse.json({ error: 'Failed to load custom tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    // #region agent log
    debugCustomTask('A', 'src/app/api/writing/custom-tasks/route.ts:73', 'POST authenticated', { hasUserId: Boolean(userId) });
    // #endregion
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = (await request.json()) as {
      student_id?: unknown; question?: unknown; prompt_type?: unknown;
    };
    const studentId = typeof body.student_id === 'string' ? body.student_id : '';
    const question = typeof body.question === 'string' ? body.question.trim() : '';
    // #region agent log
    debugCustomTask('B', 'src/app/api/writing/custom-tasks/route.ts:81', 'POST payload validated', { hasStudentId: Boolean(studentId), questionLength: question.length, validPromptType: isWritingType(body.prompt_type) });
    // #endregion
    if (!studentId || !question || !isWritingType(body.prompt_type)) {
      return NextResponse.json({ error: 'student_id, question, and writing form are required' }, { status: 400 });
    }
    if (question.length > 2_000) {
      return NextResponse.json({ error: 'Custom questions are limited to 2,000 characters.' }, { status: 413 });
    }
    const denied = await assertAccess(userId, studentId);
    // #region agent log
    debugCustomTask('C', 'src/app/api/writing/custom-tasks/route.ts:91', 'POST access checked', { status: denied?.status ?? 200 });
    // #endregion
    if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });

    const inserted = await query<{ id: string; title: string }>(
      `INSERT INTO prompts (
         title, description, prompt_type, module_id, hint_points,
         sample_answer_high, sample_answer_medium, is_locked, time_limit_minutes,
         is_active, kind, student_id
       )
       SELECT $1, $2, $3, 1, '[]'::jsonb, '', '', FALSE, 30, TRUE, 'custom', $4
       WHERE (
         SELECT COUNT(*) FROM prompts
         WHERE student_id = $4 AND kind = 'custom' AND is_active = TRUE
       ) < $5
       RETURNING id, title`,
      [`My custom ${body.prompt_type.replace('_', ' ')} task`, question, body.prompt_type, studentId, MAX_CUSTOM_TASKS],
    );
    // #region agent log
    debugCustomTask('D', 'src/app/api/writing/custom-tasks/route.ts:110', 'POST insert completed', { insertedRows: inserted.rowCount ?? inserted.rows.length });
    // #endregion
    if (!inserted.rows[0]) {
      return NextResponse.json({ error: `Each student can create up to ${MAX_CUSTOM_TASKS} custom tasks.` }, { status: 403 });
    }
    return NextResponse.json({ task: inserted.rows[0], max_tasks: MAX_CUSTOM_TASKS }, { status: 201 });
  } catch (error) {
    // #region agent log
    debugCustomTask('E', 'src/app/api/writing/custom-tasks/route.ts:118', 'POST exception', { name: error instanceof Error ? error.name : typeof error, code: typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : null });
    // #endregion
    console.error('[writing/custom-tasks POST]', error);
    return NextResponse.json({ error: 'Failed to create custom task' }, { status: 500 });
  }
}
