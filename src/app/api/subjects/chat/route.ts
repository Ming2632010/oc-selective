import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { isSubject } from '@/lib/subjects';
import {
  assertOwnedStudent,
  ensureWritingEnhancements,
} from '@/lib/writing-state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY = 2000;

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureWritingEnhancements();

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const subject = searchParams.get('subject') ?? 'writing';

    if (!studentId || !isSubject(subject)) {
      return NextResponse.json(
        { error: 'student_id and a valid subject are required' },
        { status: 400 },
      );
    }

    const owned = await assertOwnedStudent(userId, studentId);
    if (!owned) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const result = await query<{
      id: string;
      sender: string;
      body: string;
      created_at: Date;
    }>(
      `SELECT id, sender, body, created_at
       FROM subject_messages
       WHERE user_id = $1 AND student_id = $2 AND subject = $3
       ORDER BY created_at ASC
       LIMIT 200`,
      [userId, studentId, subject],
    );

    return NextResponse.json({ messages: result.rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load chat';
    console.error('[subjects/chat GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureWritingEnhancements();

    let body: {
      student_id?: unknown;
      subject?: unknown;
      sender?: unknown;
      body?: unknown;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const studentId =
      typeof body.student_id === 'string' ? body.student_id : '';
    const subject = body.subject ?? 'writing';
    const sender = body.sender;
    const text = typeof body.body === 'string' ? body.body.trim() : '';

    if (!studentId || !isSubject(subject)) {
      return NextResponse.json(
        { error: 'student_id and a valid subject are required' },
        { status: 400 },
      );
    }
    if (sender !== 'parent' && sender !== 'student') {
      return NextResponse.json(
        { error: 'sender must be parent or student' },
        { status: 400 },
      );
    }
    if (!text || text.length > MAX_BODY) {
      return NextResponse.json(
        { error: `Message must be 1–${MAX_BODY} characters` },
        { status: 400 },
      );
    }

    const owned = await assertOwnedStudent(userId, studentId);
    if (!owned) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const inserted = await query(
      `INSERT INTO subject_messages (user_id, student_id, subject, sender, body)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, sender, body, created_at`,
      [userId, studentId, subject, sender, text],
    );

    return NextResponse.json({ message: inserted.rows[0] }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send chat';
    console.error('[subjects/chat POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
