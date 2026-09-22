import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SEED_MINI_DRILLS } from './seed-mini-drills';
import { SEED_PROMPTS } from './seed-prompts';
import {
  TRIAL_PACK_DRILLS,
  TRIAL_PACK_PROMPT,
  TRIAL_PACK_PROMPT_TITLE,
} from './seed-trial-pack';

describe('dedicated trial pack', () => {
  it('adds one extra writing task and ten extra mini questions', () => {
    assert.equal(TRIAL_PACK_PROMPT.kind, 'trial');
    assert.equal(TRIAL_PACK_PROMPT.title, TRIAL_PACK_PROMPT_TITLE);
    assert.equal(TRIAL_PACK_PROMPT.time_limit_minutes, 30);
    assert.equal(TRIAL_PACK_DRILLS.length, 10);
    assert.deepEqual(
      TRIAL_PACK_DRILLS.map((row) => row.slug),
      Array.from({ length: 10 }, (_, index) => `trial-pack-${String(index + 1).padStart(2, '0')}`),
    );
  });

  it('does not reuse a paid unit title or mini slug', () => {
    assert.equal(
      SEED_PROMPTS.some((prompt) => prompt.title === TRIAL_PACK_PROMPT_TITLE),
      false,
    );
    const paidSlugs = new Set(SEED_MINI_DRILLS.map((row) => row.slug));
    for (const drill of TRIAL_PACK_DRILLS) {
      assert.equal(paidSlugs.has(drill.slug), false);
      assert.equal(drill.sort_order >= 1 && drill.sort_order <= 10, true);
      assert.equal(drill.options.length, 3);
      assert.equal(drill.correct_index >= 0 && drill.correct_index <= 2, true);
    }
  });
});
