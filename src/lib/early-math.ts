export const EARLY_MATH_UNIT_COUNT = 6;

export const EARLY_MATH_SKILLS = [
  'subitise-perceptual',
  'subitise-structured',
  'subitise-conceptual',
  'count-one-to-one',
  'count-on',
  'cardinality',
  'conservation',
  'compare-collections',
  'order-numbers',
  'teen-vs-ten',
  'before-after',
  'ordinal',
  'part-whole',
  'five-wise',
  'ten-bonds',
  'missing-part',
  'join-result',
  'join-change',
  'join-start',
  'separate-result',
  'separate-change',
  'separate-start',
  'ppw-whole',
  'ppw-part',
  'compare-difference',
  'compare-quantity',
  'equal-groups',
  'sharing',
  'leftovers',
  'repeating-pattern',
  'skip-count',
  'tens-ones',
  'ten-more-less',
  'number-line',
  'place-zero',
  'shape-2d',
  'shape-3d',
  'position',
  'length-compare',
  'mass-compare',
  'capacity-compare',
  'time-hour',
  'time-half',
  'days-sequence',
  'picture-graph',
  'tally',
  'chance-language',
  'money-count',
] as const;

export type EarlyMathSkill = (typeof EARLY_MATH_SKILLS)[number];

export const EARLY_MATH_SKILL_LABELS: Record<EarlyMathSkill, string> = {
  'subitise-perceptual': 'See a small amount',
  'subitise-structured': 'See a pattern',
  'subitise-conceptual': 'See parts together',
  'count-one-to-one': 'Count each one',
  'count-on': 'Count on',
  'cardinality': 'The last number is how many',
  'conservation': 'Same amount, new look',
  'compare-collections': 'More, less, same',
  'order-numbers': 'Put numbers in order',
  'teen-vs-ten': 'Teens and tens',
  'before-after': 'Before and after',
  'ordinal': 'First, second, third',
  'part-whole': 'Parts of a number',
  'five-wise': 'Use five',
  'ten-bonds': 'Make ten',
  'missing-part': 'Find the missing part',
  'join-result': 'How many now?',
  'join-change': 'What number is missing?',
  'join-start': 'What number is missing?',
  'separate-result': 'How many left?',
  'separate-change': 'What number is missing?',
  'separate-start': 'What number is missing?',
  'ppw-whole': 'Parts make a whole',
  'ppw-part': 'Find a hidden part',
  'compare-difference': 'How many more?',
  'compare-quantity': 'How many does the other have?',
  'equal-groups': 'Equal groups',
  'sharing': 'Share equally',
  'leftovers': 'Left over',
  'repeating-pattern': 'What repeats?',
  'skip-count': 'Skip counting',
  'tens-ones': 'Tens and ones',
  'ten-more-less': 'Ten more, ten less',
  'number-line': 'Number line',
  'place-zero': 'Zero as a place',
  'shape-2d': 'Flat shapes',
  'shape-3d': 'Solid objects',
  'position': 'Where is it?',
  'length-compare': 'Longer and shorter',
  'mass-compare': 'Heavier and lighter',
  'capacity-compare': 'Holds more',
  'time-hour': 'O’clock',
  'time-half': 'Half past',
  'days-sequence': 'Days and times',
  'picture-graph': 'Picture graph',
  'tally': 'Tally marks',
  'chance-language': 'Might, will, won’t',
  'money-count': 'Coins and dollars',
};

export const EARLY_MATH_KINDS = ['choice', 'count', 'true_false'] as const;
export type EarlyMathKind = (typeof EARLY_MATH_KINDS)[number];

export function isEarlyMathKind(value: string): value is EarlyMathKind {
  return (EARLY_MATH_KINDS as readonly string[]).includes(value);
}

export type EarlyMathDifficulty = 'kindy' | 'core' | 'stretch';

