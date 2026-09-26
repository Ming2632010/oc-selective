import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import {
  CUSTOM_TASK_IMAGE_MAX_BYTES,
  CUSTOM_TASK_IMAGE_PATH,
  inspectCustomTaskImage,
  saveCustomTaskImage,
} from '@/lib/custom-task-image';
import { WRITING_TYPES, type WritingType } from '@/lib/units';
import { getWritingAccessState } from '@/lib/writing-state';
import { hasWritingProductAccess, trialCustomLockMessage } from '@/lib/writing-trial';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_CUSTOM_TASKS = 20;

function isWritingType(value: unknown): value is WritingType {
  return typeof value === 'string' && WRITING_TYPES.includes(value as WritingType);
}

async function assertAccess(userId: string, studentId: string) {
  const access = await getWritingAccessState(userId, studentId);
  if (access === 'not-found') return { error: 'Student not found', status: 404 };
  if (!hasWritingProductAccess(access)) {
    return { error: 'Selective Writing access is required for this child.', status: 403 };
  }
  if (access === 'trial') {
    return { error: trialCustomLockMessage(), status: 403 };
  }
  return null;
}

async function readCreateInput(request: Request): Promise<{
  studentId: string;
  question: string;
  promptType: unknown;
  image: ReturnType<typeof inspectCustomTaskImage> | null;
  imageError: string | null;
}> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const studentId = String(form.get('student_id') ?? '');
    const question = String(form.get('question') ?? '').trim();
    const promptType = form.get('prompt_type');
    const file = form.get('image');
    if (!(file instanceof File) || file.size === 0) {
      return { studentId, question, promptType, image: null, imageError: null };
    }
    if (file.size > CUSTOM_TASK_IMAGE_MAX_BYTES) {
      return {
        studentId,
        question,
        promptType,
        image: null,
        imageError: 'Photos are limited to 5 MB. Try a clearer, smaller photo.',
      };
    }
    const inspected = inspectCustomTaskImage(Buffer.from(await file.arrayBuffer()));
    if (!inspected) {
      return {
        studentId,
        question,
        promptType,
        image: null,
        imageError: 'Use a JPEG, PNG, or WebP photo of the question.',
      };
    }
    return { studentId, question, promptType, image: inspected, imageError: null };
  }

  const body = (await request.json()) as {
    student_id?: unknown;
    question?: unknown;
    prompt_type?: unknown;
  };
  return {
    studentId: typeof body.student_id === 'string' ? body.student_id : '',
    question: typeof body.question === 'string' ? body.question.trim() : '',
    promptType: body.prompt_type,
    image: null,
    imageError: null,
  };
}

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const studentId = new URL(request.url).searchParams.get('student_id');
    if (!studentId) return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
    const denied = await assertAccess(userId, studentId);
    if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });

    const tasks = await query<{
      id: string; title: string; description: string; prompt_type: string;
      created_at: Date; max_draft: string; has_image: boolean;
    }>(
      `SELECT p.id, p.title, p.description, p.prompt_type, p.created_at,
              COALESCE(MAX(a.draft_number), 0)::text AS max_draft,
              (p.stimulus_image IS NOT NULL AND p.stimulus_image <> '') AS has_image
       FROM prompts p
       LEFT JOIN writing_attempts a ON a.prompt_id = p.id AND a.student_id = $1
       WHERE p.student_id = $1 AND p.kind = 'custom' AND p.is_active = TRUE
       GROUP BY p.id ORDER BY p.created_at DESC`,
      [studentId],
    );
    return NextResponse.json({
      max_tasks: MAX_CUSTOM_TASKS,
      used_tasks: tasks.rows.length,
      tasks: tasks.rows.map((task) => ({
        ...task,
        max_draft: Number(task.max_draft),
        stimulus_image: task.has_image ? CUSTOM_TASK_IMAGE_PATH(task.id) : null,
      })),
    });
  } catch (error) {
    console.error('[writing/custom-tasks GET]', error);
    return NextResponse.json({ error: 'Failed to load custom tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const input = await readCreateInput(request);
    if (input.imageError) {
      return NextResponse.json({ error: input.imageError }, { status: 413 });
    }
    if (!input.studentId || !isWritingType(input.promptType)) {
      return NextResponse.json({ error: 'student_id and writing form are required' }, { status: 400 });
    }
    if (!input.question && !input.image) {
      return NextResponse.json(
        { error: 'Type the question, or add a photo of it.' },
        { status: 400 },
      );
    }
    if (input.question.length > 2_000) {
      return NextResponse.json({ error: 'Custom questions are limited to 2,000 characters.' }, { status: 413 });
    }
    const denied = await assertAccess(userId, input.studentId);
    if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });

    const inserted = await query<{ id: string; title: string }>(
      `INSERT INTO prompts (
         title, description, prompt_type, module_id, hint_points,
         sample_answer_high, sample_answer_medium, is_locked, time_limit_minutes,
         is_active, kind, student_id, stimulus_image
       )
       SELECT $1, $2, $3, 1, '[]'::jsonb, '', '', FALSE, 30, TRUE, 'custom', $4, $6
       WHERE (
         SELECT COUNT(*) FROM prompts
         WHERE student_id = $4 AND kind = 'custom' AND is_active = TRUE
       ) < $5
       RETURNING id, title`,
      [
        `My custom ${input.promptType.replace('_', ' ')} task`,
        input.question,
        input.promptType,
        input.studentId,
        MAX_CUSTOM_TASKS,
        null,
      ],
    );
    const task = inserted.rows[0];
    if (!task) {
      return NextResponse.json({ error: `Each student can create up to ${MAX_CUSTOM_TASKS} custom tasks.` }, { status: 403 });
    }

    if (input.image) {
      try {
        await saveCustomTaskImage({
          promptId: task.id,
          studentId: input.studentId,
          image: input.image,
        });
        await query(
          `UPDATE prompts SET stimulus_image = $2 WHERE id = $1 AND kind = 'custom'`,
          [task.id, CUSTOM_TASK_IMAGE_PATH(task.id)],
        );
      } catch (error) {
        await query(`DELETE FROM prompts WHERE id = $1 AND kind = 'custom' AND student_id = $2`, [
          task.id,
          input.studentId,
        ]);
        throw error;
      }
    }

    return NextResponse.json({
      task: {
        ...task,
        stimulus_image: input.image ? CUSTOM_TASK_IMAGE_PATH(task.id) : null,
      },
      max_tasks: MAX_CUSTOM_TASKS,
    }, { status: 201 });
  } catch (error) {
    console.error('[writing/custom-tasks POST]', error);
    return NextResponse.json({ error: 'Failed to create custom task' }, { status: 500 });
  }
}
