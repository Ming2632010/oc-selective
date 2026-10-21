import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { listExamMathStrengthen, requireExamMathStudent } from '@/lib/exam-math-state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'syd1';

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const studentId = new URL(request.url).searchParams.get('student_id');
    if (!studentId) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
    }
    const licensed = await requireExamMathStudent(userId, studentId);
    if ('error' in licensed) {
      return NextResponse.json({ error: licensed.error }, { status: licensed.status });
    }
    const listed = await listExamMathStrengthen(studentId);
    return NextResponse.json(
      { ...listed, student: licensed.student },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load Strengthen';
    console.error('[exam-math/strengthen GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