export type MathStimulus =
  | { type: 'dots'; layout: 'dice' | 'scattered' | 'line' | 'pairs' | 'domino'; count: number; seed?: number; second?: number }
  | { type: 'tenFrame'; filled: number; frames?: 1 | 2 }
  | { type: 'fingers'; left: number; right: number }
  | { type: 'tally'; count: number }
  | { type: 'numberTrack'; min: number; max: number; missing?: number[]; highlight?: number; ask?: 'before' | 'after' }
  | { type: 'numberLine'; min: number; max: number; target?: number; missing?: number[] }
  | {
      type: 'numberLineHops';
      min: number;
      max: number;
      start: number;
      hops?: number;
      end?: number;
      direction?: 'forward' | 'back';
      blank?: 'start' | 'hops' | 'result';
    }
  | { type: 'numberSentence'; a: number | null; op: '+' | '-'; b: number | null; result: number | null }
  | {
      type: 'partWhole';
      whole: number | null;
      left: number | null;
      right: number | null;
      wholeLabel?: string;
      leftLabel?: string;
      rightLabel?: string;
    }
  | { type: 'groups'; groups: { count: number; icon: string; label: string; crossed?: number }[] }
  | { type: 'pattern'; items: string[]; blankIndex: number }
  | { type: 'shapes'; items: { kind: string; label?: string }[] }
  | { type: 'position'; place: 'bench' | 'shelf' | 'slide'; target: string }
  | { type: 'compareBars'; a: number; b: number; aLabel: string; bLabel: string }
  | { type: 'pictureGraph'; title: string; rows: { label: string; count: number; icon: string }[] }
  | { type: 'clock'; hour: number; minute: 0 | 30 }
  | { type: 'baseTen'; tens: number; ones: number }
  | { type: 'sharing'; total: number; people: number }
  | { type: 'coins'; coins: { value: number; count: number }[] }
  | {
      type: 'matchNumber';
      target: number;
      choices: { count: number; icon: string }[];
    }
  | {
      type: 'howManyMore';
      left: { count: number; label: string; icon: string; color?: string };
      right: { count: number; label: string; icon: string; color?: string };
    }
  | {
      type: 'oddOneOut';
      items: { icon: string; count?: number; color?: string }[];
    }
  | { type: 'giantNumber'; value: number | string }
  | { type: 'lineup'; names: string[] }
  | { type: 'balance'; left: string; right: string; down: 'left' | 'right' }
  | { type: 'jugs'; tallCups: number; wideCups: number }
  | { type: 'dayStrip'; days?: string[]; highlight: string }
  | {
      type: 'tapPictures';
      items: { icon: string; count?: number; color?: string }[];
    };

export type EarlyMathItem = {
  slug: string;
  unitId: number;
  skill: EarlyMathSkill;
  kind: EarlyMathKind;
  title: string;
  stem: string;
  stimulus?: MathStimulus;
  options?: string[];
  correctIndex?: number;
  accepted?: string[];
  explanation: string;
  parentPrompt: string;
  difficulty: EarlyMathDifficulty;
  sortOrder: number;
};

export type EarlyMathUnit = {
  id: number;
  title: string;
  blurb: string;
  kindyFocus: string;
  year1Focus: string;
};

export const EARLY_MATH_UNITS: EarlyMathUnit[] = [
  {
    id: 1,
    title: 'See the number',
    blurb: 'Name a small amount without counting every object.',
    kindyFocus: 'Dice, fingers, and ten-frames to 10.',
    year1Focus: 'See parts inside a number, such as 5 and 2 inside 7.',
  },
  {
    id: 2,
    title: 'Count and compare',
    blurb: 'Count with care, then say which is more, less, or the same.',
    kindyFocus: 'Count to 20. One more, one less.',
    year1Focus: 'Teens versus tens, missing numbers, and counting on.',
  },
  {
    id: 3,
    title: 'Parts of 10',
    blurb: 'Break a number into parts, and put parts back to make 10.',
    kindyFocus: 'Bonds to 5 and 10 with five as a landmark.',
    year1Focus: 'Missing parts and “same as” number sentences.',
  },
  {
    id: 4,
    title: 'Put together, take away',
    blurb: 'Add and take away with pictures, number sentences, and a number line.',
    kindyFocus: 'How many altogether, and how many left.',
    year1Focus: 'Missing numbers such as 6 + □ = 9, and hops on a line.',
  },
  {
    id: 5,
    title: 'Tens and ones',
    blurb: 'See two-digit numbers as groups of ten and leftover ones.',
    kindyFocus: '11 to 20 as ten and some more.',
    year1Focus: 'Numbers to 20 and 100, skip counting, ten more and ten less.',
  },
  {
    id: 6,
    title: 'Everyday maths',
    blurb: 'Shapes, position, measure, time, sharing, and a simple graph.',
    kindyFocus: 'Name shapes, compare length, hour time, share equally.',
    year1Focus: 'Informal units, half past, picture graphs, and leftovers.',
  },
];

