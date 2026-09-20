import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  EARLY_MATH_SKILLS,
  EARLY_MATH_UNITS,
  recommendedUnitOrder,
} from './early-math';
import { canonicalizeCount, markEarlyMathItem } from './mark-early-math';
import { SEED_EARLY_MATH } from './seed-early-math';

describe('K–Y1 Maths catalogue', () => {
  it('has six units from seeing number through everyday maths', () => {
    assert.deepEqual(
      EARLY_MATH_UNITS.map((unit) => unit.title),
      [
        'See the number',
        'Count and compare',
        'Parts of 10',
        'Put together, take away',
        'Tens and ones',
        'Everyday maths',
      ],
    );
  });

  it('starts Year 1 on parts and stories, and Kindergarten on seeing number', () => {
    assert.deepEqual(recommendedUnitOrder('Year 1'), [3, 4, 5, 2, 6, 1]);
    assert.deepEqual(recommendedUnitOrder('Kindergarten'), [1, 2, 3, 4, 6, 5]);
  });
});

describe('K–Y1 Maths items', () => {
  it('gives every unit a small but varied set', () => {
    for (const unit of EARLY_MATH_UNITS) {
      const items = SEED_EARLY_MATH.filter((item) => item.unitId === unit.id);
      assert.ok(items.length >= 10, `unit ${unit.id} is too thin`);
    }
    assert.ok(SEED_EARLY_MATH.length >= 70);
  });

  it('uses unique slugs, titles, and stems so items are not reskins', () => {
    const slugs = SEED_EARLY_MATH.map((item) => item.slug);
    const titles = SEED_EARLY_MATH.map((item) => item.title);
    const stems = SEED_EARLY_MATH.map((item) => item.stem);
    assert.equal(new Set(slugs).size, slugs.length);
    assert.equal(new Set(titles).size, titles.length);
    assert.equal(new Set(stems).size, stems.length);
  });

  it('covers CGI story structures and more than one way to see a number', () => {
    const skills = new Set(SEED_EARLY_MATH.map((item) => item.skill));
    for (const skill of [
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
      'subitise-perceptual',
      'subitise-conceptual',
      'teen-vs-ten',
      'conservation',
      'leftovers',
    ] as const) {
      assert.equal(skills.has(skill), true, `missing ${skill}`);
    }
    assert.ok(skills.size >= 30);
    for (const skill of Array.from(skills)) {
      assert.ok((EARLY_MATH_SKILLS as readonly string[]).includes(skill));
    }
  });

  it('uses many stimulus kinds instead of one picture template', () => {
    const types = new Set(
      SEED_EARLY_MATH.map((item) => item.stimulus?.type).filter(Boolean),
    );
    assert.ok(types.has('dice' as never) || types.has('dots'));
    assert.ok(types.has('tenFrame'));
    assert.ok(types.has('fingers'));
    assert.ok(types.has('partWhole'));
    assert.ok(types.has('pictureGraph'));
    assert.ok(types.has('clock'));
    assert.ok(types.has('baseTen'));
    assert.ok(types.has('sharing'));
    assert.ok(types.has('matchNumber'));
    assert.ok(types.has('howManyMore'));
    assert.ok(types.has('oddOneOut'));
    assert.ok(types.size >= 13);
  });

  it('lets children tap a matching picture, a difference, or the odd one out', () => {
    const match = SEED_EARLY_MATH.find((row) => row.slug === 'see-match-four-shells');
    const more = SEED_EARLY_MATH.find((row) => row.slug === 'count-more-garden-leaves');
    const odd = SEED_EARLY_MATH.find((row) => row.slug === 'every-odd-triangle-in-circles');
    assert.ok(match);
    assert.ok(more);
    assert.ok(odd);
    assert.equal(markEarlyMathItem(match, { index: 1 }).isCorrect, true);
    assert.equal(markEarlyMathItem(match, { index: 0 }).isCorrect, false);
    assert.equal(markEarlyMathItem(more, { text: '3' }).isCorrect, true);
    assert.equal(markEarlyMathItem(more, { text: '8' }).isCorrect, false);
    assert.equal(markEarlyMathItem(odd, { index: 2 }).isCorrect, true);
  });

  it('keeps Kindy-friendly items and Year 1 stretch items', () => {
    assert.ok(SEED_EARLY_MATH.some((item) => item.difficulty === 'kindy'));
    assert.ok(SEED_EARLY_MATH.some((item) => item.difficulty === 'stretch'));
    assert.ok(
      SEED_EARLY_MATH.filter((item) => item.unitId === 5 && item.difficulty === 'stretch')
        .length >= 3,
    );
  });
});

describe('K–Y1 Maths marking', () => {
  it('accepts number words and digits for count items', () => {
    assert.equal(canonicalizeCount('seven'), '7');
    assert.equal(canonicalizeCount(' 07 '), '7');
    const item = SEED_EARLY_MATH.find((row) => row.slug === 'see-scattered-three');
    assert.ok(item);
    assert.equal(markEarlyMathItem(item, { text: 'three' }).isCorrect, true);
    assert.equal(markEarlyMathItem(item, { text: '4' }).isCorrect, false);
  });

  it('marks story problems by the unknown, not by adding every number in the sentence', () => {
    const change = SEED_EARLY_MATH.find((row) => row.slug === 'story-join-change-library');
    assert.ok(change);
    assert.equal(markEarlyMathItem(change, { text: '3' }).isCorrect, true);
    assert.equal(markEarlyMathItem(change, { text: '15' }).isCorrect, false);
  });
});
