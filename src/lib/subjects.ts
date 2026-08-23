export const SUBJECTS = ['writing', 'math', 'thinking', 'reading'] as const;

export type Subject = (typeof SUBJECTS)[number];

export const SUBJECT_LABELS: Record<Subject, string> = {
  writing: 'Writing',
  math: 'Math',
  thinking: 'Thinking Skills',
  reading: 'Reading',
};

export const SUBJECT_BLURBS: Record<Subject, string> = {
  writing: 'NSW Selective & OC writing tasks with AI-scored drafts.',
  math: 'Timed problem sets across the selective maths syllabus.',
  thinking: 'Thinking Skills reasoning and pattern practice.',
  reading: 'Reading comprehension passages and questions.',
};

/** Each subject is a $99 AUD / year subscription. */
export const SUBJECT_PRICE_AUD = 99;

export function isSubject(value: unknown): value is Subject {
  return typeof value === 'string' && (SUBJECTS as readonly string[]).includes(value);
}

/**
 * Server-side mapping from subject to its Stripe price id. Prices are managed
 * via environment variables so they are never exposed to the client.
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