export function getEarlyMathUnit(id: number): EarlyMathUnit | null {
  return EARLY_MATH_UNITS.find((unit) => unit.id === id) ?? null;
}

export function isEarlyMathUnitId(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= EARLY_MATH_UNIT_COUNT;
}

export function recommendedUnitOrder(grade: string): number[] {
  if (grade === 'Year 1') return [3, 4, 5, 2, 6, 1];
  return [1, 2, 3, 4, 6, 5];
}

/** Consecutive questions share a page: 1+2, 3+4, leftover alone. */
export function mathsPracticePair<T extends { slug: string }>(
  items: readonly T[],
  slug: string,
): { pair: T[]; nextSlug: string | null } | null {
  const index = items.findIndex((item) => item.slug === slug);
  if (index < 0) return null;
  const start = index - (index % 2);
  return {
    pair: items.slice(start, start + 2),
    nextSlug: items[start + 2]?.slug ?? null,
  };
}

const ASK_BY_SKILL: Record<EarlyMathSkill, string> = {
  'subitise-perceptual': 'How many?',
  'subitise-structured': 'How many?',
  'subitise-conceptual': 'How many altogether?',
  'count-one-to-one': 'How do you count?',
  'count-on': 'What comes next?',
  'cardinality': 'How many?',
  'conservation': 'Still the same?',
  'compare-collections': 'Which has more?',
  'order-numbers': 'Smallest to biggest?',
  'teen-vs-ten': 'What is this number?',
  'before-after': 'What number?',
  'ordinal': 'Who is third?',
  'part-whole': 'Which parts?',
  'five-wise': 'How many more?',
  'ten-bonds': 'Is this 10?',
  'missing-part': 'What is the missing part?',
  'join-result': 'How many now?',
  'join-change': 'Missing number in a + □',
  'join-start': 'Missing start number',
  'separate-result': 'How many left?',
  'separate-change': 'Missing number in a − □',
  'separate-start': 'Missing start number',
  'ppw-whole': 'How many altogether?',
  'ppw-part': 'What is the missing part?',
  'compare-difference': 'How many more?',
  'compare-quantity': 'How many does the other have?',
  'equal-groups': 'How many in each?',
  'sharing': 'How many for each?',
  'leftovers': 'How many are left over?',
  'repeating-pattern': 'What comes next?',
  'skip-count': 'What comes next?',
  'tens-ones': 'What number is this?',
  'ten-more-less': '10 more or less?',
  'number-line': 'Which number?',
  'place-zero': 'What number is this?',
  'shape-2d': 'Look at the shape.',
  'shape-3d': 'Which one rolls?',
  'position': 'Where is it?',
  'length-compare': 'Which is longer?',
  'mass-compare': 'Which is heavier?',
  'capacity-compare': 'Which holds more?',
  'time-hour': 'What time is it?',
  'time-half': 'What time is it?',
  'days-sequence': 'When?',
  'picture-graph': 'Which has the most?',
  'tally': 'How many?',
  'chance-language': 'Will it happen?',
  'money-count': 'How many dollars?',
};

const ASK_BY_SLUG: Record<string, string> = {
  'see-odd-one-not-four': 'Which one is different?',
  'count-order-three-numbers': 'Smallest to biggest?',
  'every-not-a-square': 'Which is not a square?',
  'count-thirteen-not-thirty': 'What is 13?',
  'count-compare-eleven-eight': 'Which has more?',
  'count-on-from-six': 'How many now?',
  'count-after-eighteen': 'What comes after?',
  'count-before-eleven': 'What comes before?',
  'count-one-to-one-keep-track': 'How do you count?',
  'parts-same-as-five-two': 'Which is the same?',
  'parts-see-the-parts': 'Which sentence?',
  'parts-both-of-five': 'Which parts make 5?',
  'parts-five-and-friends': 'How can you see 9?',
  'parts-ten-ones-one-ten': 'What is another name?',
  'story-compare-quantity-bus': 'How many does Ali have?',
  'story-same-sentence-different-parts': 'Both make 8?',
  'place-ten-more-thirty-six': 'What is 10 more?',
  'place-ten-less-fifty': 'What is 10 less?',
  'place-thirteen-partition': 'Which is 13?',
  'place-odd-even-socks': 'Can they all pair?',
  'place-after-twenty-nine': 'What comes after?',
  'every-sphere-rolls': 'Which one rolls?',
  'every-triangle-corners': 'How many corners?',
  'every-position-under': 'Where is the bag?',
  'every-left-of-slide': 'Who is on the left?',
  'every-morning-or-night': 'Which is night?',
  'every-day-after-wednesday': 'What day is next?',
  'every-chance-sunrise': 'Will the sun come up?',
};

