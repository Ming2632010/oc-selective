import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { isRateLimited } from '@/lib/rate-limit';
import { getWritingLicence, startWritingTrial, trialClientFields } from '@/lib/writing-state';
import { WRITING_TRIAL_DRAFTS } from '@/lib/writing-trial';
import {
  examMathTrialClientFields,
  getExamMathLicence,
  startExamMathTrial,
} from '@/lib/exam-math-state';
import { EXAM_MATH_TRIAL_MINI_QUESTIONS, EXAM_MATH_TRIAL_WARMUP_QUESTIONS } from '@/lib/exam-math';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function trialSubject(value: unknown): 'writing' | 'math' {
  return value === 'math' ? 'math' : 'writing';
}

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const url = new URL(request.url);
    const studentId = url.searchParams.get('student_id');
    if (!studentId) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
    }
    const subject = trialSubject(url.searchParams.get('subject'));
    if (subject === 'math') {
      const licence = await getExamMathLicence(userId, studentId);
      if (licence.state === 'not-found') {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }
      return NextResponse.json({
        math_access: licence.state,
        math_trial: examMathTrialClientFields(licence),
      });
    }
    const licence = await getWritingLicence(userId, studentId);
    if (licence.state === 'not-found') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    return NextResponse.json({
      writing_access: licence.state,
      trial: trialClientFields(licence),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load trial';
    console.error('[subscription/start-trial GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (isRateLimited(`start-trial:${userId}`, 5, 10 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many trial attempts. Try again shortly.' }, { status: 429 });
    }

    let body: { student_id?: unknown; subject?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const studentId = typeof body.student_id === 'string' ? body.student_id : '';
    if (!studentId) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
    }
    const subject = trialSubject(body.subject);

    if (subject === 'math') {
      const result = await startExamMathTrial(userId, studentId);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json({
        math_access: 'trial',
        math_trial: {
          eligible: false,
          active: true,
          had_trial: true,
          days_left: result.daysLeft,
          warmup_used: 0,
          warmup_limit: result.warmupLimit ?? EXAM_MATH_TRIAL_WARMUP_QUESTIONS,
          mini_used: 0,
          mini_limit: result.miniLimit ?? EXAM_MATH_TRIAL_MINI_QUESTIONS,
          expires_at: result.expiresAt.toISOString(),
        },
      });
    }

    const result = await startWritingTrial(userId, studentId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({
      writing_access: 'trial',
      trial: {
        eligible: false,
        active: true,
        had_trial: true,
        days_left: result.daysLeft,
        attempts_used: 0,
        attempts_limit: result.attemptsLimit,
        drafts_used: 0,
        drafts_limit: WRITING_TRIAL_DRAFTS,
        mini_used: 0,
        mini_limit: result.miniLimit,
        expires_at: result.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start trial';
    console.error('[subscription/start-trial POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
