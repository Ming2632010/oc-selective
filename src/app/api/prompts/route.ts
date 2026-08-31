import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import {
  assertOwnedStudent,
  ensureWritingEnhancements,
} from '@/lib/writing-state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PromptRow = {
  id: string;
  title: string;
  description: string;
  prompt_type: string;
  module_id: number;
  hint_points: unknown;
  sample_answer_high: string;
  sample_answer_medium: string;
  is_locked: boolean;
  time_limit_minutes: number;
  is_active: boolean;
  kind: string;
};

const PROMPT_COLUMNS = `id, title, description, prompt_type, module_id, hint_points,
                sample_answer_high, sample_answer_medium, is_locked,
                time_limit_minutes, is_active,
                COALESCE(kind, 'practice') AS kind`;

function stripSamples(prompt: PromptRow) {
  const { sample_answer_high: _h, sample_answer_medium: _m, ...rest } = prompt;
  return rest;
}

function isTestKind(kind: string | null | undefined): boolean {
  return kind === 'test';
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
    const promptId = searchParams.get('id');
    const studentId = searchParams.get('student_id');
    const kindParam = searchParams.get('kind');

    if (promptId) {
      const result = await query<PromptRow>(
        `SELECT ${PROMPT_COLUMNS}
         FROM prompts
         WHERE id = $1 AND is_active = TRUE
         LIMIT 1`,
        [promptId],
      );

      const prompt = result.rows[0];
      if (!prompt) {
        return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
      }

      const isTest = isTestKind(prompt.kind);
      let includeSamples = false;
      let maxDraft = 0;

      if (studentId) {
        const owned = await assertOwnedStudent(userId, studentId);
        if (!owned) {
          return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        const attempts = await query<{ draft_number: number }>(
          `SELECT draft_number
           FROM writing_attempts
           WHERE student_id = $1 AND prompt_id = $2
           ORDER BY draft_number DESC`,
          [studentId, promptId],
        );
        maxDraft = attempts.rows[0]?.draft_number ?? 0;
        includeSamples = !isTest && maxDraft >= 3;
      }

      return NextResponse.json({
        prompt: includeSamples
          ? { ...prompt, is_locked: false }
          : { ...stripSamples(prompt), is_locked: false },
        samples_unlocked: includeSamples,
        max_draft: maxDraft,
        max_attempts: isTest ? 1 : 3,
        kind: isTest ? 'test' : 'practice',
        unit_locked: false,
      });
    }

    if (!moduleIdRaw) {
      return NextResponse.json(
        { error: 'Provide module_id or id query parameter' },
        { status: 400 },
      );
    }

    const moduleId = Number(moduleIdRaw);
    if (!Number.isInteger(moduleId) || moduleId < 1 || moduleId > 11) {
      return NextResponse.json(
        { error: 'module_id must be an integer between 1 and 11' },
        { status: 400 },
      );
    }

    if (studentId) {
      const owned = await assertOwnedStudent(userId, studentId);
      if (!owned) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }
    }

    const kind =
      kindParam === 'test' || kindParam === 'practice' || kindParam === 'all'
        ? kindParam
        : 'practice';

    const result = await query<PromptRow>(
      kind === 'all'
        ? `SELECT ${PROMPT_COLUMNS}
           FROM prompts
           WHERE module_id = $1 AND is_active = TRUE
           ORDER BY kind ASC, title ASC`
        : `SELECT ${PROMPT_COLUMNS}
           FROM prompts
           WHERE module_id = $1 AND is_active = TRUE
             AND COALESCE(kind, 'practice') = $2
           ORDER BY title ASC`,
      kind === 'all' ? [moduleId] : [moduleId, kind],
    );

    return NextResponse.json({
      module_id: moduleId,
      unit_locked: false,
      kind,
      prompts: result.rows.map((row) => ({
        ...stripSamples(row),
        is_locked: false,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load prompts';
    console.error('[prompts/GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
