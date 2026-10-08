export const SUBJECTS = ['writing', 'math', 'thinking', 'reading'] as const;

export type Subject = (typeof SUBJECTS)[number];

/**
 * Exam-catalogue subjects that can be bought today without a year-level profile.
 * K–Y1 Maths is sold separately through `isPurchasableSubject` / `priceIdForPurchase`.
 */
export const AVAILABLE_SUBJECTS = ['writing'] as const satisfies readonly Subject[];

export const SUBJECT_LABELS: Record<Subject, string> = {
  writing: 'Writing',
  math: 'Math',
  thinking: 'Thinking Skills',
  reading: 'Reading',
};

export const SUBJECT_BLURBS: Record<Subject, string> = {
  writing: 'Selective writing with timed drafts and AI feedback.',
  math: 'Selective maths problem sets. This exam subject is still being prepared.',
  thinking: 'Thinking Skills reasoning and pattern practice.',
  reading: 'Reading comprehension passages and questions.',
};

/** Selective and OC exam subjects: $99 AUD one-off for 1 year of access. */
export const SUBJECT_PRICE_AUD = 99;
export const EXAM_SUBJECT_PRICE_AUD = SUBJECT_PRICE_AUD;

/** K–Y1 year-level subjects: a smaller set of practice at $29 AUD for 1 year. */
export const KY1_SUBJECT_PRICE_AUD = 29;

export function isSubject(value: unknown): value is Subject {
  return typeof value === 'string' && (SUBJECTS as readonly string[]).includes(value);
}

export function isAvailableSubject(subject: Subject): boolean {
  return (AVAILABLE_SUBJECTS as readonly Subject[]).includes(subject);
}

export function isKy1MathGrade(grade: string): boolean {
  return grade === 'Kindergarten' || grade === 'Year 1';
}

export function isExamWritingGrade(grade: string): boolean {
  return grade === 'Year 4' || grade === 'Year 5' || grade === 'Year 6' || grade === 'Year 7';
}

/** Whether this child can buy this subject today. */
export function isPurchasableSubject(subject: Subject, grade: string): boolean {
  if (subject === 'writing') return isExamWritingGrade(grade);
  if (subject === 'math') return isKy1MathGrade(grade);
  return false;
}

/**
 * Server-side mapping from exam subject to its Stripe price id. Selective Math
 * stays on `STRIPE_MATH_PRICE_ID`. K–Y1 Maths uses `priceIdForPurchase`.
 */
export function priceIdForSubject(subject: Subject): string | undefined {
  const map: Record<Subject, string | undefined> = {
    writing: process.env.STRIPE_WRITING_PRICE_ID,
    math: process.env.STRIPE_MATH_PRICE_ID,
    thinking: process.env.STRIPE_THINKING_PRICE_ID,
    reading: process.env.STRIPE_READING_PRICE_ID,
  };
  return map[subject];
}

/**
 * Stripe price for this child. Kindergarten and Year 1 Maths use the live
 * `STRIPE_KY1_MATH_PRICE_ID` ($29). Do not reuse Selective Math's price.
 */
export function priceIdForPurchase(subject: Subject, grade: string): string | undefined {
  if (subject === 'math' && isKy1MathGrade(grade)) {
    return process.env.STRIPE_KY1_MATH_PRICE_ID;
  }
  return priceIdForSubject(subject);
}

export function priceAudForPurchase(subject: Subject, grade: string): number {
  if (subject === 'math' && isKy1MathGrade(grade)) return KY1_SUBJECT_PRICE_AUD;
  return SUBJECT_PRICE_AUD;
}
