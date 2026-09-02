import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { markMiniItem } from '@/lib/mark-mini-item';
import {
  isMiniItemKind,
  publicMiniPrompt,
  type MiniItemKind,
} from '@/lib/mini-item-kinds';
import {
  assertOwnedStudent,
  awardMiniSeeds,
  ensureWritingEnhancements,
  extraIsUnlocked,
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
  item_kind: string | null;
  prompt: unknown;
};

function drillKind(row: DrillRow): MiniItemKind {
  return row.item_kind && isMiniItemKind(row.item_kind) ? row.item_kind : 'choice';
}

function publicDrill(row: DrillRow) {
  const itemKind = drillKind(row);
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
    source: row.source === 'seed' || !row.source ? 'seed' : 'ai',
    item_kind: itemKind,
    prompt: publicMiniPrompt(itemKind, row.prompt),
  };
}

const DRILL_COLUMNS = `id, slug, module_id, prompt_type, skill, title, stem, options,
                correct_index, explanation, sort_order, source, student_id,
                item_kind, prompt`;

function seedBucket(source: string | null | undefined, studentId: string | null) {
  return !studentId && (source === 'seed' || !source) ? 0 : 1;
}

async function nextDrillSlug(
  moduleId: number,
  sortOrder: number,
  studentId: string | null,
  source?: string | null,
  ownerId?: string | null,
) {
  const bucket = seedBucket(source, ownerId ?? null);
  const result = await query<{ slug: string }>(
    studentId
      ? `SELECT slug FROM mini_drills d
         WHERE d.module_id = $1 AND d.is_active = TRUE
           AND (
             (d.student_id IS NULL AND COALESCE(d.source, 'seed') = 'seed')
             OR d.student_id = $2
             OR (
               d.student_id IS NULL AND d.source = 'extra'
               AND EXISTS (
                 SELECT 1 FROM mini_drill_unlocks u
                 WHERE u.student_id = $2 AND u.drill_id = d.id
               )
             )
           )
           AND (
             CASE WHEN d.student_id IS NULL AND COALESCE(d.source, 'seed') = 'seed' THEN 0 ELSE 1 END > $3
             OR (
               CASE WHEN d.student_id IS NULL AND COALESCE(d.source, 'seed') = 'seed' THEN 0 ELSE 1 END = $3
               AND d.sort_order > $4
             )
           )
         ORDER BY CASE WHEN d.student_id IS NULL AND COALESCE(d.source, 'seed') = 'seed' THEN 0 ELSE 1 END,
                  d.sort_order ASC
         LIMIT 1`
      : `SELECT slug FROM mini_drills
         WHERE module_id = $1 AND is_active = TRUE AND sort_order > $2
           AND student_id IS NULL AND COALESCE(source, 'seed') = 'seed'
         ORDER BY sort_order ASC
         LIMIT 1`,
    studentId
      ? [moduleId, studentId, bucket, sortOrder]
      : [moduleId, sortOrder],
  );
  return result.rows[0]?.slug ?? null;
}

