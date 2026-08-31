export type ExamPhase = 'plan' | 'write' | 'check';

export const EXAM_PHASE_COPY: Record<ExamPhase, { title: string; body: string }> = {
  plan: {
    title: 'Plan',
    body: 'About five minutes — plan on this screen. You will not get extra time.',
  },
  write: {
    title: 'Write',
    body: 'Writing time. Keep going, and leave a few minutes to check.',
  },
  check: {
    title: 'Check',
    body: 'Last stretch — check spelling, punctuation, and that you answered the question.',
  },
};

/** 5 / 20 / 5 minutes, scaled to the paper's total time (including localhost debug timers). */
export function examPhase(secondsLeft: number, totalSeconds: number): ExamPhase {
  const total = Math.max(1, totalSeconds);
  const elapsed = Math.max(0, total - secondsLeft);
  const planEnd = total * (5 / 30);
  const writeEnd = total * (25 / 30);
  if (elapsed < planEnd) return 'plan';
  if (elapsed < writeEnd) return 'write';
  return 'check';
}
