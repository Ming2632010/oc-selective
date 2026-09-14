import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { WRITING_TYPES, type WritingType } from '@/lib/units';
import { getWritingAccessState } from '@/lib/writing-state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_CUSTOM_TASKS = 20;

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
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = (await request.json()) as {
      student_id?: unknown; question?: unknown; prompt_type?: unknown;
    };
    const studentId = typeof body.student_id === 'string' ? body.student_id : '';
    const question = typeof body.question === 'string' ? body.question.trim() : '';
    if (!studentId || !question || !isWritingType(body.prompt_type)) {
      return NextResponse.json({ error: 'student_id, question, and writing form are required' }, { status: 400 });
    }
    if (question.length > 2_000) {
      return NextResponse.json({ error: 'Custom questions are limited to 2,000 characters.' }, { status: 413 });
    }
    const denied = await assertAccess(userId, studentId);
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
    if (!inserted.rows[0]) {
      return NextResponse.json({ error: `Each student can create up to ${MAX_CUSTOM_TASKS} custom tasks.` }, { status: 403 });
    }
    return NextResponse.json({ task: inserted.rows[0], max_tasks: MAX_CUSTOM_TASKS }, { status: 201 });
  } catch (error) {
    console.error('[writing/custom-tasks POST]', error);
    return NextResponse.json({ error: 'Failed to create custom task' }, { status: 500 });
  }
}
