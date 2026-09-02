import { markMiniChoice } from '@/lib/seed-mini-drills';
import {
  parseMiniPrompt,
  type ChecklistItem,
  type MiniItemKind,
  type MiniMarkResult,
  type OrderPrompt,
  type RewritePrompt,
  type ShortWritePrompt,
  type SpellingPrompt,
} from '@/lib/mini-item-kinds';

export function normalizeAnswerText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[''`´‘’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function hasWord(haystack: string, needle: string) {
  const text = ` ${normalizeAnswerText(haystack)} `;
  const target = normalizeAnswerText(needle);
  if (!target) return false;
  return text.includes(` ${target} `);
}

function startsWithCapital(value: string) {
  const trimmed = value.trim();
  return /^["“'‘]?[A-Z]/.test(trimmed);
}

function endsWithSentencePunct(value: string) {
  return /[.!?]["”'’]?$/.test(value.trim());
}

function hasQuoteMark(value: string) {
  return /["“”]/.test(value);
}

function spellingResult(
  prompt: SpellingPrompt,
  answerText: string,
  explanation: string,
): MiniMarkResult {
  const answer = normalizeAnswerText(answerText);
  const passed =
    answer.length > 0 &&
    prompt.accepted.some((word) => normalizeAnswerText(word) === answer);
  return {
    isCorrect: passed,
    explanation,
    sample: prompt.accepted[0],
    checks: [
      {
        id: 'spelling',
        label: passed
          ? 'You spelled the word correctly.'
          : 'Type the correct spelling of the mistake.',
        passed,
      },
    ],
  };
}

function writingChecks(
  answer: string,
  spec: {
    mustInclude: string[];
    mustNotInclude?: string[];
    minWords: number;
    maxWords?: number;
    requireCapital?: boolean;
    requireEndPunct?: boolean;
    requireQuote?: boolean;
  },
): ChecklistItem[] {
  const words = countWords(answer);
  const checks: ChecklistItem[] = [
    {
      id: 'min-words',
      label: `Use at least ${spec.minWords} words.`,
      passed: words >= spec.minWords,
    },
  ];
  if (spec.maxWords) {
    checks.push({
      id: 'max-words',
      label: `Keep it under ${spec.maxWords} words.`,
      passed: words <= spec.maxWords,
    });
  }
  if (spec.requireCapital !== false) {
    checks.push({
      id: 'capital',
      label: 'Start with a capital letter.',
      passed: startsWithCapital(answer),
    });
  }
  if (spec.requireEndPunct !== false) {
    checks.push({
      id: 'end-punct',
      label: 'Finish with a full stop, question mark, or exclamation mark.',
      passed: endsWithSentencePunct(answer),
    });
  }
  if (spec.requireQuote) {
    checks.push({
      id: 'quote',
      label: 'Put the spoken words inside speech marks.',
      passed: hasQuoteMark(answer),
    });
  }
  for (const token of spec.mustInclude) {
    checks.push({
      id: `include-${normalizeAnswerText(token) || token}`,
      label: `Include “${token}”.`,
      passed: hasWord(answer, token),
    });
  }
  for (const token of spec.mustNotInclude ?? []) {
    checks.push({
      id: `avoid-${normalizeAnswerText(token) || token}`,
      label: `Do not use “${token}”.`,
      passed: !hasWord(answer, token),
    });
  }
  return checks;
}

function rewriteResult(
  prompt: RewritePrompt,
  answerText: string,
  explanation: string,
): MiniMarkResult {
  const checks = writingChecks(answerText, prompt);
  return {
    isCorrect: checks.every((check) => check.passed),
    explanation,
    sample: prompt.sample,
    checks,
  };
}

function shortWriteResult(
  prompt: ShortWritePrompt,
  answerText: string,
  explanation: string,
): MiniMarkResult {
  const checks = writingChecks(answerText, prompt);
  return {
    isCorrect: checks.every((check) => check.passed),
    explanation,
    sample: prompt.sample,
    checks,
  };
}

function orderResult(
  prompt: OrderPrompt,
  answerOrder: number[],
  explanation: string,
): MiniMarkResult {
  const rebuilt = answerOrder
    .map((index) => prompt.shuffled[index])
    .filter((line): line is string => typeof line === 'string');
  const passed =
    rebuilt.length === prompt.sentences.length &&
    rebuilt.every((line, index) => line === prompt.sentences[index]);
  return {
    isCorrect: passed,
    explanation,
    sample: prompt.sentences.join(' '),
    checks: [
      {
        id: 'order',
        label: passed
          ? 'The sentences are in a clear order.'
          : 'Put the sentences in an order a marker can follow.',
        passed,
      },
    ],
  };
}

export function markMiniItem(input: {
  kind: MiniItemKind;
  correctIndex: number;
  answerIndex?: number | null;
  answerText?: string;
  answerOrder?: number[];
  prompt: unknown;
  explanation: string;
}): MiniMarkResult {
  const prompt = parseMiniPrompt(input.kind, input.prompt);
  const explanation = input.explanation;

  if (input.kind === 'choice') {
    const passed = markMiniChoice(input.correctIndex, Number(input.answerIndex));
    return {
      isCorrect: passed,
      explanation,
      checks: [
        {
          id: 'choice',
          label: passed ? 'You chose the best option.' : 'Try the better option.',
          passed,
        },
      ],
    };
  }

  if (input.kind === 'spelling') {
    return spellingResult(prompt as SpellingPrompt, input.answerText ?? '', explanation);
  }
  if (input.kind === 'rewrite') {
    return rewriteResult(prompt as RewritePrompt, input.answerText ?? '', explanation);
  }
  if (input.kind === 'short_write') {
    return shortWriteResult(
      prompt as ShortWritePrompt,
      input.answerText ?? '',
      explanation,
    );
  }
  return orderResult(prompt as OrderPrompt, input.answerOrder ?? [], explanation);
}
