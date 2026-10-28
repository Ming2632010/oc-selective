/**
 * Original TrialSeed Mathematical Reasoning items for Year 4–7 Selective practice.
 * Skill mix follows the computer test (35 questions, A–E, 40 minutes, no calculator).
 * Items are generated. They are not copies of NSW past papers or sample papers.
 */
import {
  EXAM_MATH_MINI_COUNT,
  EXAM_MATH_MINI_QUESTIONS,
  EXAM_MATH_PAPER_COUNT,
  EXAM_MATH_PAPER_QUESTIONS,
  EXAM_MATH_TRIAL_MINI_QUESTIONS,
  EXAM_MATH_TRIAL_MINI_SET,
  EXAM_MATH_TRIAL_WARMUP_QUESTIONS,
  EXAM_MATH_TRIAL_WARMUP_SET,
  miniDifficultyBand,
  paperDifficultyBand,
  type ExamMathDifficultyBand,
  type ExamMathSetKind,
} from './exam-math';
import type { ExamMathStimulus } from './exam-math-stimulus';

export type ExamMathSeedItem = {
  kind: ExamMathSetKind;
  setNumber: number;
  sortOrder: number;
  familyId: string;
  skill: string;
  stem: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  stimulus?: ExamMathStimulus;
};

type Rng = () => number;

type Core = {
  stem: string;
  correct: string;
  distractors: string[];
  explanation: string;
  stimulus?: ExamMathStimulus;
};

type Ctx = {
  rng: Rng;
  band: ExamMathDifficultyBand;
  name: string;
  other: string;
};

type Family = {
  id: string;
  skill: string;
  make: (ctx: Ctx) => Core;
};

const NAMES = [
  'Ava',
  'Ben',
  'Chen',
  'Diya',
  'Eli',
  'Farah',
  'Gus',
  'Hana',
  'Ira',
  'Jin',
  'Kai',
  'Lila',
  'Marco',
  'Noor',
  'Omar',
  'Priya',
  'Quinn',
  'Rafi',
  'Sana',
  'Tess',
] as const;

/** Distinctive wording from official papers — generated stems must not contain these. */
export const EXAM_MATH_SOURCE_PHRASE_BLOCKLIST = [
  'four of the numbers on the cards have the same remainder when divided by 5',
  "sandy's watch reads 1850",
  'three packages are weighed together',
  'jason has 3 different pairs of trousers',
  'amrita has a bag of 36 marbles',
  'the time in auckland is 13 hours ahead',
  'when this can of sweetcorn is half full',
  'tiffany makes a large cube out of 64 identical',
  'bob is measuring the obtuse angle',
  'sun-mi catches the second bus',
  'rachel, steve and taran',
];

export const EXAM_MATH_BANK_SIZE =
  EXAM_MATH_MINI_COUNT * EXAM_MATH_MINI_QUESTIONS +
  EXAM_MATH_PAPER_COUNT * EXAM_MATH_PAPER_QUESTIONS;

function mulberry32(seed: number): Rng {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function int(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]!;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x;
}

function lcm(a: number, b: number): number {
  return (a / gcd(a, b)) * b;
}

function bandPick(band: ExamMathDifficultyBand, foundation: number, standard: number, exam: number) {
  if (band === 'foundation') return foundation;
  if (band === 'standard') return standard;
  return exam;
}

function packOptions(
  rng: Rng,
  correct: string,
  distractors: string[],
): { options: string[]; correctIndex: number } {
  const seen = new Set<string>([correct]);
  const pool = [correct];
  for (const distractor of distractors) {
    if (!distractor || seen.has(distractor)) continue;
    seen.add(distractor);
    pool.push(distractor);
  }
  const asNumber = Number(correct.replace(/[^\d.-]/g, ''));
  let step = 1;
  while (pool.length < 5 && step < 40) {
    const extra = Number.isFinite(asNumber)
      ? correct.replace(String(asNumber), String(asNumber + (step % 2 === 0 ? step / 2 : -Math.ceil(step / 2))))
      : `${correct} alt ${step}`;
    step += 1;
    if (!extra || seen.has(extra)) continue;
    seen.add(extra);
    pool.push(extra);
  }
  const five = pool.slice(0, 5);
  for (let i = five.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [five[i], five[j]] = [five[j], five[i]];
  }
  return { options: five, correctIndex: five.indexOf(correct) };
}

function coprimeFactorPairs(n: number): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (let a = 1; a * a <= n; a += 1) {
    if (n % a !== 0) continue;
    const b = n / a;
    if (gcd(a, b) === 1) pairs.push([a, b]);
  }
  return pairs;
}

