import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import {
  assertOwnedStudent,
  ensureWritingEnhancements,
  getSeedPatchView,
} from '@/lib/writing-state';
import { buildSeedPatchScene } from '@/lib/rewards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    if (!studentId) {
      return NextResponse.json(
        { error: 'student_id is required' },
        { status: 400 },
      );
    }

    await ensureWritingEnhancements();

    const owned = await assertOwnedStudent(userId, studentId);
    if (!owned) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const patch = await getSeedPatchView(studentId);
    const scene =
      patch.scene ??
      buildSeedPatchScene({
        lifetimeSeeds: patch.lifetime_seeds,
        completedTasks: patch.completed_tasks,
        weeklyHarvests: patch.weekly_harvests,
      });

    return NextResponse.json({
      lifetime_seeds: patch.lifetime_seeds,
      week_seeds: patch.week_seeds,
      week_goal: patch.week_goal,
      harvest_claimed: patch.harvest_claimed,
      scene,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load garden';
    console.error('[dashboard/stats]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
