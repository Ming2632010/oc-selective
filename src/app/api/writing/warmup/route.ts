import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import {
  publicWarmupQuestions,
  scoreWarmupAnswers,
  warmupBankForPrompt,
} from '@/lib/warmup-questions';
import {
  assertOwnedStudent,
  ensureWritingEnhancements,
  hasCompletedWarmup,
} from '@/lib/writing-state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureWritingEnhancements();

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const promptId = searchParams.get('prompt_id');
    if (!studentId || !promptId) {
      return NextResponse.json(
        { error: 'student_id and prompt_id are required' },
        { status: 400 },
      );
    }

    const owned = await assertOwnedStudent(userId, studentId);
    if (!owned) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const prompt = await query<{ kind: string }>(
      `SELECT COALESCE(kind, 'practice') AS kind
       FROM prompts WHERE id = $1 AND is_active = TRUE LIMIT 1`,
      [promptId],
    );
    if (!prompt.rows[0] || prompt.rows[0].kind !== 'test') {
      return NextResponse.json({ error: 'Warm-up is only for term reviews' }, { status: 400 });
    }

    const completed = await hasCompletedWarmup(studentId, promptId);
    if (completed) {
      return NextResponse.json({ completed: true, questions: [] });
    }

    return NextResponse.json({
      completed: false,
      questions: publicWarmupQuestions(warmupBankForPrompt(promptId)),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load warm-up';
    console.error('[writing/warmup GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureWritingEnhancements();

    let body: { student_id?: unknown; prompt_id?: unknown; answers?: unknown };
    try {
      body = (await request.json()) as {
        student_id?: unknown;
        prompt_id?: unknown;
        answers?: unknown;
      };
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const studentId = isNonEmptyString(body.student_id) ? body.student_id : '';
    const promptId = isNonEmptyString(body.prompt_id) ? body.prompt_id : '';
    if (!studentId || !promptId) {
      return NextResponse.json(
        { error: 'student_id and prompt_id are required' },
        { status: 400 },
      );
    }

    const owned = await assertOwnedStudent(userId, studentId);
    if (!owned) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const prompt = await query<{ kind: string }>(
      `SELECT COALESCE(kind, 'practice') AS kind
       FROM prompts WHERE id = $1 AND is_active = TRUE LIMIT 1`,
      [promptId],
    );
    if (!prompt.rows[0] || prompt.rows[0].kind !== 'test') {
      return NextResponse.json({ error: 'Warm-up is only for term reviews' }, { status: 400 });
    }

    if (await hasCompletedWarmup(studentId, promptId)) {
      return NextResponse.json({ completed: true });
    }

    const questions = warmupBankForPrompt(promptId);
    const scored = scoreWarmupAnswers(questions, body.answers);
    if (!scored) {
      return NextResponse.json({ error: 'Answer every warm-up question' }, { status: 400 });
    }

    await query(
      `INSERT INTO writing_warmups (student_id, prompt_id, answers, correct_count)
       VALUES ($1, $2, $3::jsonb, $4)
       ON CONFLICT (student_id, prompt_id) DO NOTHING`,
      [studentId, promptId, JSON.stringify(scored.answers), scored.correct],
    );

    return NextResponse.json({
      completed: true,
      correct: scored.correct,
      total: questions.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save warm-up';
    console.error('[writing/warmup POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