const FAMILIES: Family[] = [
  {
    id: 'remainder-odd-one',
    skill: 'number-divisibility',
    make({ rng, band, name }) {
      const divisor = pick(rng, band === 'foundation' ? [3, 4, 5] : band === 'standard' ? [6, 7, 8] : [9, 11, 12]);
      const remainder = int(rng, 1, divisor - 1);
      const oddRemainder = (remainder + int(rng, 1, divisor - 1)) % divisor || divisor - 1;
      const base = int(rng, 2, 8) * divisor + remainder;
      const numbers = [0, 1, 2, 3].map((k) => base + k * divisor);
      const odd = int(rng, 4, 9) * divisor + oddRemainder;
      numbers.splice(int(rng, 0, 4), 0, odd);
      const list = numbers.join(', ');
      return {
        stem: `${name} writes five numbers: ${list}. Four of them leave remainder ${remainder} when divided by ${divisor}. Which number is the odd one out?`,
        correct: String(odd),
        distractors: numbers.filter((n) => n !== odd).map(String),
        explanation: `${odd} ÷ ${divisor} leaves remainder ${oddRemainder}. The others all leave remainder ${remainder}.`,
      };
    },
  },
  {
    id: 'geometric-gap',
    skill: 'number-patterns',
    make({ rng, band, name }) {
      const start = bandPick(band, int(rng, 2, 5), int(rng, 2, 7), int(rng, 3, 9));
      const mult = band === 'exam' ? pick(rng, [3, 4]) : pick(rng, [2, 3]);
      const terms = [start, start * mult, start * mult ** 2, start * mult ** 3, start * mult ** 4];
      const missingAt = 2;
      const missing = terms[missingAt]!;
      const shown = terms.map((n, i) => (i === missingAt ? '?' : String(n))).join(', ');
      return {
        stem: `${name} writes a number pattern that multiplies by ${mult} each time: ${shown}. What number is missing?`,
        correct: String(missing),
        distractors: [String(start + 2 * (terms[1]! - start)), String(missing + start), String(missing * 2), String(terms[1]! * 2)],
        explanation: `Each term is ${mult} times the one before it, so the missing term is ${terms[1]} × ${mult} = ${missing}.`,
      };
    },
  },
  {
    id: 'arithmetic-gap',
    skill: 'number-patterns',
    make({ rng, band, name }) {
      const start = int(rng, 3, 20);
      const step = bandPick(band, int(rng, 3, 6), int(rng, 7, 12), int(rng, 13, 25));
      const terms = [0, 1, 2, 3, 4].map((k) => start + k * step);
      const missing = terms[2]!;
      const shown = `${terms[0]}, ${terms[1]}, ?, ${terms[3]}, ${terms[4]}`;
      return {
        stem: `${name} writes a pattern that increases by ${step} each time: ${shown}. What number is missing?`,
        correct: String(missing),
        distractors: [String(missing + 1), String(missing - step), String(terms[1]! + terms[0]!), String(step * 3)],
        explanation: `Add ${step} each time: ${terms[1]} + ${step} = ${missing}.`,
      };
    },
  },
  {
    id: 'outfit-compare',
    skill: 'combinations',
    make({ rng, name, other }) {
      const aT = int(rng, 2, 5);
      const aS = int(rng, 2, 6);
      const bT = int(rng, 2, 5);
      const bS = int(rng, 2, 6);
      const a = aT * aS;
      const b = bT * bS;
      const diff = Math.abs(a - b);
      let correct: string;
      if (a === b) correct = `${name} and ${other} have the same number of outfits`;
      else if (a > b) correct = `${name} has ${diff} more outfit${diff === 1 ? '' : 's'}`;
      else correct = `${other} has ${diff} more outfit${diff === 1 ? '' : 's'}`;
      const distractors = [
        `${name} has ${diff + 1} more outfits`,
        `${other} has ${diff + 1} more outfits`,
        `${name} and ${other} have the same number of outfits`,
        `${name} has ${aT + aS} more outfits`,
      ].filter((row) => row !== correct);
      return {
        stem: `${name} has ${aT} jackets and ${aS} shirts. ${other} has ${bT} jackets and ${bS} shirts. An outfit is one jacket and one shirt from that person’s own clothes. Who has more outfits, and by how many?`,
        correct,
        distractors,
        explanation: `${name} has ${aT} × ${aS} = ${a} outfits. ${other} has ${bT} × ${bS} = ${b}. ${correct}.`,
      };
    },
  },
  {
    id: 'volume-combine',
    skill: 'measurement-volume',
    make({ rng, band, name }) {
      const aMl = bandPick(band, int(rng, 250, 900), int(rng, 800, 1600), int(rng, 1250, 2800));
      const bMl = int(rng, 150, 900);
      const cMl = int(rng, 80, 400);
      const total = aMl + bMl + cMl;
      const litres = Math.floor(total / 1000);
      const rem = total % 1000;
      const correct = `${litres} L ${rem} mL`;
      return {
        stem: `${name} pours ${aMl} mL, ${bMl} mL and ${cMl} mL of water into one jug. What is the total volume in litres and millilitres?`,
        correct,
        distractors: [
          `${litres} L ${rem + 10} mL`,
          `${litres + 1} L ${rem} mL`,
          `${Math.floor((total - cMl) / 1000)} L ${(total - cMl) % 1000} mL`,
          `${total} L 0 mL`,
        ],
        explanation: `${aMl} + ${bMl} + ${cMl} = ${total} mL = ${correct}.`,
      };
    },
  },
  {
    id: 'decimal-middle',
    skill: 'decimals',
    make({ rng, name }) {
      const tenths = [12, 15, 18, 21, 24, 27, 32, 35, 41, 48, 56, 63, 72];
      const chosen: number[] = [];
      while (chosen.length < 5) {
        const n = pick(rng, tenths);
        if (!chosen.includes(n)) chosen.push(n);
      }
      chosen.sort((a, b) => a - b);
      const middle = chosen[2]!;
      const labels = chosen.map((n) => (n % 10 === 0 ? (n / 10).toFixed(1) : (n / 10).toFixed(2)));
      const shuffledShow = [...labels];
      for (let i = shuffledShow.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rng() * (i + 1));
        [shuffledShow[i], shuffledShow[j]] = [shuffledShow[j], shuffledShow[i]];
      }
      const correct = (middle / 10).toFixed(middle % 10 === 0 ? 1 : 2);
      return {
        stem: `${name} sorts these decimals from smallest to largest: ${shuffledShow.join(', ')}. Which number is in the middle?`,
        correct,
        distractors: labels.filter((row) => row !== correct),
        explanation: `In order they are ${labels.join(', ')}, so the middle card is ${correct}.`,
      };
    },
  },
  {
    id: 'probability-count',
    skill: 'chance',
    make({ rng, band, name }) {
      const total = band === 'foundation' ? 20 : band === 'standard' ? 36 : 48;
      const blue = int(rng, 6, Math.floor(total / 2) - 2);
      const redDenom = pick(rng, [3, 4, 6]);
      const red = total / redDenom;
      if (!Number.isInteger(red) || blue + red >= total) {
        const redFixed = Math.floor(total / 4);
        const yellow = total - blue - redFixed;
        return {
          stem: `${name} has a bag of ${total} counters. ${blue} are blue. If one counter is taken at random, the probability it is red is ${redFixed}/${total}. How many yellow counters are in the bag?`,
          correct: String(yellow),
          distractors: [String(redFixed), String(blue), String(total - blue), String(yellow + 2)],
          explanation: `Red counters: ${redFixed}. Yellow = ${total} − ${blue} − ${redFixed} = ${yellow}.`,
        };
      }
      const yellow = total - blue - red;
      return {
        stem: `${name} has a bag of ${total} counters. ${blue} are blue. If one counter is taken at random, the probability it is red is 1/${redDenom}. How many yellow counters are in the bag?`,
        correct: String(yellow),
        distractors: [String(red), String(blue), String(total - blue), String(yellow + redDenom)],
        explanation: `Red counters: ${total} × 1/${redDenom} = ${red}. Yellow = ${total} − ${blue} − ${red} = ${yellow}.`,
      };
    },
  },
  {
    id: 'largest-fraction',
    skill: 'fractions',
    make({ rng, name }) {
      const candidates = [
        [1, 2],
        [2, 3],
        [3, 4],
        [3, 5],
        [4, 5],
        [5, 6],
        [5, 8],
        [7, 10],
        [2, 5],
        [3, 8],
      ];
      const picked: Array<[number, number]> = [];
      while (picked.length < 5) {
        const next = pick(rng, candidates) as [number, number];
        if (picked.some(([a, b]) => a === next[0] && b === next[1])) continue;
        picked.push(next);
      }
      const labels = picked.map(([a, b]) => `${a}/${b}`);
      const best = picked.reduce((win, cur) => (cur[0] / cur[1] > win[0] / win[1] ? cur : win));
      const correct = `${best[0]}/${best[1]}`;
      return {
        stem: `${name} compares these fractions: ${labels.join(', ')}. Which is the largest?`,
        correct,
        distractors: labels.filter((row) => row !== correct),
        explanation: `${correct} is the largest of ${labels.join(', ')}.`,
      };
    },
  },
  {
    id: 'square-cut-perimeter',
    skill: 'measurement-perimeter',
    make({ rng, band, name }) {
      const side = band === 'foundation' ? pick(rng, [6, 8, 10]) : band === 'standard' ? pick(rng, [12, 14, 16]) : pick(rng, [18, 20, 24]);
      const perimeter = 4 * side;
      const smallSide = side / 2;
      const smallPerimeter = 4 * smallSide;
      return {
        stem: `${name} cuts a square of perimeter ${perimeter} cm into four identical smaller squares. What is the perimeter of one of the smaller squares?`,
        correct: `${smallPerimeter} cm`,
        distractors: [`${side} cm`, `${2 * smallSide} cm`, `${perimeter / 4} cm`, `${3 * smallSide} cm`],
        explanation: `The large side is ${perimeter} ÷ 4 = ${side} cm. Each small square has side ${smallSide} cm, so its perimeter is ${smallPerimeter} cm.`,
        stimulus: { type: 'square-cut', side, unit: 'cm' },
      };
    },
  },
  {
    id: 'plants-fill-boxes',
    skill: 'multiplicative-thinking',
    make({ rng, band, name }) {
      const perBox = band === 'exam' ? pick(rng, [8, 9, 12]) : pick(rng, [5, 6, 8]);
      const boxes = bandPick(band, int(rng, 10, 16), int(rng, 18, 28), int(rng, 30, 42));
      const extra = int(rng, 1, perBox - 1);
      const have = boxes * perBox - extra;
      return {
        stem: `${name} is packing seedlings. Each tray holds ${perBox} plants. There are already ${have} plants. How many more plants are needed to fill ${boxes} trays?`,
        correct: String(extra),
        distractors: [String(perBox - extra), String(boxes - extra), String(extra + perBox), String(have % perBox || perBox)],
        explanation: `${boxes} trays need ${boxes * perBox} plants. ${boxes * perBox} − ${have} = ${extra}.`,
      };
    },
  },
  {
    id: 'time-later-12h',
    skill: 'time',
    make({ rng, name }) {
      const hour24 = int(rng, 13, 22);
      const minute = pick(rng, [5, 10, 20, 35, 40, 50]);
      const add = pick(rng, [15, 20, 25, 30]);
      const totalMin = hour24 * 60 + minute + add;
      const outH24 = Math.floor(totalMin / 60) % 24;
      const outM = totalMin % 60;
      const h12 = outH24 % 12 === 0 ? 12 : outH24 % 12;
      const suffix = outH24 >= 12 ? 'pm' : 'am';
      const pad = String(outM).padStart(2, '0');
      const correct = `${h12}:${pad} ${suffix}`;
      const startPad = String(minute).padStart(2, '0');
      const wrongSuffix = suffix === 'pm' ? 'am' : 'pm';
      return {
        stem: `${name}’s digital clock shows ${hour24}${startPad}. What time is it ${add} minutes later, in 12-hour time?`,
        correct,
        distractors: [
          `${h12}:${pad} ${wrongSuffix}`,
          `${h12}:${String((outM + 10) % 60).padStart(2, '0')} ${suffix}`,
          `${hour24 % 12 || 12}:${startPad} ${hour24 >= 12 ? 'pm' : 'am'}`,
          `${h12}:${pad}`,
        ],
        explanation: `${hour24}:${startPad} plus ${add} minutes is ${String(outH24).padStart(2, '0')}:${pad}, which is ${correct}.`,
      };
    },
  },
  {
    id: 'seconds-in-days',
    skill: 'time-units',
    make({ rng, name }) {
      const days = int(rng, 2, 16);
      const correct = `${days} × 24 × 60 × 60`;
      return {
        stem: `${name}’s school camp lasts ${days} days. Which calculation gives the number of seconds in those ${days} days?`,
        correct,
        distractors: [
          `${days} × 24 × 60`,
          `${days} × 60 × 60`,
          `${days} × 24 × 24 × 60`,
          `${days} × 24 × 60 × 60 × 60`,
        ],
        explanation: `${days} days × 24 hours × 60 minutes × 60 seconds.`,
      };
    },
  },
  {
    id: 'place-value-product',
    skill: 'place-value',
    make({ rng, band, name }) {
      const pair =
        band === 'foundation'
          ? pick(rng, [
              [2, 2],
              [3, 2],
            ])
          : band === 'standard'
            ? pick(rng, [
                [3, 2],
                [4, 2],
                [3, 3],
              ])
            : pick(rng, [
                [4, 2],
                [4, 3],
                [3, 3],
              ]);
      const largeDigits = pair[0]!;
      const smallDigits = pair[1]!;
      const small = 10 ** smallDigits - 1;
      const largeMin = 10 ** (largeDigits - 1);
      const product = largeMin * small;
      return {
        stem: `${name} multiplies the smallest ${largeDigits}-digit whole number by the largest ${smallDigits}-digit whole number ${pick(rng, ['without a calculator', 'in one sitting', 'as a whole number'])}. What is the answer?`,
        correct: String(product),
        distractors: [
          String(largeMin * (small + 1)),
          String((10 ** largeDigits - 1) * small),
          String(largeMin * 10 ** smallDigits),
          String(product / 10),
        ],
        explanation: `Smallest ${largeDigits}-digit is ${largeMin}. Largest ${smallDigits}-digit is ${small}. ${largeMin} × ${small} = ${product}.`,
      };
    },
  },
  {
    id: 'inequality-sum',
    skill: 'number-reasoning',
    make({ rng, name }) {
      const lessThan = pick(rng, [24, 27, 33, 36]);
      const greaterThan = pick(rng, [28, 32, 35, 44]);
      const values: number[] = [];
      for (let n = 1; n <= 25; n += 1) {
        if (3 * n < lessThan && 6 * n > greaterThan) values.push(n);
      }
      if (values.length < 2) {
        const fallback = [8, 9, 10];
        const sum = 27;
        return {
          stem: `${name} thinks of a whole number. 3 times the number is less than 33. 6 times the number is greater than 44. What is the sum of all possible numbers?`,
          correct: String(sum),
          distractors: ['8', '10', '18', '3'],
          explanation: `Possible numbers: ${fallback.join(', ')}. Sum = ${sum}.`,
        };
      }
      const sum = values.reduce((a, b) => a + b, 0);
      return {
        stem: `${name} thinks of a whole number. 3 times the number is less than ${lessThan}. 6 times the number is greater than ${greaterThan}. What is the sum of all possible numbers?`,
        correct: String(sum),
        distractors: [String(values[0]!), String(values.at(-1)!), String(sum + values[0]!), String(values.length)],
        explanation: `The possible numbers are ${values.join(', ')}. Their sum is ${sum}.`,
      };
    },
  },
  {
    id: 'lcm-laps',
    skill: 'multiples',
    make({ rng, name, other }) {
      const a = pick(rng, [6, 8, 9, 10]);
      const b = pick(rng, [8, 10, 12, 15].filter((n) => n !== a));
      const c = pick(rng, [9, 12, 14, 16].filter((n) => n !== a && n !== b));
      const answer = lcm(lcm(a, b), c);
      return {
        stem: `${name} jogs a circuit every ${a} minutes. ${other} jogs it every ${b} minutes. A third runner does it every ${c} minutes. They start together. After how many minutes are all three next at the start together?`,
        correct: String(answer),
        distractors: [String(a * b), String(a + b + c), String(lcm(a, b)), String(answer * 2)],
        explanation: `Find the lowest common multiple of ${a}, ${b} and ${c}, which is ${answer}.`,
      };
    },
  },
  {
    id: 'hidden-cubes',
    skill: 'spatial',
    make({ rng, band, name }) {
      const n = bandPick(band, 3, 4, pick(rng, [5, 6]));
      const hidden = (n - 2) ** 3;
      const total = n ** 3;
      return {
        stem: `${name} builds a large cube from ${total} identical small cubes, packed ${n} × ${n} × ${n}. How many small cubes cannot be seen from the outside?`,
        correct: String(hidden),
        distractors: [String(n ** 2), String((n - 1) ** 3), String(total - n ** 2), String(6 * (n - 2) ** 2)],
        explanation: `The hidden cube is ${(n - 2)} × ${(n - 2)} × ${(n - 2)} = ${hidden}.`,
        stimulus: { type: 'cube', n },
      };
    },
  },
  {
    id: 'clock-angle',
    skill: 'angles',
    make({ rng, name }) {
      const hour = int(rng, 1, 10);
      const minute = pick(rng, [0, 15, 30, 45]);
      const minuteAngle = 6 * minute;
      const hourAngle = 30 * hour + 0.5 * minute;
      const clockwise = (minuteAngle - hourAngle + 360) % 360;
      const hLabel = hour;
      const mLabel = String(minute).padStart(2, '0');
      return {
        stem: `${name} looks at a classroom clock at ${hLabel}:${mLabel}. What is the angle measured clockwise from the hour hand to the minute hand?`,
        correct: `${clockwise}°`,
        distractors: [`${(360 - clockwise) % 360}°`, `${Math.abs(hourAngle - minuteAngle)}°`, `${30 * hour}°`, `${minuteAngle}°`],
        explanation: `The minute hand is at ${minuteAngle}° and the hour hand is at ${hourAngle}°. Clockwise from the hour hand is ${clockwise}°.`,
        stimulus: { type: 'clock', hour, minute },
      };
    },
  },
  {
    id: 'hcf-lcm-pair',
    skill: 'factors',
    make({ rng, name }) {
      const h = pick(rng, [2, 3, 4, 5, 6, 8]);
      const k = pick(rng, [8, 9, 10, 14, 15, 21, 22, 26]);
      const pairs = coprimeFactorPairs(k);
      if (pairs.length < 2) {
        const x = 6 * 2;
        const y = 6 * 5;
        return {
          stem: `${name} finds two different pairs of whole numbers that both have highest common factor 6 and lowest common multiple 60. One pair is 6 and 60. What is the sum of the other pair?`,
          correct: String(x + y),
          distractors: ['66', '36', '18', '72'],
          explanation: `60 ÷ 6 = 10. Another coprime factor pair of 10 is 2 and 5, so the numbers are 12 and 30. Sum = 42.`,
        };
      }
      const second = pairs[1]!;
      const x = h * second[0];
      const y = h * second[1];
      const L = h * k;
      return {
        stem: `${name} finds two different pairs of whole numbers that both have highest common factor ${h} and lowest common multiple ${L}. One pair is ${h} and ${L}. What is the sum of the other pair?`,
        correct: String(x + y),
        distractors: [String(h + L), String(x), String(y), String(h * (second[0] + second[1] + 1))],
        explanation: `${L} ÷ ${h} = ${k}. Another coprime factor pair of ${k} is ${second[0]} and ${second[1]}, so the numbers are ${x} and ${y}. Sum = ${x + y}.`,
      };
    },
  },
  {
    id: 'half-as-many',
    skill: 'multi-step-number',
    make({ rng, name }) {
      const thursday = pick(rng, [40, 50, 60, 80, 90]);
      const monday = pick(rng, [160, 180, 200, 240, 280]);
      const tuesday = monday / 2;
      const wednesday = tuesday / 2;
      if (!Number.isInteger(tuesday) || !Number.isInteger(wednesday)) {
        const m = 240;
        const total = m + m / 2 + m / 4 + 80;
        return {
          stem: `${name} counts pool tickets sold from Monday to Thursday, ${total} in total. Tuesday was half of Monday. Wednesday was half of Tuesday. Thursday was 80. How many tickets were sold on Monday?`,
          correct: '240',
          distractors: ['120', '160', '200', '320'],
          explanation: `Let Monday be m. Then m + m/2 + m/4 + 80 = ${total}, so 1.75m = ${total - 80}, m = 240.`,
        };
      }
      const total = monday + tuesday + wednesday + thursday;
      return {
        stem: `${name} counts cinema tickets sold from Monday to Thursday, ${total} in total. Tuesday’s sales were half of Monday’s. Wednesday’s sales were half of Tuesday’s. Thursday was ${thursday}. How many were sold on Monday?`,
        correct: String(monday),
        distractors: [String(tuesday), String(wednesday), String(monday + thursday), String(Math.floor(total / 2))],
        explanation: `Monday + half of Monday + a quarter of Monday + ${thursday} = ${total}, so Monday is ${monday}.`,
      };
    },
  },
  {
    id: 'closest-decimal',
    skill: 'decimals',
    make({ rng, name }) {
      const targetTenths = int(rng, 6, 23);
      const target = targetTenths / 10;
      const optionsNum = [
        target - 0.08,
        target - 0.03,
        target + 0.02,
        target + 0.07,
        target - 0.15,
      ].map((n) => Math.round(n * 1000) / 1000);
      const best = optionsNum.reduce((win, n) =>
        Math.abs(n - target) < Math.abs(win - target) ? n : win,
      );
      const fmt = (n: number) => n.toString();
      return {
        stem: `${name} wants the number closest to ${target}. Which of these is closest?`,
        correct: fmt(best),
        distractors: optionsNum.filter((n) => n !== best).map(fmt),
        explanation: `${fmt(best)} is ${Math.abs(best - target)} away from ${target}, which is the smallest gap.`,
      };
    },
  },
  {
    id: 'line-distance',
    skill: 'measurement-length',
    make({ rng, name, other }) {
      const ac = pick(rng, [240, 280, 320, 360]);
      const ce = pick(rng, [300, 360, 420, 480]);
      const bc = ac / 4;
      const ab = 3 * bc;
      const de = ce - bc;
      const ae = ac + ce;
      const mid = pick(rng, ['Nia', 'Pia', 'Rio']);
      const far = pick(rng, ['Skye', 'Uma', 'Wes']);
      return {
        stem: `Five houses sit on a straight path in this order: ${name}, ${other}, ${mid}, Joss, ${far}. ${name} lives ${ac} m from ${mid} and ${ae} m from ${far}. ${other} lives three times as far from ${name} as from ${mid}. Joss and ${other} live equal distances from ${mid}. How far does Joss live from ${far}?`,
        correct: `${de} m`,
        distractors: [`${bc} m`, `${ce} m`, `${ab} m`, `${ae - ab} m`],
        explanation: `${other} is ${ab} m from ${name} and ${bc} m from ${mid}. Joss is ${bc} m beyond ${mid}, so Joss to ${far} is ${de} m.`,
      };
    },
  },
  {
    id: 'linear-can',
    skill: 'linear-relationships',
    make({ rng, name }) {
      const full = pick(rng, [160, 200, 220, 240, 280]);
      const can = pick(rng, [20, 30, 40, 50]);
      const half = can + full / 2;
      const quarter = can + full / 4;
      const three = can + (3 * full) / 4;
      return {
        stem: `When ${name}’s tin of beans is half full, tin and beans together weigh ${half} g. When it is one-quarter full, they weigh ${quarter} g. What is the mass of tin and beans together when the tin is three-quarters full?`,
        correct: `${three} g`,
        distractors: [`${half + quarter} g`, `${can + full} g`, `${three - can} g`, `${three + can} g`],
        explanation: `Half minus quarter of the beans is ${half - quarter} g, so a full tin of beans is ${full} g and the tin itself is ${can} g. Three-quarters full is ${three} g.`,
      };
    },
  },
  {
    id: 'unit-chain',
    skill: 'measurement-units',
    make({ rng, name }) {
      const gillToPint = pick(rng, [3, 4, 5, 6]);
      const pintToQuart = 2;
      const quartToPeck = pick(rng, [5, 6, 7, 8, 9, 10]);
      const gills = gillToPint * pintToQuart * quartToPeck;
      return {
        stem: `${name} reads an old set of measures: ${gillToPint} nips equal 1 cup, 1 cup equals half a jug, and ${quartToPeck} jugs equal 1 crock. How many nips equal 1 crock?`,
        correct: String(gills),
        distractors: [
          String(gillToPint + pintToQuart + quartToPeck),
          String(gillToPint * quartToPeck),
          String(gills / 2),
          String(gills * 2),
        ],
        explanation: `${gillToPint} × 2 × ${quartToPeck} = ${gills} nips in a crock.`,
      };
    },
  },
  {
    id: 'division-sentence',
    skill: 'division',
    make({ rng, name }) {
      const divisor = int(rng, 6, 14);
      const quotient = int(rng, 5, 12);
      const remainder = int(rng, 1, divisor - 1);
      const total = divisor * quotient + remainder;
      const correct = `${divisor} × ${quotient} + ${remainder} = ${total}`;
      return {
        stem: `When ${name} shares ${total} grapes between ${divisor} people, each person gets ${quotient} grapes and ${remainder} are left over. Which number sentence shows this?`,
        correct,
        distractors: [
          `${divisor} × ${quotient} − ${remainder} = ${total}`,
          `${divisor} × ${remainder} + ${quotient} = ${total}`,
          `${divisor} + ${quotient} × ${remainder} = ${total}`,
          `${divisor} × ${quotient} + ${divisor} = ${total}`,
        ],
        explanation: `${divisor} groups of ${quotient}, then add the leftover ${remainder}: ${correct}.`,
      };
    },
  },
  {
    id: 'equal-area-rect',
    skill: 'measurement-area',
    make({ rng, name }) {
      const a = int(rng, 4, 9);
      const b = int(rng, 6, 12);
      const c = int(rng, 3, 8);
      if (c === 0 || (a * b) % c !== 0) {
        const length = (8 * 6) / 4;
        return {
          stem: `${name} draws rectangle P, 8 cm by 6 cm. Rectangle Q has the same area and one side 4 cm. What is the other side of Q?`,
          correct: `${length} cm`,
          distractors: ['10 cm', '12 cm', '16 cm', '24 cm'],
          explanation: `Area is 48 cm², so the missing side is 48 ÷ 4 = 12 cm.`,
          stimulus: { type: 'rect-pair', aW: 8, aH: 6, bW: 4, unit: 'cm' },
        };
      }
      const length = (a * b) / c;
      return {
        stem: `${name} draws rectangle P, ${a} cm by ${b} cm. Rectangle Q has the same area and one side ${c} cm. What is the other side of Q?`,
        correct: `${length} cm`,
        distractors: [`${a + b - c} cm`, `${a * b} cm`, `${(a * b) / 2} cm`, `${c * 2} cm`],
        explanation: `Area = ${a * b} cm², so the missing side is ${a * b} ÷ ${c} = ${length} cm.`,
        stimulus: { type: 'rect-pair', aW: a, aH: b, bW: c, unit: 'cm' },
      };
    },
  },
  {
    id: 'money-half-chain',
    skill: 'money',
    make({ rng, name, other }) {
      const start = pick(rng, [10, 12, 16, 20]);
      const lenny = pick(rng, [1.2, 1.5, 1.6, 2]);
      // start - kiana, then half of rest to jason, jason gives half to lenny so lenny = (start-kiana)/4
      const kiana = start - 4 * lenny;
      if (kiana <= 0 || Math.round(kiana * 10) !== kiana * 10) {
        return {
          stem: `${name} had $12. Some went to ${other}. Half of what was left went to Jules. Jules gave half of that to Lenny, who received $1.50. How much did ${name} give ${other}?`,
          correct: '$6.00',
          distractors: ['$3.00', '$4.50', '$7.50', '$1.50'],
          explanation: `Lenny received a quarter of what was left after ${other}. $1.50 × 4 = $6.00 left, so ${other} received $12 − $6.00 = $6.00.`,
        };
      }
      const dollars = (n: number) => `$${n.toFixed(2)}`;
      return {
        stem: `${name} had $${start}. Some went to ${other}. Half of what was left went to Jules. Jules gave half of that to Lenny, who received ${dollars(lenny)}. How much did ${name} give ${other}?`,
        correct: dollars(kiana),
        distractors: [dollars(lenny * 2), dollars(lenny * 4), dollars(start - lenny), dollars(kiana + 1)],
        explanation: `Lenny received a quarter of the money left after ${other}, so that leftover was ${dollars(4 * lenny)}. ${other} received ${dollars(kiana)}.`,
      };
    },
  },
  {
    id: 'ratio-share',
    skill: 'ratio',
    make({ rng, name, other }) {
      const a = int(rng, 2, 5);
      const b = int(rng, 3, 7);
      const extra = pick(rng, [2, 3, 4]);
      const totalParts = a + b;
      const total = totalParts * pick(rng, [6, 8, 12, 15]);
      const more = Math.abs((a * total) / totalParts - (b * total) / totalParts);
      void extra;
      return {
        stem: `${name} and ${other} share ${total} stamps in the ratio ${a} : ${b}. How many more stamps does the person with the larger share get?`,
        correct: String(more),
        distractors: [String(total / totalParts), String(a * b), String(total - more), String(Math.max(a, b) * (total / totalParts))],
        explanation: `Each part is ${total / totalParts}. The difference is |${a} − ${b}| parts = ${more}.`,
      };
    },
  },
  {
    id: 'percent-of',
    skill: 'percentages',
    make({ rng, name }) {
      const percent = pick(rng, [10, 15, 20, 25, 40]);
      const of = pick(rng, [40, 60, 80, 120, 200]);
      const answer = (percent / 100) * of;
      return {
        stem: `${name} scores ${percent}% in a quiz out of ${of} marks. How many marks is that?`,
        correct: String(answer),
        distractors: [String(percent), String(of - answer), String(answer * 2), String(of * percent)],
        explanation: `${percent}% of ${of} is ${answer}.`,
      };
    },
  },
  {
    id: 'mean-missing',
    skill: 'data',
    make({ rng, name }) {
      const n = pick(rng, [4, 5, 6]);
      const mean = int(rng, 8, 16);
      const known = Array.from({ length: n - 1 }, () => int(rng, 4, 20));
      const missing = mean * n - known.reduce((a, b) => a + b, 0);
      if (missing <= 0 || missing > 40) {
        const ks = [6, 8, 10, 12];
        const m = 14;
        const miss = m * 5 - ks.reduce((a, b) => a + b, 0);
        return {
          stem: `${name}’s five scores have a mean of 14. Four scores in the table add to 36. What is the missing score?`,
          correct: String(miss),
          distractors: ['14', '16', '18', '10'],
          explanation: `Five scores sum to 70. 70 − 36 = 34.`,
          stimulus: {
            type: 'table',
            caption: `${name}’s scores`,
            headers: ['Test', 'Score'],
            rows: [
              ['1', '6'],
              ['2', '8'],
              ['3', '10'],
              ['4', '12'],
              ['5', '?'],
            ],
          },
        };
      }
      return {
        stem: `${name} has ${n} test scores with a mean of ${mean}. The table shows ${n - 1} scores that add to ${known.reduce((a, b) => a + b, 0)}. What is the missing score?`,
        correct: String(missing),
        distractors: [String(mean), String(known[0]!), String(missing + n), String(Math.abs(missing - mean))],
        explanation: `The ${n} scores sum to ${mean * n}. Subtract ${known.reduce((a, b) => a + b, 0)} to get ${missing}.`,
        stimulus: {
          type: 'table',
          caption: `${name}’s scores`,
          headers: ['Test', 'Score'],
          rows: [
            ...known.map((score, index) => [String(index + 1), String(score)]),
            [String(n), '?'],
          ],
        },
      };
    },
  },
  {
    id: 'order-of-operations',
    skill: 'operations',
    make({ rng, name }) {
      const a = int(rng, 3, 9);
      const b = int(rng, 2, 6);
      const c = int(rng, 2, 8);
      const correct = a + b * c;
      return {
        stem: `${name} works out ${a} + ${b} × ${c} without a calculator. What is the value?`,
        correct: String(correct),
        distractors: [String((a + b) * c), String(a * b + c), String(a + b + c), String(a * b * c)],
        explanation: `Multiply first: ${b} × ${c} = ${b * c}, then add ${a} to get ${correct}.`,
      };
    },
  },
  {
    id: 'two-step-change',
    skill: 'word-problems',
    make({ rng, band, name, other }) {
      const start = bandPick(
        band,
        int(rng, 18, 30),
        int(rng, 32, 48),
        int(rng, 50, 80),
      );
      const gave = int(rng, 4, 10);
      const then = int(rng, 3, 9);
      const left = start - gave + then;
      return {
        stem: `${name} had ${start} cards, gave ${gave} to ${other}, then bought ${then} more. How many cards does ${name} have now?`,
        correct: String(left),
        distractors: [String(start - gave), String(start + then), String(start - then), String(left + gave)],
        explanation: `${start} − ${gave} + ${then} = ${left}.`,
      };
    },
  },
  {
    id: 'grid-next',
    skill: 'coordinates',
    make({ rng, name }) {
      const startCol = int(rng, 1, 5);
      const startRow = int(rng, 1, 5);
      const n = pick(rng, [4, 5, 6, 7, 8]);
      const col = startCol + (n - 1);
      const row = startRow + (n - 1);
      const letter = String.fromCharCode(64 + startCol);
      const endLetter = String.fromCharCode(64 + col);
      return {
        stem: `${name} numbers boxes on a grid. Box 1 is at ${letter}${startRow}. Each next box moves one column right and one row up. What is the grid reference of box ${n}?`,
        correct: `${endLetter}${row}`,
        distractors: [`${letter}${row}`, `${endLetter}${startRow}`, `${endLetter}${n}`, `${letter}${n}`],
        explanation: `After ${n - 1} steps the column is ${endLetter} and the row is ${row}.`,
        stimulus: { type: 'coord-grid', startCol, startRow, steps: n },
      };
    },
  },
  {
    id: 'speed-time',
    skill: 'rates',
    make({ rng, name }) {
      const speed = pick(rng, [40, 50, 60, 80]);
      const hours = pick(rng, [2, 3, 4]);
      const distance = speed * hours;
      return {
        stem: `${name} rides at ${speed} km/h for ${hours} hours without stopping. How far does ${name} travel?`,
        correct: `${distance} km`,
        distractors: [`${speed + hours} km`, `${distance / 2} km`, `${speed * (hours + 1)} km`, `${hours * 10} km`],
        explanation: `${speed} × ${hours} = ${distance} km.`,
      };
    },
  },
  {
    id: 'straight-angle',
    skill: 'angles',
    make({ rng, name }) {
      const a = pick(rng, [25, 32, 35, 42, 48, 55, 63, 70, 75, 88, 110, 125, 132, 147]);
      const b = 180 - a;
      return {
        stem: `${name} splits a straight line into two angles. One angle is ${a}°. What is the other angle?`,
        correct: `${b}°`,
        distractors: [`${a}°`, `${90 - (a % 90)}°`, `${180 + a}°`, `${360 - a}°`],
        explanation: `Angles on a straight line add to 180°, so 180 − ${a} = ${b}.`,
        stimulus: { type: 'straight-angle', given: a },
      };
    },
  },
  {
    id: 'fraction-of-quantity',
    skill: 'fractions',
    make({ rng, name }) {
      const denom = pick(rng, [3, 4, 5, 8]);
      const num = int(rng, 1, denom - 1);
      const whole = denom * pick(rng, [6, 8, 10, 12]);
      const answer = (num * whole) / denom;
      return {
        stem: `${name} uses ${num}/${denom} of a ${whole} g block of chocolate. How many grams is that?`,
        correct: `${answer} g`,
        distractors: [`${whole / denom} g`, `${whole - answer} g`, `${num * denom} g`, `${whole / num} g`],
        explanation: `${whole} ÷ ${denom} = ${whole / denom}, then × ${num} = ${answer} g.`,
      };
    },
  },
  {
    id: 'compound-area',
    skill: 'measurement-area',
    make({ rng, name }) {
      const L = pick(rng, [10, 12, 14, 16]);
      const W = pick(rng, [6, 8, 9]);
      const l = pick(rng, [3, 4, 5]);
      const w = pick(rng, [2, 3]);
      const area = L * W - l * w;
      return {
        stem: `${name} cuts a ${l} cm by ${w} cm rectangle from the corner of a ${L} cm by ${W} cm rectangle. What is the area of the remaining shape?`,
        correct: `${area} cm²`,
        distractors: [`${L * W} cm²`, `${l * w} cm²`, `${2 * (L + W)} cm²`, `${area + l} cm²`],
        explanation: `${L} × ${W} = ${L * W}, minus ${l} × ${w} = ${l * w}, leaving ${area} cm².`,
        stimulus: { type: 'compound-rect', outerW: L, outerH: W, cutW: l, cutH: w, unit: 'cm' },
      };
    },
  },
  {
    id: 'consecutive-sum',
    skill: 'algebra-thinking',
    make({ rng, name }) {
      const n = int(rng, 8, 30);
      const count = pick(rng, [3, 4, 5]);
      const sum = Array.from({ length: count }, (_, i) => n + i).reduce((a, b) => a + b, 0);
      return {
        stem: `${name} adds ${count} consecutive whole numbers and gets ${sum}. What is the smallest of those numbers?`,
        correct: String(n),
        distractors: [String(n + 1), String(sum / count), String(n - 1), String(count)],
        explanation: `The ${count} numbers are ${n} to ${n + count - 1}. Their sum is ${sum}.`,
      };
    },
  },
  {
    id: 'scale-leftover',
    skill: 'measurement-mass',
    make({ rng, name }) {
      const totalKgTenths = pick(rng, [20, 25, 30, 35, 40]); // 2.0–4.0 kg
      const totalG = totalKgTenths * 100;
      const a = pick(rng, [225, 350, 480, 850, 900]);
      const b = pick(rng, [125, 200, 275, 400]);
      const c = totalG - a - b;
      if (c <= 0) {
        return {
          stem: `Three parcels weigh 2.5 kg together. Parcel 1 is 700 g and parcel 2 is 275 g. What is the mass of parcel 3?`,
          correct: '1525 g',
          distractors: ['975 g', '1225 g', '1775 g', '2500 g'],
          explanation: `2.5 kg = 2500 g. 2500 − 700 − 275 = 1525 g.`,
          stimulus: { type: 'scale', max: 5, value: 2.5, unit: 'kg' },
        };
      }
      return {
        stem: `${name} weighs three parcels together. The scale shows ${totalKgTenths / 10} kg. Parcel 1 is ${a} g and parcel 2 is ${b} g. What is the mass of parcel 3?`,
        correct: `${c} g`,
        distractors: [`${a + b} g`, `${totalG - a} g`, `${c + 100} g`, `${totalG} g`],
        explanation: `${totalKgTenths / 10} kg = ${totalG} g. ${totalG} − ${a} − ${b} = ${c} g.`,
        stimulus: { type: 'scale', max: 5, value: totalKgTenths / 10, unit: 'kg' },
      };
    },
  },
  {
    id: 'even-remainders',
    skill: 'number-divisibility',
    make({ rng, name }) {
      const divisor = pick(rng, [6, 8, 10, 12]);
      const remainders = [];
      for (let r = 0; r < divisor; r += 2) remainders.push(r);
      const correct = remainders.join(', ');
      return {
        stem: `${name} divides even whole numbers by ${divisor}. What are all of the possible remainders?`,
        correct,
        distractors: [
          remainders.filter((r) => r !== 0).join(', ') || '2',
          Array.from({ length: divisor - 1 }, (_, i) => i + 1).join(', '),
          remainders.slice(0, 2).join(', '),
          String(divisor - 1),
        ],
        explanation: `Even numbers are 0, 2, 4, … modulo ${divisor}, so the remainders are ${correct}.`,
      };
    },
  },
  {
    id: 'elapsed-timetable',
    skill: 'time',
    make({ rng, name }) {
      const depH = pick(rng, [8, 9, 10, 13]);
      const depM = pick(rng, [5, 15, 20, 40, 55]);
      const trip = pick(rng, [50, 65, 70, 85]);
      const wait = pick(rng, [20, 35, 40, 55]);
      const returnTrip = pick(rng, [50, 60, 75]);
      const depTotal = depH * 60 + depM;
      const arrive = depTotal + trip;
      const retDep = arrive + wait;
      const retArr = retDep + returnTrip;
      const away = retArr - depTotal;
      const hours = Math.floor(away / 60);
      const mins = away % 60;
      const span = (h: number, m: number) =>
        `${h} hour${h === 1 ? '' : 's'} ${m} minute${m === 1 ? '' : 's'}`;
      const correct = span(hours, mins);
      const pad = (n: number) => String(n).padStart(2, '0');
      return {
        stem: `The timetable shows ${name}’s trip, leaving at ${pad(depH)}:${pad(depM)}. How long is ${name} away from town?`,
        correct,
        distractors: [
          span(hours, mins + 10),
          `${trip + returnTrip} minutes`,
          span(Math.max(0, hours - 1), mins),
          span(hours, wait),
        ],
        explanation: `${trip} + ${wait} + ${returnTrip} = ${away} minutes = ${correct}.`,
        stimulus: {
          type: 'table',
          caption: `${name}’s trip`,
          headers: ['Stage', 'Minutes'],
          rows: [
            [`Leaves town at ${pad(depH)}:${pad(depM)}`, '—'],
            ['Trip there', String(trip)],
            ['Wait', String(wait)],
            ['Return trip', String(returnTrip)],
          ],
        },
      };
    },
  },
  {
    id: 'bar-graph',
    skill: 'data-display',
    make({ rng, name }) {
      const labels = pick(rng, [
        ['Chess', 'Drama', 'Choir', 'Robotics'],
        ['Red', 'Blue', 'Green', 'Gold'],
        ['Mon', 'Tue', 'Wed', 'Thu'],
      ]);
      const values = labels.map(() => int(rng, 4, 18));
      const i = int(rng, 0, 3);
      let j = int(rng, 0, 3);
      if (j === i) j = (i + 1) % 4;
      const diff = Math.abs(values[i]! - values[j]!);
      const more = values[i]! >= values[j]! ? labels[i] : labels[j];
      const less = more === labels[i] ? labels[j] : labels[i];
      return {
        stem: `The bar graph shows the clubs ${name} counted. How many more students chose ${more} than ${less}?`,
        correct: String(diff),
        distractors: [
          String(values[i]),
          String(values[j]),
          String(values.reduce((a, b) => a + b, 0)),
          String(Math.max(...values)),
        ],
        explanation: `${more} has ${Math.max(values[i]!, values[j]!)} and ${less} has ${Math.min(values[i]!, values[j]!)}, so the difference is ${diff}.`,
        stimulus: {
          type: 'bar',
          caption: `${name}’s club counts`,
          bars: labels.map((label, index) => ({ label, value: values[index]! })),
        },
      };
    },
  },
  {
    id: 'pie-chart',
    skill: 'data-display',
    make({ rng, name }) {
      const slices = [
        { label: 'Bus', value: pick(rng, [8, 10, 12]) },
        { label: 'Walk', value: pick(rng, [6, 8, 9]) },
        { label: 'Bike', value: pick(rng, [4, 5, 6]) },
        { label: 'Car', value: pick(rng, [2, 3, 4]) },
      ];
      const total = slices.reduce((sum, slice) => sum + slice.value, 0);
      const bus = slices[0]!.value;
      return {
        stem: `The pie chart shows how ${name}’s class of ${total} students travel to school. How many students travel by bus?`,
        correct: String(bus),
        distractors: [String(total - bus), String(slices[1]!.value), String(total), String(Math.round((bus / total) * 100))],
        explanation: `The Bus slice is ${bus} of the ${total} students.`,
        stimulus: {
          type: 'pie',
          caption: `How ${name}’s class travels`,
          slices,
        },
      };
    },
  },
  {
    id: 'data-table',
    skill: 'data-display',
    make({ rng, name }) {
      const years = ['Year 4', 'Year 5', 'Year 6', 'Year 7'];
      const loans = years.map(() => int(rng, 20, 80));
      const i = int(rng, 0, 3);
      let j = int(rng, 0, 3);
      if (j === i) j = (i + 2) % 4;
      const diff = Math.abs(loans[i]! - loans[j]!);
      const more = loans[i]! >= loans[j]! ? years[i] : years[j];
      const less = more === years[i] ? years[j] : years[i];
      return {
        stem: `The table shows books borrowed from ${name}’s library (${loans.reduce((a, b) => a + b, 0)} in all). How many more books did ${more} borrow than ${less}?`,
        correct: String(diff),
        distractors: [String(loans[i]), String(loans[j]), String(loans.reduce((a, b) => a + b, 0)), String(Math.max(...loans))],
        explanation: `${more} borrowed ${Math.max(loans[i]!, loans[j]!)} and ${less} borrowed ${Math.min(loans[i]!, loans[j]!)}, so the difference is ${diff}.`,
        stimulus: {
          type: 'table',
          caption: `${name}’s library loans`,
          headers: ['Year', 'Books'],
          rows: years.map((year, index) => [year, String(loans[index])]),
        },
      };
    },
  },
  {
    id: 'line-graph',
    skill: 'data-display',
    make({ rng, name }) {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const temps = days.map(() => int(rng, 12, 28));
      const hottest = Math.max(...temps);
      const coolest = Math.min(...temps);
      const diff = hottest - coolest;
      return {
        stem: `The line graph shows lunchtime temperature at ${name}’s school this week. Monday was ${temps[0]}°C. What is the difference between the hottest and coolest days?`,
        correct: `${diff}°C`,
        distractors: [`${hottest}°C`, `${coolest}°C`, `${temps[0]}°C`, `${diff + 2}°C`],
        explanation: `Hottest ${hottest}°C minus coolest ${coolest}°C is ${diff}°C.`,
        stimulus: {
          type: 'line',
          caption: `${name}’s lunchtime temperatures`,
          xLabel: 'Day',
          yLabel: '°C',
          points: days.map((day, index) => ({ x: day, y: temps[index]! })),
        },
      };
    },
  },
  {
    id: 'painted-grid',
    skill: 'fractions',
    make({ rng, name }) {
      const columns = pick(rng, [4, 5, 6]);
      const rows = pick(rng, [3, 4, 5]);
      const total = columns * rows;
      const filled = int(rng, 2, total - 2);
      const g = gcd(filled, total);
      const correct = `${filled / g}/${total / g}`;
      return {
        stem: `${name} paints some equal sections of a ${columns} by ${rows} wall. What fraction of the wall is painted?`,
        correct,
        distractors: [
          `${filled}/${total}`,
          `${total - filled}/${total}`,
          `${filled}/${columns}`,
          `${rows}/${total}`,
        ].filter((row, index, all) => row !== correct && all.indexOf(row) === index),
        explanation: `${filled} of ${total} equal sections are painted, which simplifies to ${correct}.`,
        stimulus: { type: 'painted-grid', columns, rows, filled },
      };
    },
  },
];