function payloadOrder(payload: unknown): number[] | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const order = (payload as { order?: unknown }).order;
  if (!Array.isArray(order) || order.some((item) => !Number.isInteger(Number(item)))) {
    return null;
  }
  return order.map((item) => Number(item));
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
        `SELECT ${DRILL_COLUMNS}
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
      if (drill.source === 'extra') {
        if (!studentId || !(await extraIsUnlocked(studentId, drill.id))) {
          return NextResponse.json({ error: 'Drill not found' }, { status: 404 });
        }
      }

      let last: {
        answer_index: number | null;
        answer_text: string | null;
        answer_payload: unknown;
        is_correct: boolean;
        feedback: unknown;
      } | null = null;
      if (studentId) {
        const attempts = await query<{
          answer_index: number | null;
          answer_text: string | null;
          answer_payload: unknown;
          is_correct: boolean;
          feedback: unknown;
        }>(
          `SELECT answer_index, answer_text, answer_payload, is_correct, feedback
           FROM mini_drill_attempts
           WHERE student_id = $1 AND drill_id = $2
           ORDER BY created_at DESC
           LIMIT 1`,
          [studentId, drill.id],
        );
        last = attempts.rows[0] ?? null;
      }

      const lastOrder = last ? payloadOrder(last.answer_payload) : null;
      const marked = last
        ? markMiniItem({
            kind: drillKind(drill),
            correctIndex: drill.correct_index,
            answerIndex: last.answer_index,
            answerText: last.answer_text ?? undefined,
            answerOrder: lastOrder ?? undefined,
            prompt: drill.prompt,
            explanation: drill.explanation,
          })
        : null;

      return NextResponse.json({
        drill: publicDrill(drill),
        last_attempt: last
          ? {
              answer_index: last.answer_index,
              answer_text: last.answer_text,
              answer_order: lastOrder,
              is_correct: last.is_correct,
            }
          : null,
        next_slug: await nextDrillSlug(
          drill.module_id,
          drill.sort_order,
          studentId,
          drill.source,
          drill.student_id,
        ),
        reveal: marked
          ? {
              correct_index: drill.correct_index,
              explanation: marked.explanation,
              sample: marked.sample ?? null,
              checks: marked.checks,
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
        ? `SELECT ${DRILL_COLUMNS}
           FROM mini_drills d
           WHERE d.module_id = $1 AND d.is_active = TRUE
             AND (
               (d.student_id IS NULL AND COALESCE(d.source, 'seed') = 'seed')
               OR d.student_id = $2
               OR (
                 d.student_id IS NULL AND d.source = 'extra'
                 AND EXISTS (
                   SELECT 1 FROM mini_drill_unlocks u
                   WHERE u.student_id = $2 AND u.drill_id = d.id
                 )
               )
             )
           ORDER BY CASE
                      WHEN d.student_id IS NULL AND COALESCE(d.source, 'seed') = 'seed' THEN 0
                      ELSE 1
                    END,
                    d.sort_order ASC`
        : `SELECT ${DRILL_COLUMNS}
           FROM mini_drills
           WHERE module_id = $1 AND is_active = TRUE AND student_id IS NULL
             AND COALESCE(source, 'seed') = 'seed'
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

    let body: {
      student_id?: unknown;
      slug?: unknown;
      answer_index?: unknown;
      answer_text?: unknown;
      answer_order?: unknown;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const studentId = typeof body.student_id === 'string' ? body.student_id : '';
    const slug = typeof body.slug === 'string' ? body.slug : '';
    const answerIndex =
      typeof body.answer_index === 'number' || typeof body.answer_index === 'string'
        ? Number(body.answer_index)
        : NaN;
    const answerText = typeof body.answer_text === 'string' ? body.answer_text : '';
    const answerOrder = Array.isArray(body.answer_order)
      ? body.answer_order.map((item) => Number(item))
      : [];

    if (!studentId || !slug) {
      return NextResponse.json(
        { error: 'student_id and slug are required' },
        { status: 400 },
      );
    }

    const owned = await assertOwnedStudent(userId, studentId);
    if (!owned) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const drillResult = await query<DrillRow>(
      `SELECT ${DRILL_COLUMNS}
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
    if (drill.source === 'extra' && !(await extraIsUnlocked(studentId, drill.id))) {
      return NextResponse.json({ error: 'Drill not found' }, { status: 404 });
    }

    const kind = drillKind(drill);
    if (kind === 'choice') {
      const options = Array.isArray(drill.options) ? drill.options : [];
      if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= options.length) {
        return NextResponse.json({ error: 'Invalid answer_index' }, { status: 400 });
      }
    } else if (kind === 'order') {
      if (answerOrder.length === 0 || answerOrder.some((index) => !Number.isInteger(index))) {
        return NextResponse.json({ error: 'answer_order is required' }, { status: 400 });
      }
    } else if (!answerText.trim()) {
      return NextResponse.json({ error: 'answer_text is required' }, { status: 400 });
    }

    const marked = markMiniItem({
      kind,
      correctIndex: drill.correct_index,
      answerIndex: Number.isInteger(answerIndex) ? answerIndex : null,
      answerText,
      answerOrder,
      prompt: drill.prompt,
      explanation: drill.explanation,
    });

    const prior = await query<{ id: string }>(
      `SELECT id FROM mini_drill_attempts
       WHERE student_id = $1 AND drill_id = $2
       LIMIT 1`,
      [studentId, drill.id],
    );
    await query(
      `INSERT INTO mini_drill_attempts (
         student_id, drill_id, answer_index, answer_text, answer_payload, is_correct, feedback
       ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7::jsonb)`,
      [
        studentId,
        drill.id,
        kind === 'choice' && Number.isInteger(answerIndex) ? answerIndex : null,
        answerText.trim() || null,
        JSON.stringify(kind === 'order' ? { order: answerOrder } : {}),
        marked.isCorrect,
        JSON.stringify({ checks: marked.checks, sample: marked.sample ?? null }),
      ],
    );

    const award = await awardMiniSeeds({
      studentId,
      drillId: drill.id,
      isCorrect: marked.isCorrect,
      alreadyTried: (prior.rowCount ?? prior.rows.length) > 0,
    });

    return NextResponse.json({
      is_correct: marked.isCorrect,
      correct_index: drill.correct_index,
      explanation: marked.explanation,
      sample: marked.sample ?? null,
      checks: marked.checks,
      next_slug: await nextDrillSlug(
        drill.module_id,
        drill.sort_order,
        studentId,
        drill.source,
        drill.student_id,
      ),
      drill: publicDrill(drill),
      award,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save drill';
    console.error('[writing/drills POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
