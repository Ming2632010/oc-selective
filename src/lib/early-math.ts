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
  'join-change': 'How many joined?',
  'join-start': 'How many at the start?',
  'separate-result': 'How many left?',
  'separate-change': 'How many went?',
  'separate-start': 'How many before?',
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
  | { type: 'numberTrack'; min: number; max: number; missing?: number[]; highlight?: number }
  | { type: 'numberLine'; min: number; max: number; target: number }
  | { type: 'partWhole'; whole: number | null; left: number | null; right: number | null }
  | { type: 'groups'; groups: { count: number; icon: string; label: string }[] }
  | { type: 'pattern'; items: string[]; blankIndex: number }
  | { type: 'shapes'; items: { kind: string; label?: string }[] }
  | { type: 'position'; place: 'bench' | 'shelf' | 'slide'; target: string }
  | { type: 'compareBars'; a: number; b: number; aLabel: string; bLabel: string }
  | { type: 'pictureGraph'; title: string; rows: { label: string; count: number; icon: string }[] }
  | { type: 'clock'; hour: number; minute: 0 | 30 }
  | { type: 'baseTen'; tens: number; ones: number }
  | { type: 'sharing'; total: number; people: number }
  | { type: 'coins'; coins: { value: number; count: number }[] };

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
    blurb: 'Story problems with different jobs: how many now, how many joined, how many more.',
    kindyFocus: 'Join and take-away when the end is unknown.',
    year1Focus: 'Change unknown, start unknown, and compare stories.',
  },
  {
    id: 5,
    title: 'Tens and ones',
    blurb: 'See two-digit numbers as groups of ten and leftover ones.',
    kindyFocus: '11 to 20 as ten and some more.',
    year1Focus: 'Numbers to 100, skip counting, ten more and ten less.',
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
