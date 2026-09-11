import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import {
  getMiniProgress,
  getTermTests,
  getUnitProgress,
  getWritingAccessState,
} from '@/lib/writing-state';
import { UNIT_GROUPS, unitsByGroup, type UnitGroup } from '@/lib/units';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isUnitGroup(value: string | null): value is UnitGroup {
  return Boolean(value && UNIT_GROUPS.includes(value as UnitGroup));
}

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const group = searchParams.get('group');
    if (!studentId || !isUnitGroup(group)) {
      return NextResponse.json({ error: 'student_id and a valid group are required' }, { status: 400 });
    }
    const access = await getWritingAccessState(userId, studentId);
    if (access === 'not-found') return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    if (access === 'unlicensed') {
      return NextResponse.json({ error: 'Selective Writing access is required for this child.' }, { status: 403 });
    }

    const [allProgress, allMini] = await Promise.all([
      getUnitProgress(studentId),
      getMiniProgress(studentId),
    ]);
    const tests = await getTermTests(studentId, allProgress);
    const unitIds = unitsByGroup(group).map((unit) => unit.id);
    return NextResponse.json(
      {
        group,
        progress: allProgress.filter((row) => unitIds.includes(row.module_id)),
        mini_progress: allMini.filter((row) => unitIds.includes(row.module_id)),
        term_tests: tests.filter((row) => unitIds.includes(row.module_id)),
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load unit group';
    console.error('[dashboard/group]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
