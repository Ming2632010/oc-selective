import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { isEarlyMathUnitId } from '@/lib/early-math';
import {
  assertMathsStudent,
  getMathsItem,
  listMathsUnit,
  submitMathsAnswer,
} from '@/lib/early-math-state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'syd1';

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const studentId = url.searchParams.get('student_id');
    if (!studentId) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
    }
    const student = await assertMathsStudent(userId, studentId);
    if (!student) {
      return NextResponse.json({ error: 'Maths is for Kindergarten and Year 1 profiles' }, { status: 403 });
    }

    const slug = url.searchParams.get('slug');
    if (slug) {
      const loaded = await getMathsItem(studentId, slug);
      if (!loaded) return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      return NextResponse.json(loaded, { headers: { 'Cache-Control': 'private, no-store' } });
    }

    const unitId = Number(url.searchParams.get('unit_id'));
    if (!isEarlyMathUnitId(unitId)) {
      return NextResponse.json({ error: 'unit_id must be 1–6' }, { status: 400 });
    }
    const items = await listMathsUnit(studentId, unitId);
    return NextResponse.json(
      { items },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load Maths';
    console.error('[maths/items GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json()) as {
      student_id?: string;
      slug?: string;
      answer_index?: number | null;
      answer_text?: string | null;
    };
    if (!body.student_id || !body.slug) {
      return NextResponse.json({ error: 'student_id and slug are required' }, { status: 400 });
    }
    const student = await assertMathsStudent(userId, body.student_id);
    if (!student) {
      return NextResponse.json({ error: 'Maths is for Kindergarten and Year 1 profiles' }, { status: 403 });
    }

    const result = await submitMathsAnswer({
      studentId: body.student_id,
      slug: body.slug,
      answerIndex: body.answer_index,
      answerText: body.answer_text,
    });
    if (!result) return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save Maths answer';
    console.error('[maths/items POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