function twoNames(rng: Rng): { name: string; other: string } {
  const name = pick(rng, NAMES);
  let other = pick(rng, NAMES);
  if (other === name) other = NAMES[(NAMES.indexOf(name) + 3) % NAMES.length]!;
  return { name, other };
}

function seedFor(kind: ExamMathSetKind, setNumber: number, sortOrder: number, attempt: number): number {
  const kindMul = kind === 'mini' ? 17 : kind === 'paper' ? 41 : 73;
  return (
    kindMul * 1_000_003 +
    setNumber * 97_331 +
    sortOrder * 1_009 +
    attempt * 13_241 +
    9029
  ) >>> 0;
}

function familyAt(kind: ExamMathSetKind, setNumber: number, sortOrder: number): Family {
  const offset = (setNumber * 7 + (kind === 'paper' ? 3 : 0) + sortOrder * 11) % FAMILIES.length;
  return FAMILIES.at(offset)!;
}

function makeItem(
  kind: ExamMathSetKind,
  setNumber: number,
  sortOrder: number,
  band: ExamMathDifficultyBand,
  usedStems: Set<string>,
): ExamMathSeedItem {
  const family = familyAt(kind, setNumber, sortOrder);
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const rng = mulberry32(seedFor(kind, setNumber, sortOrder, attempt));
    const { name, other } = twoNames(rng);
    const core = family.make({ rng, band, name, other });
    const stem = core.stem;
    if (usedStems.has(stem)) continue;
    const packed = packOptions(rng, core.correct, core.distractors);
    if (packed.options.length !== 5 || new Set(packed.options).size !== 5) continue;
    if (packed.correctIndex < 0 || packed.correctIndex > 4) continue;
    if (!packed.options[packed.correctIndex]) continue;
    usedStems.add(stem);
    return {
      kind,
      setNumber,
      sortOrder,
      familyId: family.id,
      skill: family.skill,
      stem,
      options: packed.options,
      correctIndex: packed.correctIndex,
      explanation: core.explanation,
      stimulus: core.stimulus,
    };
  }
  throw new Error(`Could not build unique ${kind} ${setNumber} q${sortOrder} (${family.id})`);
}

