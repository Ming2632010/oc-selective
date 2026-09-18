import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isAvailableSubject, isSubject, KY1_SUBJECT_PRICE_AUD, SUBJECT_PRICE_AUD } from './subjects';

describe('subscription subject availability', () => {
  it('makes Selective Writing the only subject available to purchase', () => {
    assert.equal(isAvailableSubject('writing'), true);
    assert.equal(isAvailableSubject('math'), false);
    assert.equal(isAvailableSubject('thinking'), false);
    assert.equal(isAvailableSubject('reading'), false);
  });

  it('keeps every displayed subject valid', () => {
    assert.equal(isSubject('writing'), true);
    assert.equal(isSubject('math'), true);
    assert.equal(isSubject('thinking'), true);
    assert.equal(isSubject('reading'), true);
  });

  it('keeps exam subjects at $99 and K–Y1 at $29', () => {
    assert.equal(SUBJECT_PRICE_AUD, 99);
    assert.equal(KY1_SUBJECT_PRICE_AUD, 29);
  });
});
