import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { nextExamMathStrengthen, requireExamMathStudent } from '@/lib/exam-math-state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'syd1';

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = (await request.json()) as { student_id?: string; family_id?: string };
    if (!body.student_id) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
    }
    const licensed = await requireExamMathStudent(userId, body.student_id);
    if ('error' in licensed) {
      return NextResponse.json({ error: licensed.error }, { status: licensed.status });
    }
    const question = await nextExamMathStrengthen(body.student_id, body.family_id);
    return NextResponse.json({ question });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to make a Strengthen question';
    const status =
      typeof error === 'object' && error && 'status' in error ? Number(error.status) || 500 : 500;
    console.error('[exam-math/strengthen/next]', message);
    return NextResponse.json({ error: message }, { status });
  }
}
