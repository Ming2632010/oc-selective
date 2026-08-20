import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type UpdateStudentBody = {
  name?: unknown;
  grade?: unknown;
  is_active?: unknown;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

async function getOwnedStudent(userId: string, studentId: string) {
  const result = await query<{ id: string }>(
    `SELECT id FROM students WHERE id = $1 AND user_id = $2 LIMIT 1`,
    [studentId, userId],
  );
  return result.rows[0] ?? null;
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'Student id is required' }, { status: 400 });
    }

    const owned = await getOwnedStudent(userId, id);
    if (!owned) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    let body: UpdateStudentBody;
    try {
      body = (await request.json()) as UpdateStudentBody;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (body.name !== undefined) {
      if (!isNonEmptyString(body.name)) {
        return NextResponse.json({ error: 'name must be a non-empty string' }, { status: 400 });
      }
      values.push(body.name.trim());
      updates.push(`name = $${values.length}`);
    }

    if (body.grade !== undefined) {
      if (!isNonEmptyString(body.grade)) {
        return NextResponse.json({ error: 'grade must be a non-empty string' }, { status: 400 });
      }
      values.push(body.grade.trim());
      updates.push(`grade = $${values.length}`);
    }

    if (body.is_active !== undefined) {
      if (typeof body.is_active !== 'boolean') {
        return NextResponse.json({ error: 'is_active must be a boolean' }, { status: 400 });
      }
      values.push(body.is_active);
      updates.push(`is_active = $${values.length}`);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'Provide at least one of: name, grade, is_active' },
        { status: 400 },
      );
    }

    values.push(id);
    values.push(userId);

    const result = await query<{
      id: string;
      user_id: string;
      name: string;
      grade: string;
      is_active: boolean;
      created_at: Date;
      updated_at: Date;
    }>(
      `UPDATE students
       SET ${updates.join(', ')}
       WHERE id = $${values.length - 1} AND user_id = $${values.length}
       RETURNING id, user_id, name, grade, is_active, created_at, updated_at`,
      values,
    );

    return NextResponse.json({ student: result.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update student';
    console.error('[students/PUT]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'Student id is required' }, { status: 400 });
    }

    const result = await query<{ id: string }>(
      `DELETE FROM students
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, userId],
    );

    if (!result.rows[0]) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete student';
    console.error('[students/DELETE]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
