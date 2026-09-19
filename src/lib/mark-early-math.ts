import type { EarlyMathItem, EarlyMathKind } from './early-math';

export type EarlyMathMark = {
  isCorrect: boolean;
  explanation: string;
};

export function normalizeMathAnswer(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function numberWords(): Record<string, string> {
  return {
    zero: '0',
    none: '0',
    one: '1',
    two: '2',
    three: '3',
    four: '4',
    five: '5',
    six: '6',
    seven: '7',
    eight: '8',
    nine: '9',
    ten: '10',
    eleven: '11',
    twelve: '12',
    thirteen: '13',
    fourteen: '14',
    fifteen: '15',
    sixteen: '16',
    seventeen: '17',
    eighteen: '18',
    nineteen: '19',
    twenty: '20',
    thirty: '30',
    forty: '40',
    fifty: '50',
    sixty: '60',
    seventy: '70',
    eighty: '80',
    ninety: '90',
    hundred: '100',
  };
}

export function canonicalizeCount(value: string) {
  const trimmed = normalizeMathAnswer(value);
  const words = numberWords();
  if (words[trimmed]) return words[trimmed];
  const digits = trimmed.replace(/ /g, '');
  if (/^-?\d+$/.test(digits)) return String(Number(digits));
  return trimmed;
}

export function markEarlyMathItem(
  item: Pick<EarlyMathItem, 'kind' | 'correctIndex' | 'accepted' | 'options' | 'explanation'>,
  answer: { index?: number | null; text?: string | null },
): EarlyMathMark {
  const kind: EarlyMathKind = item.kind;
  if (kind === 'choice' || kind === 'true_false') {
    const index = typeof answer.index === 'number' ? answer.index : -1;
    const correct =
      typeof item.correctIndex === 'number' && index === item.correctIndex;
    return { isCorrect: correct, explanation: item.explanation };
  }

  const accepted = (item.accepted ?? []).map(canonicalizeCount).filter(Boolean);
  const given = canonicalizeCount(answer.text ?? '');
  return {
    isCorrect: given.length > 0 && accepted.includes(given),
    explanation: item.explanation,
  };
}
