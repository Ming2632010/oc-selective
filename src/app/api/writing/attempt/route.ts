import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { scoreWritingAttempt } from '@/lib/scoring';
import { buildMarkerNotesHeuristic, markerNotesFromUnknown } from '@/lib/marker-notes';
import { termReviewLockMessage } from '@/lib/writing-guidance';
import {
  assertOwnedStudent,
  awardWritingSeeds,
  ensureWritingEnhancements,
  getAwardsForPrompt,
  getGuidanceForStudent,
  getNextRecommendation,
  getTermReviewAccess,
} from '@/lib/writing-state';

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

    if (!studentId) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
    }

    const owned = await assertOwnedStudent(userId, studentId);
    if (!owned) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (!promptId) {
      const guidance = await getGuidanceForStudent(studentId);
      return NextResponse.json({
        progress: guidance.progress,
        unlocked_unit: guidance.unlocked_unit,
        recommendation: guidance.recommendation,
        history: guidance.history,
        mini_progress: guidance.mini_progress,
        term_tests: guidance.term_tests,
        rewards: guidance.rewards,
        week_note: guidance.week_note,
        attempts: [],
      });
    }

    const [attempts, awards, recommendation, promptMeta] = await Promise.all([
      query<{
        id: string;
        content: string;
        marker_notes: unknown;
      }>(
        `SELECT id, student_id, prompt_id, draft_number, content, plan_content,
                score_set_a, score_set_b, overall_score, scores_breakdown,
                ai_feedback, marker_notes, checked_hint_1, checked_hint_2, checked_hint_3,
                word_count, time_spent_seconds, has_seen_sample, created_at
         FROM writing_attempts
         WHERE student_id = $1 AND prompt_id = $2
         ORDER BY draft_number ASC`,
        [studentId, promptId],
      ),
      getAwardsForPrompt(studentId, promptId),
      getNextRecommendation(studentId),
      query<{ prompt_type: string; hint_points: unknown; kind: string }>(
        `SELECT prompt_type, hint_points, kind FROM prompts WHERE id = $1 LIMIT 1`,
        [promptId],
      ),
    ]);

    const promptType = promptMeta.rows[0]?.prompt_type || 'narrative';
    const examStyle = promptMeta.rows[0]?.kind === 'test';
    const hintPoints = Array.isArray(promptMeta.rows[0]?.hint_points)
      ? (promptMeta.rows[0]?.hint_points as string[])
      : [];

    const hydrated = [];
    for (const row of attempts.rows) {
      const existing = markerNotesFromUnknown(row.marker_notes, row.content);
      if (existing) {
        hydrated.push({ ...row, marker_notes: existing });
        continue;
      }
      const notes = buildMarkerNotesHeuristic({
        content: row.content,
        promptType,
        hintPoints: examStyle ? [] : hintPoints,
        examStyle,
      });
      await query(
        `UPDATE writing_attempts SET marker_notes = $1::jsonb WHERE id = $2`,
        [JSON.stringify(notes), row.id],
      );
      hydrated.push({ ...row, marker_notes: notes });
    }

    return NextResponse.json({
      awards,
      attempts: hydrated,
      recommendation,
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

    await ensureWritingEnhancements();

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
      title: string;
      description: string;
      prompt_type: string;
      module_id: number;
      hint_points: unknown;
      is_locked: boolean;
      is_active: boolean;
      kind: string;
    }>(
      `SELECT id, title, description, prompt_type, module_id, hint_points,
              is_locked, is_active, COALESCE(kind, 'practice') AS kind
       FROM prompts WHERE id = $1 LIMIT 1`,
      [promptId],
    );
    const prompt = promptResult.rows[0];
    if (!prompt || !prompt.is_active) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    const isTest = prompt.kind === 'test';

    const existing = await query<{ draft_number: number }>(
      `SELECT draft_number FROM writing_attempts
       WHERE student_id = $1 AND prompt_id = $2
       ORDER BY draft_number DESC`,
      [studentId, promptId],
    );
    const maxDraft = existing.rows[0]?.draft_number ?? 0;

    if (isTest) {
      if (existing.rows.length > 0 || draftNumber !== 1) {
        return NextResponse.json(
          { error: 'This test can only be sat once.' },
          { status: 409 },
        );
      }
      const access = await getTermReviewAccess(studentId, prompt.module_id);
      if (access.locked) {
        return NextResponse.json(
          { error: termReviewLockMessage(access) },
          { status: 403 },
        );
      }
    } else {
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
    }

    const hintPoints = Array.isArray(prompt.hint_points)
      ? (prompt.hint_points as string[])
      : [];

    const scored = await scoreWritingAttempt({
      content,
      hintPoints: isTest ? [] : hintPoints,
      promptType: prompt.prompt_type,
      promptTitle: prompt.title,
      promptDescription: prompt.description,
      examStyle: isTest,
    });

    const inserted = await query(
      `INSERT INTO writing_attempts (
         student_id, prompt_id, draft_number, content, plan_content,
         score_set_a, score_set_b, overall_score, scores_breakdown,
         ai_feedback, marker_notes, checked_hint_1, checked_hint_2, checked_hint_3,
         word_count, time_spent_seconds, has_seen_sample
       ) VALUES (
         $1,$2,$3,$4,$5,
         $6,$7,$8,$9,
         $10,$11::jsonb,$12,$13,$14,
         $15,$16,$17
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
        JSON.stringify(scored.marker_notes),
        scored.checked_hint_1,
        scored.checked_hint_2,
        scored.checked_hint_3,
        scored.word_count,
        timeSpent,
        hasSeenSample,
      ],
    );

    const award = await awardWritingSeeds({
      studentId,
      promptId,
      kind: isTest ? 'test' : 'practice',
      draftNumber,
      overallScore: scored.overall_score,
      wordCount: scored.word_count,
      timeSpentSeconds: timeSpent,
    });
    const guidance = await getGuidanceForStudent(studentId);

    return NextResponse.json(
      {
        attempt: inserted.rows[0],
        award,
        progress: guidance.progress,
        unlocked_unit: guidance.unlocked_unit,
        recommendation: guidance.recommendation,
        rewards: guidance.rewards,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save attempt';
    console.error('[writing/attempt POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
