import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  publicWarmupQuestions,
  scoreWarmupAnswers,
  warmupBankForPrompt,
  WARMUP_BANKS,
} from './warmup-questions';

describe('warmup questions', () => {
  it('keeps two banks of five valid MCQs', () => {
    for (const bank of WARMUP_BANKS) {
      assert.equal(bank.length, 5);
      for (const q of bank) {
        assert.ok(q.options.length >= 2);
        assert.ok(q.correctIndex >= 0 && q.correctIndex < q.options.length);
      }
    }
  });

  it('picks a stable bank per prompt id and hides answers', () => {
    const a = warmupBankForPrompt('prompt-aaa');
    const b = warmupBankForPrompt('prompt-aaa');
    assert.deepEqual(a, b);
    const published = publicWarmupQuestions(a);
    assert.equal('correctIndex' in published[0]!, false);
  });

  it('scores a full set of answers', () => {
    const bank = warmupBankForPrompt('x');
    const perfect = bank.map((q) => q.correctIndex);
    const scored = scoreWarmupAnswers(bank, perfect);
    assert.equal(scored?.correct, 5);
    assert.equal(scoreWarmupAnswers(bank, [0]), null);
  });
});
