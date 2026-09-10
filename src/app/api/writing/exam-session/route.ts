import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { isExamStyleKind } from '@/lib/seed-prompts';
import {
  assertOwnedStudent,
  getBonusExamAccess,
  getTermReviewAccess,
  hasCompletedWarmup,
  startWritingExamSession,
} from '@/lib/writing-state';
import { bonusExamLockMessage, termReviewLockMessage } from '@/lib/writing-guidance';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { student_id?: unknown; prompt_id?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const studentId = typeof body.student_id === 'string' ? body.student_id : '';
    const promptId = typeof body.prompt_id === 'string' ? body.prompt_id : '';
    if (!studentId || !promptId) {
      return NextResponse.json({ error: 'student_id and prompt_id are required' }, { status: 400 });
    }

    if (!(await assertOwnedStudent(userId, studentId))) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const promptResult = await query<{
      kind: string;
      module_id: number;
      time_limit_minutes: number;
    }>(
      `SELECT COALESCE(kind, 'practice') AS kind, module_id, time_limit_minutes
       FROM prompts WHERE id = $1 AND is_active = TRUE LIMIT 1`,
      [promptId],
    );
    const prompt = promptResult.rows[0];
    if (!prompt || !isExamStyleKind(prompt.kind)) {
      return NextResponse.json({ error: 'Exam paper not found' }, { status: 404 });
    }

    if (!(await hasCompletedWarmup(studentId, promptId))) {
      return NextResponse.json({ error: 'Complete the warm-up before starting.' }, { status: 403 });
    }

    const attempted = await query<{ id: string }>(
      `SELECT id FROM writing_attempts WHERE student_id = $1 AND prompt_id = $2 LIMIT 1`,
      [studentId, promptId],
    );
    if (attempted.rows[0]) {
      return NextResponse.json({ error: 'This paper can only be sat once.' }, { status: 409 });
    }

    if (prompt.kind === 'bonus') {
      const access = await getBonusExamAccess(studentId);
      if (access.locked) {
        return NextResponse.json({ error: bonusExamLockMessage(access) }, { status: 403 });
      }
    } else {
      const access = await getTermReviewAccess(studentId, prompt.module_id);
      if (access.locked) {
        return NextResponse.json({ error: termReviewLockMessage(access) }, { status: 403 });
      }
    }

    const session = await startWritingExamSession(
      studentId,
      promptId,
      prompt.time_limit_minutes || 30,
    );
    return NextResponse.json({
      started_at: session.started_at.toISOString(),
      deadline_at: session.deadline_at.toISOString(),
      submitted_at: session.submitted_at?.toISOString() ?? null,
    });
  } catch (error) {
    console.error('[writing/exam-session POST]', error);
    return NextResponse.json({ error: 'Unable to start this exam. Please try again.' }, { status: 500 });
  }
}
