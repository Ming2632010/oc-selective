export const WRITING_TRIAL_DAYS = 7;
export const WRITING_TRIAL_FULL_TASKS = 1;
export const WRITING_TRIAL_DRAFTS = 3;
export const WRITING_TRIAL_MINI_QUESTIONS = 10;
/** Distinct full writing papers allowed on the trial. Drafts 1–3 on that paper do not use extra quota. */
export const WRITING_TRIAL_FULL_ATTEMPTS = WRITING_TRIAL_FULL_TASKS;

const WRITING_DASHBOARD_GRADES = new Set(['Year 4', 'Year 5', 'Year 6', 'Year 7']);

export function usesWritingDashboard(grade: string) {
  return WRITING_DASHBOARD_GRADES.has(grade);
}

export type WritingAccessState = 'granted' | 'trial' | 'unlicensed' | 'not-found';

export function hasWritingProductAccess(state: WritingAccessState) {
  return state === 'granted' || state === 'trial';
}

export function trialDaysLeft(expiresAt: Date, now = new Date()) {
  return Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
}

export function trialExpiresAt(from = new Date(), days = WRITING_TRIAL_DAYS) {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

export function trialOfferCopy() {
  return '10 mini practice questions and one full writing task with three attempts';
}

export function trialStartRequiredMessage() {
  return 'Start the 7-day trial on the dashboard first.';
}

export function writingAccessRequiredMessage(trialPack = false) {
  return trialPack
    ? trialStartRequiredMessage()
    : 'Selective Writing access is required for this child.';
}

export function trialMiniLimitMessage(
  _limit = WRITING_TRIAL_MINI_QUESTIONS,
) {
  return 'The trial includes 10 mini questions. Buy a year for mini practice in every unit.';
}

export function clipTrialMiniDrills<T extends { id: string }>(
  drills: T[],
  triedIds: Set<string>,
  distinctTried: number,
  limit = WRITING_TRIAL_MINI_QUESTIONS,
): T[] {
  let remaining = Math.max(0, limit - distinctTried);
  const kept: T[] = [];
  for (const drill of drills) {
    if (triedIds.has(drill.id)) {
      kept.push(drill);
      continue;
    }
    if (remaining > 0) {
      kept.push(drill);
      remaining -= 1;
    }
  }
  return kept;
}

export function trialExamLockMessage() {
  return `The 7-day trial includes ${trialOfferCopy()}. Term reviews and exam papers are in the full year.`;
}

export function trialCustomLockMessage() {
  return `Custom tasks are in the full year. The trial is ${trialOfferCopy()}.`;
}

export function trialFullTaskLimitMessage(
  _limit = WRITING_TRIAL_FULL_TASKS,
) {
  return 'The trial includes one full writing task with three attempts. Buy a year to keep writing.';
}

export function canStartWritingTrial(input: {
  grade: string;
  hadTrial: boolean;
  hasPaidAccess: boolean;
}): { ok: true } | { ok: false; reason: string } {
  if (!usesWritingDashboard(input.grade)) {
    return { ok: false, reason: 'Selective Writing is for Year 4–7 profiles.' };
  }
  if (input.hasPaidAccess) {
    return { ok: false, reason: 'This child already has Selective Writing access.' };
  }
  if (input.hadTrial) {
    return { ok: false, reason: 'This child has already used a 7-day trial.' };
  }
  return { ok: true };
}

export function trialAllowsPracticeTask(input: {
  promptKind: string;
  alreadyTried: boolean;
  distinctTried: number;
  attemptLimit?: number;
}): { ok: true } | { ok: false; message: string } {
  const kind = input.promptKind || 'practice';
  if (kind === 'custom') {
    return { ok: false, message: trialCustomLockMessage() };
  }
  if (kind !== 'trial') {
    return { ok: false, message: trialExamLockMessage() };
  }
  const limit = input.attemptLimit ?? WRITING_TRIAL_FULL_TASKS;
  if (!input.alreadyTried && input.distinctTried >= limit) {
    return { ok: false, message: trialFullTaskLimitMessage(limit) };
  }
  return { ok: true };
}

export function clipTrialRecommendation<
  T extends { prompt_id: string; next_draft: number },
>(recommendation: T | null, distinctTried: number, attemptLimit?: number): T | null {
  if (!recommendation) return null;
  const allowed = trialAllowsPracticeTask({
    promptKind: 'trial',
    alreadyTried: recommendation.next_draft > 1,
    distinctTried,
    attemptLimit,
  });
  return allowed.ok ? recommendation : null;
}
