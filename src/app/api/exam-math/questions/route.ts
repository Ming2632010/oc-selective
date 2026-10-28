import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import {
  assertExamMathSetAccess,
  getExamMathSetQuestions,
  requireExamMathProduct,
} from '@/lib/exam-math-state';
import { findExamMathSet, isExamMathSetKind } from '@/lib/exam-math';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'syd1';

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const url = new URL(request.url);
    const studentId = url.searchParams.get('student_id');
    const kind = url.searchParams.get('kind');
    const n = Number(url.searchParams.get('n'));
    if (!studentId) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
    }
    if (!isExamMathSetKind(kind) || !Number.isInteger(n)) {
      return NextResponse.json({ error: 'kind and n are required' }, { status: 400 });
    }
    const licensed = await requireExamMathProduct(userId, studentId);
    if ('error' in licensed) {
      return NextResponse.json({ error: licensed.error }, { status: licensed.status });
    }
    const blocked = await assertExamMathSetAccess(licensed.licence, kind, n, 'read');
    if (blocked) {
      return NextResponse.json({ error: blocked.error }, { status: blocked.status });
    }
    const set = findExamMathSet(kind, n);
    if (!set) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 });
    }
    const questions = await getExamMathSetQuestions(kind, n);
    return NextResponse.json(
      { set, questions },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load questions';
    console.error('[exam-math/questions]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
