import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { scoreWritingAttempt } from '@/lib/scoring';
import { awardWritingSeeds, getWritingAccessState } from '@/lib/writing-state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type MarkingAttempt = {
  id: string;
  student_id: string;
  prompt_id: string;
  draft_number: number;
  content: string;
  time_spent_seconds: number;
  prompt_type: string;
  title: string;
  description: string;
  hint_points: unknown;
  kind: string;
};

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json()) as { student_id?: unknown; attempt_id?: unknown };
    const studentId = typeof body.student_id === 'string' ? body.student_id : '';
    const attemptId = typeof body.attempt_id === 'string' ? body.attempt_id : '';
    if (!studentId || !attemptId) {
      return NextResponse.json({ error: 'student_id and attempt_id are required' }, { status: 400 });
    }
    if ((await getWritingAccessState(userId, studentId)) !== 'granted') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const claimed = await query<MarkingAttempt>(
      `UPDATE writing_attempts attempt
       SET marking_status = 'marking', marking_started_at = NOW()
       FROM prompts prompt
       WHERE attempt.id = $1
         AND attempt.student_id = $2
         AND attempt.prompt_id = prompt.id
         AND attempt.marking_status = 'pending'
       RETURNING attempt.id, attempt.student_id, attempt.prompt_id, attempt.draft_number,
                 attempt.content, attempt.time_spent_seconds, prompt.prompt_type,
                 prompt.title, prompt.description, prompt.hint_points,
                 COALESCE(prompt.kind, 'practice') AS kind`,
      [attemptId, studentId],
    );
    const attempt = claimed.rows[0];
    if (!attempt) {
      const current = await query<{ marking_status: string }>(
        `SELECT marking_status FROM writing_attempts WHERE id = $1 AND student_id = $2`,
        [attemptId, studentId],
      );
      return NextResponse.json({
        marking_status: current.rows[0]?.marking_status ?? 'not-found',
      });
    }

    const hintPoints = Array.isArray(attempt.hint_points)
      ? (attempt.hint_points as string[])
      : [];
    const examStyle = attempt.kind === 'test' || attempt.kind === 'bonus';
    const scored = await scoreWritingAttempt({
      content: attempt.content,
      hintPoints: examStyle ? [] : hintPoints,
      promptType: attempt.prompt_type,
      promptTitle: attempt.title,
      promptDescription: attempt.description,
      examStyle,
    });

    await query(
      `UPDATE writing_attempts SET
         score_set_a = $1, score_set_b = $2, overall_score = $3,
         scores_breakdown = $4::jsonb, ai_feedback = $5, marker_notes = $6::jsonb,
         checked_hint_1 = $7, checked_hint_2 = $8, checked_hint_3 = $9,
         word_count = $10, marking_status = 'complete', marked_at = NOW()
       WHERE id = $11 AND marking_status = 'marking'`,
      [
        scored.score_set_a, scored.score_set_b, scored.overall_score,
        JSON.stringify(scored.scores_breakdown), scored.ai_feedback,
        JSON.stringify(scored.marker_notes), scored.checked_hint_1,
        scored.checked_hint_2, scored.checked_hint_3, scored.word_count, attempt.id,
      ],
    );
    await awardWritingSeeds({
      studentId,
      promptId: attempt.prompt_id,
      kind: attempt.kind === 'bonus' ? 'bonus' : examStyle ? 'test' : 'practice',
      draftNumber: attempt.draft_number,
      overallScore: scored.overall_score,
      wordCount: scored.word_count,
      timeSpentSeconds: attempt.time_spent_seconds,
    });
    return NextResponse.json({ marking_status: 'complete' });
  } catch (error) {
    console.error('[writing/attempt/mark POST]', error);
    return NextResponse.json({ error: 'Unable to mark this attempt. Please try again.' }, { status: 500 });
  }
}
