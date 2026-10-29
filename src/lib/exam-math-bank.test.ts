import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  EXAM_MATH_MINI_COUNT,
  EXAM_MATH_MINI_QUESTIONS,
  EXAM_MATH_PAPER_COUNT,
  EXAM_MATH_PAPER_QUESTIONS,
} from './exam-math';
import {
  EXAM_MATH_BANK_SIZE,
  EXAM_MATH_SOURCE_PHRASE_BLOCKLIST,
  buildExamMathBank,
  examMathFamilies,
} from './exam-math-bank';

describe('Selective Math question bank', () => {
  const bank = buildExamMathBank();

  it('fills 100 mini exams of 12 and 20 papers of 35', () => {
    assert.equal(EXAM_MATH_BANK_SIZE, 1900);
    assert.equal(bank.length, 1900);
    assert.equal(
      bank.filter((item) => item.kind === 'mini').length,
      EXAM_MATH_MINI_COUNT * EXAM_MATH_MINI_QUESTIONS,
    );
    assert.equal(
      bank.filter((item) => item.kind === 'paper').length,
      EXAM_MATH_PAPER_COUNT * EXAM_MATH_PAPER_QUESTIONS,
    );
    assert.equal(
      new Set(bank.filter((item) => item.kind === 'mini').map((item) => item.setNumber)).size,
      100,
    );
    assert.equal(
      new Set(bank.filter((item) => item.kind === 'paper').map((item) => item.setNumber)).size,
      20,
    );
  });

  it('keeps unique stems, five unique A–E options, and a valid correct index', () => {
    const stems = bank.map((item) => item.stem);
    assert.equal(new Set(stems).size, stems.length);
    for (const item of bank) {
      assert.equal(item.options.length, 5, item.stem);
      assert.equal(new Set(item.options).size, 5, item.stem);
      assert.ok(item.correctIndex >= 0 && item.correctIndex <= 4, item.stem);
      assert.ok(item.stem.length > 20, item.stem);
      assert.ok(item.explanation.length > 8, item.familyId);
      assert.ok(item.working.length >= 2, item.familyId);
      assert.equal(item.working.at(-1)?.heading, 'The answer', item.familyId);
      assert.ok(item.familyId);
      assert.ok(item.skill);
    }
  });

  it('does not copy distinctive wording from the official papers', () => {
    const hay = bank.map((item) => item.stem.toLowerCase()).join('\n');
    for (const phrase of EXAM_MATH_SOURCE_PHRASE_BLOCKLIST) {
      assert.equal(hay.includes(phrase), false, phrase);
    }
  });

  it('mixes families across a paper and a mini exam', () => {
    const families = examMathFamilies();
    assert.ok(families.length >= 30);
    const paper1 = bank.filter((item) => item.kind === 'paper' && item.setNumber === 6);
    const mini1 = bank.filter((item) => item.kind === 'mini' && item.setNumber === 1);
    assert.equal(paper1.length, 35);
    assert.equal(mini1.length, 12);
    assert.ok(new Set(paper1.map((item) => item.familyId)).size >= 20);
    assert.ok(new Set(mini1.map((item) => item.familyId)).size >= 8);
    const counts = new Map<string, number>();
    for (const item of bank) counts.set(item.familyId, (counts.get(item.familyId) ?? 0) + 1);
    const sizes = Array.from(counts.values());
    const most = Math.max(...sizes);
    const least = Math.min(...sizes);
    assert.ok(most <= 120, `family overused: ${most}`);
    assert.ok(least >= 3);
    assert.equal(bank.some((item) => item.stem.includes('Working from')), false);
  });

  it('gets geometric, LCM, hidden-cube and straight-angle items right', () => {
    const geometric = bank.find((item) => item.familyId === 'geometric-gap');
    assert.ok(geometric);
    const match = geometric.stem.match(/multiplies by (\d+) each time: ([0-9? ,]+)/);
    assert.ok(match);
    const mult = Number(match[1]);
    const terms = match[2]!.split(',').map((part) => part.trim());
    const start = Number(terms[0]);
    const expected = start * mult * mult;
    assert.equal(geometric.options[geometric.correctIndex], String(expected));

    const hidden = bank.find((item) => item.familyId === 'hidden-cubes' && /3 × 3 × 3/.test(item.stem));
    if (hidden) {
      assert.equal(hidden.options[hidden.correctIndex], '1');
    }

    const lcmItem = bank.find((item) => item.familyId === 'lcm-laps');
    assert.ok(lcmItem);
    const laps: number[] = [];
    const lapRe = /every (\d+) minutes/g;
    let lapMatch: RegExpExecArray | null = lapRe.exec(lcmItem.stem);
    while (lapMatch) {
      laps.push(Number(lapMatch[1]));
      lapMatch = lapRe.exec(lcmItem.stem);
    }
    assert.equal(laps.length, 3);
    const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
    const lcm = (a: number, b: number) => (a / gcd(a, b)) * b;
    const expectedLcm = lcm(lcm(laps[0]!, laps[1]!), laps[2]!);
    assert.equal(lcmItem.options[lcmItem.correctIndex], String(expectedLcm));

    const angle = bank.find((item) => item.familyId === 'straight-angle');
    assert.ok(angle);
    const given = Number(angle.stem.match(/One angle is (\d+)/)?.[1]);
    assert.equal(angle.options[angle.correctIndex], `${180 - given}°`);
  });

  it('keeps grid references on A–Z columns', () => {
    const grid = bank.filter((item) => item.familyId === 'grid-next');
    assert.ok(grid.length > 0);
    for (const item of grid) {
      for (const option of item.options) {
        assert.match(option, /^[A-Z]\d+$/, `${item.stem} → ${option}`);
      }
    }
  });
});