let cachedBank: ExamMathSeedItem[] | null = null;

export function examMathFamilies(): Array<{ id: string; skill: string }> {
  return FAMILIES.map((family) => ({ id: family.id, skill: family.skill }));
}

export function findExamMathFamily(familyId: string): Family | undefined {
  return FAMILIES.find((family) => family.id === familyId);
}

/** Mint one original item of a known family. Used by Strengthen, not by OpenAI. */
export function makeExamMathFamilyItem(input: {
  familyId: string;
  band: ExamMathDifficultyBand;
  usedStems: Iterable<string>;
  seed: number;
}): Omit<ExamMathSeedItem, 'kind' | 'setNumber' | 'sortOrder'> {
  const family = findExamMathFamily(input.familyId);
  if (!family) throw new Error(`Unknown Selective Math family ${input.familyId}`);
  const used = new Set(input.usedStems);
  const tryMake = (stems: Set<string>) => {
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const rng = mulberry32((input.seed + attempt * 13_241) >>> 0);
      const { name, other } = twoNames(rng);
      const core = family.make({ rng, band: input.band, name, other });
      if (stems.has(core.stem)) continue;
      const packed = packOptions(rng, core.correct, core.distractors);
      if (packed.options.length !== 5 || new Set(packed.options).size !== 5) continue;
      if (packed.correctIndex < 0 || packed.correctIndex > 4) continue;
      if (!packed.options[packed.correctIndex]) continue;
      stems.add(core.stem);
      return {
        familyId: family.id,
        skill: family.skill,
        stem: core.stem,
        options: packed.options,
        correctIndex: packed.correctIndex,
        explanation: core.explanation,
        stimulus: core.stimulus,
      };
    }
    return null;
  };
  const first = tryMake(used);
  if (first) return first;
  const studentOnly = tryMake(new Set());
  if (studentOnly) return studentOnly;
  throw new Error(`Could not build a new ${family.id} question`);
}

