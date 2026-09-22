import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isMissingTrialColumn } from './writing-trial-schema';

describe('writing trial schema', () => {
  it('recognises a missing access_kind column', () => {
    assert.equal(
      isMissingTrialColumn(new Error('column "access_kind" does not exist')),
      true,
    );
    assert.equal(
      isMissingTrialColumn(new Error('column "trial_started_at" does not exist')),
      true,
    );
    assert.equal(isMissingTrialColumn(new Error('relation does not exist')), false);
  });
});
