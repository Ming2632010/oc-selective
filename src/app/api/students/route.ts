import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CreateStudentBody = {
  name?: unknown;
  grade?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query<{
      id: string;
      user_id: string;
      name: string;
      grade: string;
      is_active: boolean;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT id, user_id, name, grade, is_active, created_at, updated_at
       FROM students
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [userId],
    );

    return NextResponse.json({ students: result.rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list students';
    console.error('[students/GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: CreateStudentBody;
    try {
      body = (await request.json()) as CreateStudentBody;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const name = isNonEmptyString(body.name) ? body.name.trim() : '';
    const grade = isNonEmptyString(body.grade) ? body.grade.trim() : '';

    if (!name || !grade) {
      return NextResponse.json(
        { error: 'name and grade are required' },
        { status: 400 },
      );
    }

    const result = await query<{
      id: string;
      user_id: string;
      name: string;
      grade: string;
      is_active: boolean;
      created_at: Date;
      updated_at: Date;
    }>(
      `INSERT INTO students (user_id, name, grade)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, name, grade, is_active, created_at, updated_at`,
      [userId, name, grade],
    );

    return NextResponse.json({ student: result.rows[0] }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create student';
    console.error('[students/POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