export function buildExamMathBank(): ExamMathSeedItem[] {
  if (cachedBank) return cachedBank;
  const used = new Set<string>();
  const items: ExamMathSeedItem[] = [];
  for (let setNumber = 1; setNumber <= EXAM_MATH_MINI_COUNT; setNumber += 1) {
    const band = miniDifficultyBand(setNumber);
    for (let sortOrder = 1; sortOrder <= EXAM_MATH_MINI_QUESTIONS; sortOrder += 1) {
      items.push(makeItem('mini', setNumber, sortOrder, band, used));
    }
  }
  for (let setNumber = 1; setNumber <= EXAM_MATH_PAPER_COUNT; setNumber += 1) {
    const band = paperDifficultyBand(setNumber);
    for (let sortOrder = 1; sortOrder <= EXAM_MATH_PAPER_QUESTIONS; sortOrder += 1) {
      items.push(makeItem('paper', setNumber, sortOrder, band, used));
    }
  }
  cachedBank = items;
  return items;
}

/** Diagram-heavy warm-up so the trial shows graphs, tables, clocks and shapes. */
const TRIAL_WARMUP_FAMILY_IDS = [
  'bar-graph',
  'pie-chart',
  'data-table',
  'line-graph',
  'painted-grid',
  'clock-angle',
  'scale-leftover',
  'hidden-cubes',
  'compound-area',
  'mean-missing',
] as const;

