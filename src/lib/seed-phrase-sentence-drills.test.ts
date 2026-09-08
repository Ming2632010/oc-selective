import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SEED_PHRASE_SENTENCE_DRILLS } from './seed-phrase-sentence-drills';

describe('seed phrase sentence drills', () => {
  it('adds one distinct phrase practice item to every unit', () => {
    assert.equal(SEED_PHRASE_SENTENCE_DRILLS.length, 11);
    assert.deepEqual(
      SEED_PHRASE_SENTENCE_DRILLS.map((drill) => drill.module_id),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    );
    assert.ok(
      SEED_PHRASE_SENTENCE_DRILLS.every(
        (drill) =>
          drill.item_kind === 'phrase_sentence' &&
          drill.stem.includes(`“${drill.prompt.phrase}”`) &&
          drill.prompt.sample.length > 10,
      ),
    );
  });
});
