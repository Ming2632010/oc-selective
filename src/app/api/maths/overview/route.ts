import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { getMathsOverview, assertMathsStudent } from '@/lib/early-math-state';

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
    const student = await assertMathsStudent(userId, studentId);
    if (!student) {
      return NextResponse.json({ error: 'Maths is for Kindergarten and Year 1 profiles' }, { status: 403 });
    }
    const overview = await getMathsOverview(studentId, student.grade);
    return NextResponse.json(overview, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load Maths';
    console.error('[maths/overview]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