/** Mixed mini exam: remaining visual types plus core reasoning. */
const TRIAL_MINI_FAMILY_IDS = [
  'square-cut-perimeter',
  'equal-area-rect',
  'grid-next',
  'straight-angle',
  'elapsed-timetable',
  'remainder-odd-one',
  'geometric-gap',
  'lcm-laps',
  'probability-count',
  'percent-of',
  'ratio-share',
  'order-of-operations',
] as const;

export const EXAM_MATH_TRIAL_BANK_SIZE =
  EXAM_MATH_TRIAL_WARMUP_QUESTIONS + EXAM_MATH_TRIAL_MINI_QUESTIONS;

function makeChosenFamilyItem(
  kind: ExamMathSetKind,
  setNumber: number,
  sortOrder: number,
  band: ExamMathDifficultyBand,
  familyId: string,
  usedStems: Set<string>,
): ExamMathSeedItem {
  const family = findExamMathFamily(familyId);
  if (!family) throw new Error(`Unknown Selective Math family ${familyId}`);
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const rng = mulberry32(seedFor(kind, setNumber, sortOrder, attempt));
    const { name, other } = twoNames(rng);
    const core = family.make({ rng, band, name, other });
    if (usedStems.has(core.stem)) continue;
    const packed = packOptions(rng, core.correct, core.distractors);
    if (packed.options.length !== 5 || new Set(packed.options).size !== 5) continue;
    if (packed.correctIndex < 0 || packed.correctIndex > 4) continue;
    if (!packed.options[packed.correctIndex]) continue;
    usedStems.add(core.stem);
    return {
      kind,
      setNumber,
      sortOrder,
      familyId: family.id,
      skill: family.skill,
      stem: core.stem,
      options: packed.options,
      correctIndex: packed.correctIndex,
      explanation: core.explanation,
      stimulus: core.stimulus,
    };
  }
  throw new Error(`Could not build unique trial ${kind} ${setNumber} q${sortOrder} (${familyId})`);
}

let cachedTrialBank: ExamMathSeedItem[] | null = null;

/** Extra trial-only items. Paid mini/paper banks do not include these rows. */
export function buildExamMathTrialBank(): ExamMathSeedItem[] {
  if (cachedTrialBank) return cachedTrialBank;
  const used = new Set(buildExamMathBank().map((item) => item.stem));
  const items: ExamMathSeedItem[] = [];
  TRIAL_WARMUP_FAMILY_IDS.forEach((familyId, index) => {
    items.push(
      makeChosenFamilyItem(
        'trial',
        EXAM_MATH_TRIAL_WARMUP_SET,
        index + 1,
        'standard',
        familyId,
        used,
      ),
    );
  });
  TRIAL_MINI_FAMILY_IDS.forEach((familyId, index) => {
    items.push(
      makeChosenFamilyItem(
        'trial',
        EXAM_MATH_TRIAL_MINI_SET,
        index + 1,
        'standard',
        familyId,
        used,
      ),
    );
  });
  cachedTrialBank = items;
  return items;
}