export function kidAskForItem(item: {
  slug?: string;
  skill: EarlyMathSkill | string;
  kind?: EarlyMathKind | string;
  stimulus?: MathStimulus | Record<string, never> | null;
}): string {
  if (item.slug && ASK_BY_SLUG[item.slug]) return ASK_BY_SLUG[item.slug];
  const stimulus = item.stimulus;
  if (stimulus && 'type' in stimulus && stimulus.type) {
    if (stimulus.type === 'matchNumber') return `Which one is ${stimulus.target}?`;
    if (stimulus.type === 'howManyMore') return 'How many more?';
    if (stimulus.type === 'oddOneOut') return 'Which one is different?';
    if (stimulus.type === 'pattern') return 'What comes next?';
    if (stimulus.type === 'numberSentence') {
      return stimulus.result === null ? 'What is the answer?' : 'What number is missing?';
    }
    if (stimulus.type === 'numberLineHops') {
      return stimulus.blank === 'result' || !stimulus.blank
        ? 'What is the answer?'
        : 'What number is missing?';
    }
    if (stimulus.type === 'partWhole') {
      return 'What is the missing part?';
    }
    if (stimulus.type === 'clock') return 'What time is it?';
    if (stimulus.type === 'sharing') {
      return item.skill === 'leftovers' ? 'How many are left over?' : 'How many for each?';
    }
    if (stimulus.type === 'numberTrack') {
      if (stimulus.missing?.length) return 'What number is missing?';
    }
    if (stimulus.type === 'numberLine') {
      if (stimulus.missing?.length) return 'What number is missing?';
      return 'Which number?';
    }
    if (stimulus.type === 'lineup') return 'Who is third?';
    if (stimulus.type === 'balance') return 'Which is heavier?';
    if (stimulus.type === 'jugs') return 'Which holds more?';
    if (stimulus.type === 'dayStrip') return 'What day is next?';
    if (stimulus.type === 'giantNumber') return 'What number?';
    if (stimulus.type === 'tenFrame' || stimulus.type === 'dots' || stimulus.type === 'fingers' || stimulus.type === 'tally') {
      if (item.skill === 'count-on') return 'How many now?';
      if (item.skill === 'missing-part') return 'How many more to fill?';
      return 'How many?';
    }
    if (stimulus.type === 'compareBars') {
      if (item.skill === 'length-compare') return 'Which is longer?';
      if (item.skill === 'compare-difference') return 'How many more?';
      return 'Which has more?';
    }
    if (stimulus.type === 'groups') {
      if (stimulus.groups.some((group) => (group.crossed ?? 0) > 0) || item.skill === 'separate-result') {
        return 'How many left?';
      }
      if (item.skill === 'join-result') return 'How many now?';
      if (item.skill === 'conservation') return 'Still the same?';
      if (item.skill === 'cardinality') return 'Are there 5?';
      if (item.skill === 'count-one-to-one') return 'How do you count?';
      if (item.skill === 'skip-count') return 'Can they all pair?';
      if (item.skill === 'chance-language') return 'Will it happen?';
      if (item.skill === 'compare-quantity') return 'How many does the other have?';
      if (item.skill === 'ppw-whole') return 'How many altogether?';
      return 'How many altogether?';
    }
    if (stimulus.type === 'baseTen') {
      if (item.skill === 'ten-more-less') return 'What is 10 more?';
      return 'What number is this?';
    }
    if (stimulus.type === 'pictureGraph') return 'Which has the most?';
    if (stimulus.type === 'coins') return 'How many dollars?';
    if (stimulus.type === 'shapes') {
      return item.skill === 'shape-2d' ? 'Look at the shape.' : 'Which shape?';
    }
    if (stimulus.type === 'position') {
      return stimulus.place === 'slide' ? 'Who is on the left?' : 'Where is the bag?';
    }
  }
  if (item.kind === 'true_false') {
    if (item.skill === 'conservation') return 'Still the same?';
    if (item.skill === 'ten-bonds') return 'Is this 10?';
    return 'Yes or no?';
  }
  return ASK_BY_SKILL[item.skill as EarlyMathSkill] ?? 'Have a go.';
}
