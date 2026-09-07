import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    let body: { subscription_id?: unknown; student_id?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const subscriptionId = typeof body.subscription_id === 'string' ? body.subscription_id : '';
    const studentId = typeof body.student_id === 'string' ? body.student_id : '';
    if (!subscriptionId || !studentId) {
      return NextResponse.json(
        { error: 'subscription_id and student_id are required' },
        { status: 400 },
      );
    }

    const assigned = await query<{ id: string; subject: string; student_id: string }>(
      `UPDATE user_subscriptions AS subscription
       SET student_id = $3, updated_at = NOW()
       WHERE subscription.id = $1
         AND subscription.user_id = $2
         AND subscription.student_id IS NULL
         AND subscription.subject = 'writing'
         AND subscription.status = 'active'
         AND (subscription.expires_at IS NULL OR subscription.expires_at > NOW())
         AND EXISTS (
           SELECT 1 FROM students student
           WHERE student.id = $3 AND student.user_id = $2 AND student.is_active = TRUE
         )
       RETURNING subscription.id, subscription.subject, subscription.student_id`,
      [subscriptionId, userId, studentId],
    );
    if (!assigned.rows[0]) {
      return NextResponse.json(
        { error: 'This Writing access is unavailable or the child was not found.' },
        { status: 404 },
      );
    }
    return NextResponse.json({ subscription: assigned.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    console.error('[subscription/assign-legacy]', error);
    if (message.includes('uq_active_writing_subscription_per_student')) {
      return NextResponse.json(
        { error: 'This child already has active Selective Writing access.' },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: 'Unable to assign Writing access. Please try again.' },
      { status: 500 },
    );
  }
}
