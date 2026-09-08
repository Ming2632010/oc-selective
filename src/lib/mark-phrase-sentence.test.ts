import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { markPhraseSentence } from './mark-phrase-sentence';
import { publicMiniPrompt } from './mini-item-kinds';

const prompt = {
  phrase: 'as a result',
  task: 'Explain a cause and its result.',
  minWords: 7,
  maxWords: 35,
  sample: 'The compost pile received fresh air; as a result, the scraps began to break down.',
};

describe('phrase sentence mini practice', () => {
  it('keeps only student-facing phrase prompt fields public', () => {
    assert.deepEqual(publicMiniPrompt('phrase_sentence', prompt), {
      phrase: 'as a result',
      task: 'Explain a cause and its result.',
      minWords: 7,
      maxWords: 35,
    });
  });

  it('uses the fallback checklist when AI is not configured', async () => {
    const savedKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      const result = await markPhraseSentence({
        prompt,
        answerText:
          'The compost pile received fresh air; as a result, the scraps began to break down.',
        unitLabel: 'Explanation',
      });
      assert.equal(result.isCorrect, true);
      assert.ok(result.checks.every((check) => check.passed));
      assert.match(result.explanation, /AI feedback is temporarily unavailable/);
    } finally {
      if (savedKey) process.env.OPENAI_API_KEY = savedKey;
    }
  });

  it('does not accept a sentence that omits the required phrase', async () => {
    const savedKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      const result = await markPhraseSentence({
        prompt,
        answerText: 'Fresh air helps the scraps break down into rich soil.',
        unitLabel: 'Explanation',
      });
      assert.equal(result.isCorrect, false);
      assert.equal(result.checks.find((check) => check.id === 'phrase')?.passed, false);
    } finally {
      if (savedKey) process.env.OPENAI_API_KEY = savedKey;
    }
  });
});
