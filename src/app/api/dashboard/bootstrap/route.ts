import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { isSubscriptionActive } from '@/lib/subscription';
import { getDashboardOverview, getWritingLicence, applyWritingTrialLimits, trialClientFields } from '@/lib/writing-state';
import { hasWritingProductAccess } from '@/lib/writing-trial';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [userResult, studentResult, subscriptionResult] = await Promise.all([
      query<{ id: string; email: string; full_name: string }>(
        'SELECT id, email, full_name FROM users WHERE id = $1 LIMIT 1',
        [userId],
      ),
      query<{ id: string; name: string; grade: string; is_active: boolean }>(
        `SELECT id, name, grade, is_active FROM students
         WHERE user_id = $1 ORDER BY created_at ASC`,
        [userId],
      ),
      query<{
        id: string; subject: string; student_id: string | null; status: string; expires_at: Date | null;
        access_kind: string | null;
      }>(
        `SELECT id, subject, student_id, status, expires_at, COALESCE(access_kind, 'paid') AS access_kind
         FROM user_subscriptions
         WHERE user_id = $1 ORDER BY subject ASC, created_at DESC`,
        [userId],
      ),
    ]);
    const user = userResult.rows[0];
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const requested = new URL(request.url).searchParams.get('student_id');
    const students = studentResult.rows;
    const selectedStudentId =
      (requested && students.some((student) => student.id === requested) ? requested : null) ??
      students[0]?.id ??
      null;
    const subscriptions = subscriptionResult.rows.map((row) => ({
      ...row,
      expires_at: row.expires_at ? new Date(row.expires_at).toISOString() : null,
      access_kind: row.access_kind === 'trial' ? 'trial' : 'paid',
      active: isSubscriptionActive(row.status, row.expires_at),
    }));

    const licence = selectedStudentId
      ? await getWritingLicence(userId, selectedStudentId)
      : null;
    const writingAccess = licence?.state ?? 'not-found';
    const guidance =
      selectedStudentId && licence && hasWritingProductAccess(licence.state)
        ? applyWritingTrialLimits(await getDashboardOverview(selectedStudentId), licence)
        : null;

    return NextResponse.json(
      {
        user,
        students,
        subscriptions,
        has_active: subscriptions.some((subscription) => subscription.active),
        selected_student_id: selectedStudentId,
        writing_access: writingAccess,
        trial: licence && writingAccess !== 'not-found'
          ? trialClientFields(licence)
          : null,
        guidance,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load dashboard';
    console.error('[dashboard/bootstrap]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
