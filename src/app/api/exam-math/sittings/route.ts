import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { recordExamMathSitting, requireExamMathStudent } from '@/lib/exam-math-state';
import { type ExamMathSetKind } from '@/lib/exam-math';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'syd1';

function isSetKind(value: unknown): value is ExamMathSetKind {
  return value === 'mini' || value === 'paper';
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = (await request.json()) as {
      student_id?: string;
      kind?: string;
      n?: number;
      answers?: Array<{ id?: string; chosen?: number | null; flagged?: boolean }>;
      timed_out?: boolean;
      timer_hidden?: boolean;
    };
    if (!body.student_id || !isSetKind(body.kind) || !Number.isInteger(body.n)) {
      return NextResponse.json({ error: 'student_id, kind and n are required' }, { status: 400 });
    }
    const licensed = await requireExamMathStudent(userId, body.student_id);
    if ('error' in licensed) {
      return NextResponse.json({ error: licensed.error }, { status: licensed.status });
    }
    const saved = await recordExamMathSitting({
      studentId: body.student_id,
      kind: body.kind,
      setNumber: body.n!,
      answers: (body.answers ?? [])
        .filter((answer): answer is { id: string; chosen: number | null; flagged: boolean } =>
          typeof answer.id === 'string',
        )
        .map((answer) => ({
          id: answer.id,
          chosen: typeof answer.chosen === 'number' ? answer.chosen : null,
          flagged: Boolean(answer.flagged),
        })),
      timedOut: Boolean(body.timed_out),
      timerHidden: Boolean(body.timer_hidden),
    });
    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save sitting';
    console.error('[exam-math/sittings]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
