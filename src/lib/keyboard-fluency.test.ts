import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { focusedMinutes, wordsPerMinute } from './keyboard-fluency';

describe('wordsPerMinute', () => {
  it('returns words per minute for a timed sitting', () => {
    assert.equal(wordsPerMinute(240, 20 * 60), 12);
    assert.equal(wordsPerMinute(300, 30 * 60), 10);
  });

  it('skips a sitting that is too short to measure', () => {
    assert.equal(wordsPerMinute(80, 10), null);
    assert.equal(wordsPerMinute(0, 1800), null);
  });
});

describe('focusedMinutes', () => {
  it('rounds a 30-minute paper to minutes', () => {
    assert.equal(focusedMinutes(27 * 60 + 20), 27);
    assert.equal(focusedMinutes(40), 1);
    assert.equal(focusedMinutes(5), null);
  });
});
