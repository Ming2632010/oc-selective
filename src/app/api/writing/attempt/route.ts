import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { scoreWritingAttempt } from '@/lib/scoring';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AttemptBody = {
  student_id?: unknown;
  prompt_id?: unknown;
  draft_number?: unknown;
  content?: unknown;
  plan_content?: unknown;
  time_spent_seconds?: unknown;
  has_seen_sample?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

async function assertOwnedStudent(userId: string, studentId: string) {
  const result = await query<{ id: string }>(
    `SELECT id FROM students WHERE id = $1 AND user_id = $2 LIMIT 1`,
    [studentId, userId],
  );
  return result.rows[0] ?? null;
}

async function getModuleProgress(studentId: string) {
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

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const promptId = searchParams.get('prompt_id');

    if (!studentId) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
    }

    const owned = await assertOwnedStudent(userId, studentId);
    if (!owned) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const progress = await getModuleProgress(studentId);

    if (!promptId) {
      return NextResponse.json({ progress, attempts: [] });
    }

    const attempts = await query(
      `SELECT id, student_id, prompt_id, draft_number, content, plan_content,
              score_set_a, score_set_b, overall_score, scores_breakdown,
              ai_feedback, checked_hint_1, checked_hint_2, checked_hint_3,
              word_count, time_spent_seconds, has_seen_sample, created_at
       FROM writing_attempts
       WHERE student_id = $1 AND prompt_id = $2
       ORDER BY draft_number ASC`,
      [studentId, promptId],
    );

    return NextResponse.json({
      progress,
      attempts: attempts.rows,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load attempts';
    console.error('[writing/attempt GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: AttemptBody;
    try {
      body = (await request.json()) as AttemptBody;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const studentId = isNonEmptyString(body.student_id) ? body.student_id : '';
    const promptId = isNonEmptyString(body.prompt_id) ? body.prompt_id : '';
    const content = isNonEmptyString(body.content) ? body.content : '';
    const planContent =
      typeof body.plan_content === 'string' ? body.plan_content : null;
    const draftNumber = Number(body.draft_number);
    const timeSpent =
      typeof body.time_spent_seconds === 'number' && body.time_spent_seconds >= 0
        ? Math.floor(body.time_spent_seconds)
        : 0;
    const hasSeenSample = body.has_seen_sample === true;

    if (!studentId || !promptId || !content) {
      return NextResponse.json(
        { error: 'student_id, prompt_id, and content are required' },
        { status: 400 },
      );
    }

    if (![1, 2, 3].includes(draftNumber)) {
      return NextResponse.json(
        { error: 'draft_number must be 1, 2, or 3' },
        { status: 400 },
      );
    }

    const owned = await assertOwnedStudent(userId, studentId);
    if (!owned) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const promptResult = await query<{
      id: string;
      prompt_type: string;
      hint_points: unknown;
      is_locked: boolean;
      is_active: boolean;
    }>(
      `SELECT id, prompt_type, hint_points, is_locked, is_active
       FROM prompts WHERE id = $1 LIMIT 1`,
      [promptId],
    );
    const prompt = promptResult.rows[0];
    if (!prompt || !prompt.is_active) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }
    if (prompt.is_locked) {
      return NextResponse.json(
        { error: 'This prompt is locked' },
        { status: 403 },
      );
    }

    const existing = await query<{ draft_number: number }>(
      `SELECT draft_number FROM writing_attempts
       WHERE student_id = $1 AND prompt_id = $2
       ORDER BY draft_number DESC`,
      [studentId, promptId],
    );
    const maxDraft = existing.rows[0]?.draft_number ?? 0;

    if (existing.rows.some((row) => row.draft_number === draftNumber)) {
      return NextResponse.json(
        { error: `Draft ${draftNumber} already exists for this prompt` },
        { status: 409 },
      );
    }

    if (draftNumber !== maxDraft + 1) {
      return NextResponse.json(
        {
          error:
            maxDraft === 0
              ? 'Start with draft_number 1'
              : `Next draft must be ${maxDraft + 1}`,
        },
        { status: 400 },
      );
    }

    const hintPoints = Array.isArray(prompt.hint_points)
      ? (prompt.hint_points as string[])
      : [];

    const scored = scoreWritingAttempt({
      content,
      hintPoints,
      promptType: prompt.prompt_type,
    });

    const inserted = await query(
      `INSERT INTO writing_attempts (
         student_id, prompt_id, draft_number, content, plan_content,
         score_set_a, score_set_b, overall_score, scores_breakdown,
         ai_feedback, checked_hint_1, checked_hint_2, checked_hint_3,
         word_count, time_spent_seconds, has_seen_sample
       ) VALUES (
         $1,$2,$3,$4,$5,
         $6,$7,$8,$9,
         $10,$11,$12,$13,
         $14,$15,$16
       )
       RETURNING *`,
      [
        studentId,
        promptId,
        draftNumber,
        content,
        planContent,
        scored.score_set_a,
        scored.score_set_b,
        scored.overall_score,
        JSON.stringify(scored.scores_breakdown),
        scored.ai_feedback,
        scored.checked_hint_1,
        scored.checked_hint_2,
        scored.checked_hint_3,
        scored.word_count,
        timeSpent,
        hasSeenSample,
      ],
    );

    const progress = await getModuleProgress(studentId);

    return NextResponse.json(
      {
        attempt: inserted.rows[0],
        progress,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save attempt';
    console.error('[writing/attempt POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
