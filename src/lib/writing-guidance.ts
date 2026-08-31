export const SCORE_DIMENSIONS = [
  'structure',
  'vocabulary',
  'audience',
  'grammar',
] as const;

export type ScoreDimension = (typeof SCORE_DIMENSIONS)[number];

export const DIMENSION_LABELS: Record<ScoreDimension, string> = {
  structure: 'organisation',
  vocabulary: 'vocabulary and style',
  audience: 'purpose and form',
  grammar: 'sentences, punctuation and spelling',
};

export type PromptSummary = {
  id: string;
  title: string;
  prompt_type: string;
  module_id: number;
  kind?: 'practice' | 'test';
};

export type AttemptSummary = {
  prompt_id: string;
  draft_number: number;
  overall_score: number | null;
  scores_breakdown?: Partial<Record<ScoreDimension, number>> | null;
};

export type UnitProgressRow = {
  module_id: number;
  prompt_count: number;
  completed_count: number;
  is_completed: boolean;
};

export type NextTaskRecommendation = {
  prompt_id: string;
  title: string;
  module_id: number;
  prompt_type: string;
  next_draft: number;
  reason: string;
  weakest_dimension: ScoreDimension | null;
};

/**
 * All writing units are open. Students may start any unit.
 */
export const ALL_UNITS_OPEN = 11;

export function highestUnlockedUnit(
  _completedUnitIds?: Iterable<number>,
): number {
  return ALL_UNITS_OPEN;
}

export function isUnitUnlocked(unitId: number): boolean {
  return unitId >= 1 && unitId <= ALL_UNITS_OPEN;
}

export function weakestDimension(
  attempts: AttemptSummary[],
  lookback = 6,
): ScoreDimension | null {
  const recent = attempts
    .filter((a) => a.scores_breakdown && typeof a.overall_score === 'number')
    .slice(-lookback);

  if (recent.length === 0) return null;

  const totals: Record<ScoreDimension, number> = {
    structure: 0,
    vocabulary: 0,
    audience: 0,
    grammar: 0,
  };

  for (const attempt of recent) {
    const breakdown = attempt.scores_breakdown ?? {};
    for (const dim of SCORE_DIMENSIONS) {
      const value = Number(breakdown[dim] ?? 0);
      totals[dim] += Number.isFinite(value) ? value : 0;
    }
  }

  return SCORE_DIMENSIONS.reduce((lowest, dim) =>
    totals[dim] < totals[lowest] ? dim : lowest,
  );
}

export function maxDraftForPrompt(
  attempts: AttemptSummary[],
  promptId: string,
): number {
  return attempts.reduce((max, attempt) => {
    if (attempt.prompt_id !== promptId) return max;
    return Math.max(max, attempt.draft_number);
  }, 0);
}

/**
 * Prefer an unfinished draft, then a new prompt in the lowest open unit.
 * Reasons mention the weakest recent marking dimension when we have scores.
 */
export function recommendNextTask(
  prompts: PromptSummary[],
  attempts: AttemptSummary[],
  unlockedUnit: number,
): NextTaskRecommendation | null {
  const available = prompts
    .filter((prompt) => prompt.module_id <= unlockedUnit)
    .filter((prompt) => prompt.kind !== 'test')
    .slice()
    .sort((a, b) => {
      if (a.module_id !== b.module_id) return a.module_id - b.module_id;
      return a.title.localeCompare(b.title);
    });

  if (available.length === 0) return null;

  const weak = weakestDimension(attempts);
  const weakLabel = weak ? DIMENSION_LABELS[weak] : null;

  const withDrafts = available.map((prompt) => ({
    prompt,
    maxDraft: maxDraftForPrompt(attempts, prompt.id),
  }));

  const inProgress = withDrafts.filter(
    (row) => row.maxDraft >= 1 && row.maxDraft < 3,
  );
  if (inProgress.length > 0) {
    const pick = inProgress[0];
    return {
      prompt_id: pick.prompt.id,
      title: pick.prompt.title,
      module_id: pick.prompt.module_id,
      prompt_type: pick.prompt.prompt_type,
      next_draft: pick.maxDraft + 1,
      weakest_dimension: weak,
      reason: weakLabel
        ? `Revise “${pick.prompt.title}” (draft ${pick.maxDraft + 1}). Recent scores are lowest on ${weakLabel} — use this draft to tighten that.`
        : `Revise “${pick.prompt.title}” (draft ${pick.maxDraft + 1}).`,
    };
  }

  const notStarted = withDrafts.filter((row) => row.maxDraft === 0);
  if (notStarted.length > 0) {
    const lowestUnit = notStarted[0].prompt.module_id;
    const inUnit = notStarted.filter((row) => row.prompt.module_id === lowestUnit);

    const lastTyped = [...attempts].reverse().find((a) => a.prompt_id);
    const lastPrompt = lastTyped
      ? prompts.find((p) => p.id === lastTyped.prompt_id)
      : undefined;
    const sameType =
      lastPrompt &&
      inUnit.find((row) => row.prompt.prompt_type === lastPrompt.prompt_type);

    const pick = (weak && sameType ? sameType : inUnit[0]).prompt;
    return {
      prompt_id: pick.id,
      title: pick.title,
      module_id: pick.module_id,
      prompt_type: pick.prompt_type,
      next_draft: 1,
      weakest_dimension: weak,
      reason: weakLabel
        ? `Start “${pick.title}” next. Recent writing is weakest on ${weakLabel}. Mini practice in that unit can help before the full task.`
        : `Start “${pick.title}” next. Mini practice in that unit can help before the full task.`,
    };
  }

  return null;
}

export function completedUnitIds(progress: UnitProgressRow[]): number[] {
  return progress.filter((row) => row.is_completed).map((row) => row.module_id);
}
