export type WarmupKind = 'thinking' | 'reading';

export type WarmupQuestion = {
  id: string;
  kind: WarmupKind;
  stem: string;
  options: string[];
  correctIndex: number;
};

const BANK_A: WarmupQuestion[] = [
  {
    id: 'warmup-a-1',
    kind: 'thinking',
    stem: 'Which is the odd one out?',
    options: ['Square', 'Triangle', 'Circle', 'Hour'],
    correctIndex: 3,
  },
  {
    id: 'warmup-a-2',
    kind: 'thinking',
    stem: 'What comes next? 3, 6, 12, 24, …',
    options: ['30', '36', '48', '42'],
    correctIndex: 2,
  },
  {
    id: 'warmup-a-3',
    kind: 'thinking',
    stem: 'Sam says the library is north of the oval. The map shows the library south of the oval. Who is right?',
    options: ['Sam', 'The map', 'Both', 'Neither — they could both be wrong in different ways'],
    correctIndex: 1,
  },
  {
    id: 'warmup-a-4',
    kind: 'reading',
    stem: 'The carnival was moved to the hall after the first race. Runners left muddy prints on the floor, and the canteen sold out of towels before lunch.\n\nWhat is the most likely reason the carnival was moved?',
    options: [
      'The hall had a better running track',
      'The weather made the outdoor ground unusable',
      'The canteen wanted to sell more towels',
      'Students asked to race indoors for fun',
    ],
    correctIndex: 1,
  },
  {
    id: 'warmup-a-5',
    kind: 'reading',
    stem: '“Maya hesitated at the gate, then slipped the letter into the box before she could change her mind.”\n\nIn this sentence, hesitated is closest in meaning to:',
    options: ['ran quickly', 'paused, unsure', 'laughed loudly', 'forgot entirely'],
    correctIndex: 1,
  },
];

const BANK_B: WarmupQuestion[] = [
  {
    id: 'warmup-b-1',
    kind: 'thinking',
    stem: 'Which does not belong with the others?',
    options: ['Flute', 'Violin', 'Drum', 'Recipe'],
    correctIndex: 3,
  },
  {
    id: 'warmup-b-2',
    kind: 'thinking',
    stem: 'A pattern of tiles is: blue, blue, red, blue, blue, red, blue, …\nWhat colour should come next?',
    options: ['Red', 'Blue', 'Green', 'Yellow'],
    correctIndex: 1,
  },
  {
    id: 'warmup-b-3',
    kind: 'thinking',
    stem: 'If all Year 6 students have a locker, and Jordan is in Year 6, which statement must be true?',
    options: [
      'Jordan has a locker',
      'Jordan is the locker monitor',
      'Nobody else has a locker',
      'Year 5 students have no lockers',
    ],
    correctIndex: 0,
  },
  {
    id: 'warmup-b-4',
    kind: 'reading',
    stem: 'Buses were late because a fallen branch blocked High Street. Students walked the last two blocks and still arrived before the second bell.\n\nWhich statement is best supported?',
    options: [
      'The school cancelled lessons',
      'The delay was caused by the blocked street, but students were not very late',
      'The branch fell during lunch',
      'Every bus in town was cancelled',
    ],
    correctIndex: 1,
  },
  {
    id: 'warmup-b-5',
    kind: 'reading',
    stem: '“The oval was a patchwork of puddles, and the goalposts leaned as if tired.”\n\nThe writer mainly wants the reader to:',
    options: [
      'count how many puddles there are',
      'picture a worn, waterlogged sports field',
      'learn the rules of a sport',
      'blame the students for the mess',
    ],
    correctIndex: 1,
  },
];

export const WARMUP_BANKS = [BANK_A, BANK_B] as const;

export function warmupBankForPrompt(promptId: string): WarmupQuestion[] {
  let sum = 0;
  for (const ch of promptId) sum += ch.charCodeAt(0);
  return WARMUP_BANKS[sum % WARMUP_BANKS.length]!.slice();
}

export function publicWarmupQuestions(questions: WarmupQuestion[]) {
  return questions.map(({ correctIndex: _c, ...rest }) => rest);
}

export function scoreWarmupAnswers(
  questions: WarmupQuestion[],
  answers: unknown,
): { answers: number[]; correct: number } | null {
  if (!Array.isArray(answers) || answers.length !== questions.length) return null;
  const indexes: number[] = [];
  for (let i = 0; i < questions.length; i += 1) {
    const value = answers[i];
    const q = questions[i]!;
    if (typeof value !== 'number' || !Number.isInteger(value)) return null;
    if (value < 0 || value >= q.options.length) return null;
    indexes.push(value);
  }
  const correct = indexes.filter((choice, i) => choice === questions[i]!.correctIndex).length;
  return { answers: indexes, correct };
}
