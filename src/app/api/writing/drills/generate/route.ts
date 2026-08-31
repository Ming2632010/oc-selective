import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { generateMiniPack } from '@/lib/generate-mini-drills';
import {
  assertOwnedStudent,
  ensureWritingEnhancements,
  getMiniExtraMeta,
  getMissedMiniStems,
} from '@/lib/writing-state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureWritingEnhancements();

    let body: { student_id?: unknown; module_id?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const studentId = typeof body.student_id === 'string' ? body.student_id : '';
    const moduleId = Number(body.module_id);
    if (!studentId || !Number.isInteger(moduleId) || moduleId < 1 || moduleId > 11) {
      return NextResponse.json(
        { error: 'student_id and module_id are required' },
        { status: 400 },
      );
    }

    const owned = await assertOwnedStudent(userId, studentId);
    if (!owned) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const extra = await getMiniExtraMeta(studentId, moduleId);
    if (!extra.can_generate || extra.pack_size < 1) {
      return NextResponse.json(
        {
          error:
            extra.remaining_unit <= 0
              ? 'That’s enough extra questions for this unit. Try the full writing task.'
              : 'Come back tomorrow for more extra questions in this unit.',
          extra,
        },
        { status: 429 },
      );
    }

    const missedStems = await getMissedMiniStems(studentId, moduleId);
    let generated;
    try {
      generated = await generateMiniPack({
        moduleId,
        promptType: extra.prompt_type,
        unitLabel: extra.unit_label,
        focus: extra.focus,
        missedStems,
        packSize: extra.pack_size,
        startOrder: extra.counts.maxSortOrder,
        variation: extra.counts.existing,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OpenAI generate failed';
      console.error('[writing/drills/generate]', message);
      return NextResponse.json(
        {
          error: 'Could not make extra questions just now. Try again in a minute.',
        },
        { status: 503 },
      );
    }

    if (generated.drills.length === 0) {
      return NextResponse.json(
        { error: 'Could not make extra questions just now. Try again in a minute.' },
        { status: 503 },
      );
    }

    const inserted = [];
    for (const drill of generated.drills) {
      const result = await query<{ id: string }>(
        `INSERT INTO mini_drills (
           slug, module_id, prompt_type, skill, title, stem, options,
           correct_index, explanation, sort_order, is_active,
           student_id, source, focus_note
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10, TRUE,
           $11, 'ai', $12
         )
         RETURNING id`,
        [
          drill.slug,
          drill.module_id,
          drill.prompt_type,
          drill.skill,
          drill.title,
          drill.stem,
          JSON.stringify(drill.options),
          drill.correct_index,
          drill.explanation,
          drill.sort_order,
          studentId,
          extra.reason,
        ],
      );
      inserted.push({
        id: result.rows[0].id,
        slug: drill.slug,
        skill: drill.skill,
        title: drill.title,
        source: 'ai' as const,
        attempted: false,
      });
    }

    const refreshed = await getMiniExtraMeta(studentId, moduleId);

    return NextResponse.json({
      reason: extra.reason,
      drills: inserted,
      extra: {
        can_generate: refreshed.can_generate,
        remaining_today: refreshed.remaining_today,
        remaining_unit: refreshed.remaining_unit,
        suggested_skills: refreshed.suggested_skills,
        reason: refreshed.reason,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to generate extra questions';
    console.error('[writing/drills/generate]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
