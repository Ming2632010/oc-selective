export const MINI_ITEM_KINDS = [
  'choice',
  'spelling',
  'rewrite',
  'order',
  'short_write',
] as const;

export type MiniItemKind = (typeof MINI_ITEM_KINDS)[number];

export function isMiniItemKind(value: string): value is MiniItemKind {
  return (MINI_ITEM_KINDS as readonly string[]).includes(value);
}

export const MINI_ITEM_KIND_LABELS: Record<MiniItemKind, string> = {
  choice: 'Choose',
  spelling: 'Spelling',
  rewrite: 'Rewrite',
  order: 'Order',
  short_write: 'Write',
};

export type SpellingPrompt = {
  sentence: string;
  misspelled: string;
  accepted: string[];
};

export type RewritePrompt = {
  original: string;
  hint: string;
  mustInclude: string[];
  mustNotInclude?: string[];
  minWords: number;
  requireCapital?: boolean;
  requireEndPunct?: boolean;
  requireQuote?: boolean;
  sample: string;
};

export type OrderPrompt = {
  sentences: string[];
  shuffled: string[];
};

export type ShortWritePrompt = {
  task: string;
  mustInclude: string[];
  mustNotInclude?: string[];
  minWords: number;
  maxWords?: number;
  requireCapital?: boolean;
  requireEndPunct?: boolean;
  sample: string;
};

export type MiniPrompt =
  | SpellingPrompt
  | RewritePrompt
  | OrderPrompt
  | ShortWritePrompt
  | Record<string, never>;

export type ChecklistItem = {
  id: string;
  label: string;
  passed: boolean;
};

export type MiniMarkResult = {
  isCorrect: boolean;
  explanation: string;
  sample?: string;
  checks: ChecklistItem[];
};

/** Prompt fields the student can see before they answer. */
export function publicMiniPrompt(
  kind: MiniItemKind,
  prompt: unknown,
): Record<string, unknown> {
  const raw =
    prompt && typeof prompt === 'object' && !Array.isArray(prompt)
      ? (prompt as Record<string, unknown>)
      : {};

  if (kind === 'spelling') {
    return {
      sentence: asString(raw.sentence),
      misspelled: asString(raw.misspelled),
    };
  }
  if (kind === 'rewrite') {
    return {
      original: asString(raw.original),
      hint: asString(raw.hint),
      minWords: asPositiveInt(raw.minWords, 6),
    };
  }
  if (kind === 'order') {
    return {
      shuffled: asStringArray(raw.shuffled),
    };
  }
  if (kind === 'short_write') {
    return {
      task: asString(raw.task),
      minWords: asPositiveInt(raw.minWords, 8),
      maxWords:
        typeof raw.maxWords === 'number' && raw.maxWords > 0
          ? raw.maxWords
          : undefined,
    };
  }
  return {};
}

export function parseMiniPrompt(
  kind: MiniItemKind,
  prompt: unknown,
): MiniPrompt {
  const raw =
    prompt && typeof prompt === 'object' && !Array.isArray(prompt)
      ? (prompt as Record<string, unknown>)
      : {};

  if (kind === 'spelling') {
    return {
      sentence: asString(raw.sentence),
      misspelled: asString(raw.misspelled),
      accepted: asStringArray(raw.accepted),
    };
  }
  if (kind === 'rewrite') {
    return {
      original: asString(raw.original),
      hint: asString(raw.hint),
      mustInclude: asStringArray(raw.mustInclude),
      mustNotInclude: asStringArray(raw.mustNotInclude),
      minWords: asPositiveInt(raw.minWords, 6),
      requireCapital: raw.requireCapital !== false,
      requireEndPunct: raw.requireEndPunct !== false,
      requireQuote: raw.requireQuote === true,
      sample: asString(raw.sample),
    };
  }
  if (kind === 'order') {
    return {
      sentences: asStringArray(raw.sentences),
      shuffled: asStringArray(raw.shuffled),
    };
  }
  if (kind === 'short_write') {
    return {
      task: asString(raw.task),
      mustInclude: asStringArray(raw.mustInclude),
      mustNotInclude: asStringArray(raw.mustNotInclude),
      minWords: asPositiveInt(raw.minWords, 8),
      maxWords:
        typeof raw.maxWords === 'number' && raw.maxWords > 0
          ? raw.maxWords
          : undefined,
      requireCapital: raw.requireCapital !== false,
      requireEndPunct: raw.requireEndPunct !== false,
      sample: asString(raw.sample),
    };
  }
  return {};
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function asPositiveInt(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}
