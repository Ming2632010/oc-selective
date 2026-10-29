import { trialDaysLeft, trialExpiresAt } from '@/lib/writing-trial';
import {
  EXAM_MATH_TRIAL_MINI_QUESTIONS,
  EXAM_MATH_TRIAL_WARMUP_QUESTIONS,
  usesExamMathDashboard,
} from '@/lib/exam-math';

export const EXAM_MATH_TRIAL_DAYS = 7;
export {
  EXAM_MATH_TRIAL_MINI_QUESTIONS,
  EXAM_MATH_TRIAL_MINI_SET,
  EXAM_MATH_TRIAL_WARMUP_QUESTIONS,
  EXAM_MATH_TRIAL_WARMUP_SET,
} from '@/lib/exam-math';

export type ExamMathAccessState = 'granted' | 'trial' | 'unlicensed' | 'not-found' | 'wrong-grade';

export function hasExamMathProductAccess(state: ExamMathAccessState) {
  return state === 'granted' || state === 'trial';
}

export function examMathTrialOfferCopy() {
  return '10 mixed questions with graphs and diagrams, and one 12-question mini exam';
}

export function examMathTrialStartRequiredMessage() {
  return 'Start the 7-day Selective Math trial on the dashboard first.';
}

export function examMathAccessRequiredMessage(trialPack = false) {
  return trialPack
    ? examMathTrialStartRequiredMessage()
    : 'Selective Math access is required for this child.';
}

export function examMathTrialEndedMessage() {
  return 'The 7-day Selective Math trial has ended. Buy a year to keep practising.';
}

export function examMathTrialEndedKeepWorkMessage() {
  return 'The 7-day Selective Math trial has ended. Buy a year to keep this work.';
}

export function examMathTrialInProgressMessage(input: {
  daysLeft: number;
  warmupUsed: number;
  warmupLimit?: number;
  miniUsed: number;
  miniLimit?: number;
}) {
  const days = Math.max(0, input.daysLeft);
  const warmupLimit = input.warmupLimit ?? EXAM_MATH_TRIAL_WARMUP_QUESTIONS;
  const miniLimit = input.miniLimit ?? EXAM_MATH_TRIAL_MINI_QUESTIONS;
  return `Selective Math trial · ${days} day${days === 1 ? '' : 's'} left · warm-up ${input.warmupUsed}/${warmupLimit} · mini exam ${input.miniUsed}/${miniLimit}. Buy a year to keep this work.`;
}

export function examMathUnlicensedAccessMessage(input: {
  trialPack?: boolean;
  hadTrial?: boolean;
}) {
  if (input.trialPack && input.hadTrial) return examMathTrialEndedMessage();
  return examMathAccessRequiredMessage(Boolean(input.trialPack));
}

export function examMathTrialPaidLockMessage() {
  return 'The extra trial pack stays with the 7-day trial. Open the mini exams and papers for this year’s practice.';
}

export function examMathTrialCatalogueLockMessage() {
  return `The 7-day trial includes ${examMathTrialOfferCopy()}. The 100 mini exams, 20 papers, and Strengthen stay in the full year.`;
}

export function examMathTrialStrengthenLockMessage() {
  return 'Strengthen stays in the full year. The trial is 10 mixed questions and one 12-question mini exam.';
}

export function examMathTrialSetUsedMessage() {
  return 'This trial sitting is already finished. Buy a year for 100 mini exams and 20 papers.';
}

export function canStartExamMathTrial(input: {
  grade: string;
  hadTrial: boolean;
  hasPaidAccess: boolean;
}): { ok: true } | { ok: false; reason: string } {
  if (!usesExamMathDashboard(input.grade)) {
    return { ok: false, reason: 'Selective Math is for Year 4–7 profiles.' };
  }
  if (input.hasPaidAccess) {
    return { ok: false, reason: 'This child already has Selective Math access.' };
  }
  if (input.hadTrial) {
    return { ok: false, reason: 'This child has already used a 7-day Selective Math trial.' };
  }
  return { ok: true };
}

export { trialDaysLeft, trialExpiresAt };
