import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import {
  assertOwnedStudent,
  deactivateCopiedExtraDrills,
  unlockExtraPack,
} from '@/lib/writing-state';
import { isRateLimited } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { student_id?: unknown; module_id?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const studentId = typeof body.student_id === 'string' ? body.student_id : '';
    const moduleId = Number(body.module_id);
    if (!studentId || !Number.isInteger(moduleId) || moduleId < 1 || moduleId > 11) {
      return NextResponse.json(
        { error: 'student_id and module_id are required' },
        { status: 400 },
      );
    }

    const owned = await assertOwnedStudent(userId, studentId);
    if (!owned) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    if (isRateLimited(`drill-generation:${studentId}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many requests for extra questions. Please try again later.' },
        { status: 429 },
      );
    }

    await deactivateCopiedExtraDrills(studentId, moduleId);

    const unlocked = await unlockExtraPack(studentId, moduleId);
    if (unlocked.blocked || unlocked.drills.length === 0) {
      return NextResponse.json(
        {
          error:
            unlocked.extra.remaining_unit <= 0
              ? 'That’s enough extra questions for this unit. Try the full writing task.'
              : unlocked.extra.remaining_today <= 0
                ? 'Come back tomorrow for more extra questions in this unit.'
                : 'That’s all the extra questions for this unit right now.',
          extra: unlocked.extra,
        },
        { status: 429 },
      );
    }

    return NextResponse.json({
      reason: unlocked.reason,
      drills: unlocked.drills,
      extra: {
        can_generate: unlocked.extra.can_generate,
        remaining_today: unlocked.extra.remaining_today,
        remaining_unit: unlocked.extra.remaining_unit,
        suggested_skills: unlocked.extra.suggested_skills,
        reason: unlocked.extra.reason,
      },
    });
  } catch (error) {
    console.error('[writing/drills/generate]', error);
    return NextResponse.json(
      { error: 'Unable to add extra questions. Please try again.' },
      { status: 500 },
    );
  }
}
