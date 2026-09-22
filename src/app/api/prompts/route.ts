import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { bonusExamLockMessage, termReviewLockMessage } from '@/lib/writing-guidance';
import { isExamStyleKind } from '@/lib/seed-prompts';
import {
  getBonusExamAccess,
  getWritingAccessState,
  getWritingLicence,
  getTermReviewAccess,
  hasCompletedWarmup,
  trialBlocksPrompt,
} from '@/lib/writing-state';
import {
  hasWritingProductAccess,
  trialAllowsPracticeTask,
  writingAccessRequiredMessage,
} from '@/lib/writing-trial';
import { isTrialPackPromptKind } from '@/lib/writing-trial-pack';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'syd1';

type PromptRow = {
  id: string;
  title: string;
  description: string;
  prompt_type: string;
  module_id: number;
  hint_points: unknown;
  sample_answer_high: string;
  is_locked: boolean;
  time_limit_minutes: number;
  is_active: boolean;
  kind: string;
  student_id: string | null;
  stimulus_image: string | null;
  stimulus_quote: string | null;
  purposes: string[] | null;
  purpose_note: string | null;
  decode_guide: unknown;
  max_draft?: number;
};

const PROMPT_COLUMNS = `id, title, description, prompt_type, module_id, hint_points,
                sample_answer_high, is_locked,
                time_limit_minutes, is_active,
                COALESCE(kind, 'practice') AS kind,
                student_id,
                stimulus_image, stimulus_quote, purposes, purpose_note, decode_guide`;

function stripSamples(prompt: PromptRow) {
  const { sample_answer_high: _h, ...rest } = prompt;
  return rest;
}

function isExamKind(kind: string | null | undefined): boolean {
  return isExamStyleKind(kind);
}

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      if (prompt.kind === 'custom' && (!studentId || prompt.student_id !== studentId)) {
        return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
      }
      if (isTrialPackPromptKind(prompt.kind) && !studentId) {
        return NextResponse.json(
          { error: writingAccessRequiredMessage(true) },
          { status: 403 },
        );
      }

      const isExam = isExamKind(prompt.kind);
      let includeSamples = false;
      let maxDraft = 0;
      let warmupCompleted = false;
      let reviewLocked = false;
      let lockReason = '';

      if (studentId) {
        const access = await getWritingAccessState(userId, studentId);
        if (access === 'not-found') {
          return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }
        if (!hasWritingProductAccess(access)) {
          return NextResponse.json(
            { error: writingAccessRequiredMessage(isTrialPackPromptKind(prompt.kind)) },
            { status: 403 },
          );
        }

        const attempts = await query<{ draft_number: number }>(
          `SELECT draft_number
           FROM writing_attempts
           WHERE student_id = $1 AND prompt_id = $2
           ORDER BY draft_number DESC`,
          [studentId, promptId],
        );
        maxDraft = attempts.rows[0]?.draft_number ?? 0;
        includeSamples = !isExam && maxDraft >= 3;
        warmupCompleted = isExam
          ? await hasCompletedWarmup(studentId, promptId)
          : true;
        const trialBlock = await trialBlocksPrompt(userId, studentId, promptId, prompt.kind);
        if (trialBlock) {
          return NextResponse.json(
            { error: trialBlock.error, trial_only: true },
            { status: trialBlock.status },
          );
        } else if (isExam && maxDraft < 1) {
          if (prompt.kind === 'bonus') {
            const examAccess = await getBonusExamAccess(studentId);
            reviewLocked = examAccess.locked;
            lockReason = bonusExamLockMessage(examAccess);
          } else {
            const examAccess = await getTermReviewAccess(studentId, prompt.module_id);
            reviewLocked = examAccess.locked;
            lockReason = termReviewLockMessage(examAccess);
          }
        }
      }

      return NextResponse.json({
        prompt: includeSamples
          ? { ...prompt, is_locked: reviewLocked }
          : { ...stripSamples(prompt), is_locked: reviewLocked },
        samples_unlocked: includeSamples,
        max_draft: maxDraft,
        max_attempts: isExam || prompt.kind === 'custom' ? 1 : 3,
        kind: isExam || prompt.kind === 'custom' ? prompt.kind : 'practice',
        unit_locked: false,
        warmup_completed: warmupCompleted,
        lock_reason: reviewLocked ? lockReason : '',
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

    const kind =
      kindParam === 'test' || kindParam === 'practice' || kindParam === 'all'
        ? kindParam
        : 'practice';

    if (studentId) {
      const access = await getWritingAccessState(userId, studentId);
      if (access === 'not-found') {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }
      if (!hasWritingProductAccess(access)) {
        return NextResponse.json(
          { error: writingAccessRequiredMessage() },
          { status: 403 },
        );
      }
      if (access === 'trial') {
        return NextResponse.json({
          module_id: moduleId,
          unit_locked: true,
          kind,
          prompts: [],
          trial_only: true,
        });
      }
    }

    // Custom prompts are private to one student and must never be part of the
    // shared unit catalogue, including broad `kind=all` requests.
    const conditions = [
      'module_id = $1',
      'is_active = TRUE',
      `COALESCE(kind, 'practice') NOT IN ('custom', 'trial')`,
    ];
    const params: unknown[] = [moduleId];
    if (kind !== 'all') {
      params.push(kind);
      conditions.push(`COALESCE(kind, 'practice') = $${params.length}`);
    }
    let draftSelect = '0';
    if (studentId) {
      params.push(studentId);
      draftSelect = `COALESCE((
        SELECT MAX(a.draft_number) FROM writing_attempts a
        WHERE a.student_id = $${params.length} AND a.prompt_id = prompts.id
      ), 0)`;
    }

    const result = await query<PromptRow>(
      `SELECT ${PROMPT_COLUMNS}, ${draftSelect} AS max_draft
       FROM prompts
       WHERE ${conditions.join(' AND ')}
       ORDER BY ${kind === 'all' ? 'kind ASC, title ASC' : 'title ASC'}`,
      params,
    );

    const licence = studentId ? await getWritingLicence(userId, studentId) : null;
    return NextResponse.json({
      module_id: moduleId,
      unit_locked: false,
      kind,
      prompts: result.rows.map((row) => {
        const maxDraft = Number(row.max_draft ?? 0);
        let isLocked = false;
        if (licence?.state === 'trial') {
          const allowed = trialAllowsPracticeTask({
            promptKind: row.kind,
            alreadyTried: maxDraft > 0,
            distinctTried: licence.attemptsUsed,
            attemptLimit: licence.attemptsLimit,
          });
          isLocked = !allowed.ok;
        }
        return {
          ...stripSamples(row),
          is_locked: isLocked,
          max_draft: maxDraft,
        };
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load prompts';
    console.error('[prompts/GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
