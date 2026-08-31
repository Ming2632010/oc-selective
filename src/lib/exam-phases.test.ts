import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { examPhase } from './exam-phases';

describe('examPhase', () => {
  it('uses a 5 / 20 / 5 split on a 30-minute paper', () => {
    assert.equal(examPhase(30 * 60, 30 * 60), 'plan');
    assert.equal(examPhase(26 * 60, 30 * 60), 'plan');
    assert.equal(examPhase(24 * 60, 30 * 60), 'write');
    assert.equal(examPhase(6 * 60, 30 * 60), 'write');
    assert.equal(examPhase(5 * 60, 30 * 60), 'check');
    assert.equal(examPhase(0, 30 * 60), 'check');
  });

  it('scales the same ratios for a short debug timer', () => {
    const total = 30;
    assert.equal(examPhase(30, total), 'plan');
    assert.equal(examPhase(24, total), 'write');
    assert.equal(examPhase(4, total), 'check');
  });
});
