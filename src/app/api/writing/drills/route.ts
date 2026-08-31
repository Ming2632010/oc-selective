import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { markMiniChoice } from '@/lib/seed-mini-drills';
import {
  assertOwnedStudent,
  awardMiniSeeds,
  ensureWritingEnhancements,
  getMiniExtraMeta,
} from '@/lib/writing-state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type DrillRow = {
  id: string;
  slug: string;
  module_id: number;
  prompt_type: string;
  skill: string;
  title: string;
  stem: string;
  options: unknown;
  correct_index: number;
  explanation: string;
  sort_order: number;
  source: string | null;
  student_id: string | null;
};

function publicDrill(row: DrillRow) {
  return {
    id: row.id,
    slug: row.slug,
    module_id: row.module_id,
    prompt_type: row.prompt_type,
    skill: row.skill,
    title: row.title,
    stem: row.stem,
    options: Array.isArray(row.options) ? row.options : [],
    sort_order: row.sort_order,
    source: row.source === 'ai' ? 'ai' : 'seed',
  };
}

async function nextDrillSlug(
  moduleId: number,
  sortOrder: number,
  studentId: string | null,
) {
  const result = await query<{ slug: string }>(
    studentId
      ? `SELECT slug FROM mini_drills
         WHERE module_id = $1 AND is_active = TRUE AND sort_order > $2
           AND (student_id IS NULL OR student_id = $3)
         ORDER BY CASE WHEN student_id IS NULL THEN 0 ELSE 1 END, sort_order ASC
         LIMIT 1`
      : `SELECT slug FROM mini_drills
         WHERE module_id = $1 AND is_active = TRUE AND sort_order > $2
           AND student_id IS NULL
         ORDER BY sort_order ASC
         LIMIT 1`,
    studentId ? [moduleId, sortOrder, studentId] : [moduleId, sortOrder],
  );
  return result.rows[0]?.slug ?? null;
}

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureWritingEnhancements();

    const { searchParams } = new URL(request.url);
    const moduleIdRaw = searchParams.get('module_id');
    const studentId = searchParams.get('student_id');
    const slug = searchParams.get('slug');

    if (studentId) {
      const owned = await assertOwnedStudent(userId, studentId);
      if (!owned) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }
    }

    if (slug) {
      const result = await query<DrillRow>(
        `SELECT id, slug, module_id, prompt_type, skill, title, stem, options,
                correct_index, explanation, sort_order, source, student_id
         FROM mini_drills
         WHERE slug = $1 AND is_active = TRUE
         LIMIT 1`,
        [slug],
      );
      const drill = result.rows[0];
      if (!drill) {
        return NextResponse.json({ error: 'Drill not found' }, { status: 404 });
      }
      if (drill.student_id && drill.student_id !== studentId) {
        return NextResponse.json({ error: 'Drill not found' }, { status: 404 });
      }

      let last: { answer_index: number; is_correct: boolean } | null = null;
      if (studentId) {
        const attempts = await query<{
          answer_index: number;
          is_correct: boolean;
        }>(
          `SELECT answer_index, is_correct
           FROM mini_drill_attempts
           WHERE student_id = $1 AND drill_id = $2
           ORDER BY created_at DESC
           LIMIT 1`,
          [studentId, drill.id],
        );
        last = attempts.rows[0] ?? null;
      }

      return NextResponse.json({
        drill: publicDrill(drill),
        last_attempt: last,
        next_slug: await nextDrillSlug(
          drill.module_id,
          drill.sort_order,
          studentId,
        ),
        reveal: last
          ? {
              correct_index: drill.correct_index,
              explanation: drill.explanation,
            }
          : null,
      });
    }

    const moduleId = Number(moduleIdRaw);
    if (!Number.isInteger(moduleId) || moduleId < 1 || moduleId > 11) {
      return NextResponse.json(
        { error: 'module_id must be an integer between 1 and 11' },
        { status: 400 },
      );
    }

    const drills = await query<DrillRow>(
      studentId
        ? `SELECT id, slug, module_id, prompt_type, skill, title, stem, options,
                  correct_index, explanation, sort_order, source, student_id
           FROM mini_drills
           WHERE module_id = $1 AND is_active = TRUE
             AND (student_id IS NULL OR student_id = $2)
           ORDER BY CASE WHEN student_id IS NULL THEN 0 ELSE 1 END, sort_order ASC`
        : `SELECT id, slug, module_id, prompt_type, skill, title, stem, options,
                  correct_index, explanation, sort_order, source, student_id
           FROM mini_drills
           WHERE module_id = $1 AND is_active = TRUE AND student_id IS NULL
           ORDER BY sort_order ASC`,
      studentId ? [moduleId, studentId] : [moduleId],
    );

    let done = new Set<string>();
    if (studentId) {
      const attempts = await query<{ drill_id: string }>(
        `SELECT DISTINCT drill_id FROM mini_drill_attempts WHERE student_id = $1`,
        [studentId],
      );
      done = new Set(attempts.rows.map((row) => row.drill_id));
    }

    const extraMeta = studentId ? await getMiniExtraMeta(studentId, moduleId) : null;

    return NextResponse.json({
      module_id: moduleId,
      drills: drills.rows.map((row) => ({
        ...publicDrill(row),
        attempted: done.has(row.id),
      })),
      extra: extraMeta
        ? {
            can_generate: extraMeta.can_generate,
            remaining_today: extraMeta.remaining_today,
            remaining_unit: extraMeta.remaining_unit,
            suggested_skills: extraMeta.suggested_skills,
            reason: extraMeta.reason,
          }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load drills';
    console.error('[writing/drills GET]', message);
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

    let body: { student_id?: unknown; slug?: unknown; answer_index?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const studentId = typeof body.student_id === 'string' ? body.student_id : '';
    const slug = typeof body.slug === 'string' ? body.slug : '';
    const answerIndex = Number(body.answer_index);

    if (!studentId || !slug || !Number.isInteger(answerIndex) || answerIndex < 0) {
      return NextResponse.json(
        { error: 'student_id, slug, and answer_index are required' },
        { status: 400 },
      );
    }

    const owned = await assertOwnedStudent(userId, studentId);
    if (!owned) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const drillResult = await query<DrillRow>(
      `SELECT id, slug, module_id, prompt_type, skill, title, stem, options,
              correct_index, explanation, sort_order, source, student_id
       FROM mini_drills
       WHERE slug = $1 AND is_active = TRUE
       LIMIT 1`,
      [slug],
    );
    const drill = drillResult.rows[0];
    if (!drill) {
      return NextResponse.json({ error: 'Drill not found' }, { status: 404 });
    }
    if (drill.student_id && drill.student_id !== studentId) {
      return NextResponse.json({ error: 'Drill not found' }, { status: 404 });
    }

    const options = Array.isArray(drill.options) ? drill.options : [];
    if (answerIndex >= options.length) {
      return NextResponse.json({ error: 'Invalid answer_index' }, { status: 400 });
    }

    const isCorrect = markMiniChoice(drill.correct_index, answerIndex);
    const prior = await query<{ id: string }>(
      `SELECT id FROM mini_drill_attempts
       WHERE student_id = $1 AND drill_id = $2
       LIMIT 1`,
      [studentId, drill.id],
    );
    await query(
      `INSERT INTO mini_drill_attempts (student_id, drill_id, answer_index, is_correct)
       VALUES ($1, $2, $3, $4)`,
      [studentId, drill.id, answerIndex, isCorrect],
    );

    const award = await awardMiniSeeds({
      studentId,
      drillId: drill.id,
      isCorrect,
      alreadyTried: (prior.rowCount ?? prior.rows.length) > 0,
    });

    return NextResponse.json({
      is_correct: isCorrect,
      correct_index: drill.correct_index,
      explanation: drill.explanation,
      next_slug: await nextDrillSlug(drill.module_id, drill.sort_order, studentId),
      drill: publicDrill(drill),
      award,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save drill';
    console.error('[writing/drills POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
