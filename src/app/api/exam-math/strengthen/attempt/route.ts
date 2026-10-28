import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { attemptExamMathStrengthen, requireExamMathPaid } from '@/lib/exam-math-state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'syd1';

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = (await request.json()) as {
      student_id?: string;
      item_id?: string;
      chosen?: number | null;
    };
    if (!body.student_id || !body.item_id) {
      return NextResponse.json({ error: 'student_id and item_id are required' }, { status: 400 });
    }
    const licensed = await requireExamMathPaid(userId, body.student_id);
    if ('error' in licensed) {
      return NextResponse.json({ error: licensed.error }, { status: licensed.status });
    }
    const result = await attemptExamMathStrengthen({
      studentId: body.student_id,
      itemId: body.item_id,
      chosen: typeof body.chosen === 'number' ? body.chosen : null,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to mark Strengthen';
    const status =
      typeof error === 'object' && error && 'status' in error ? Number(error.status) || 500 : 500;
    console.error('[exam-math/strengthen/attempt]', message);
    return NextResponse.json({ error: message }, { status });
  }
}
