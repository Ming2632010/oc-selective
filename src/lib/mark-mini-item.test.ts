import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  countWords,
  hasWord,
  markMiniItem,
  normalizeAnswerText,
} from './mark-mini-item';

describe('normalizeAnswerText', () => {
  it('ignores case, accents, and punctuation', () => {
    assert.equal(normalizeAnswerText("I'm"), 'im');
    assert.equal(normalizeAnswerText('I’m'), 'im');
    assert.equal(normalizeAnswerText('  Guardian. '), 'guardian');
  });
});

describe('hasWord', () => {
  it('matches whole words only', () => {
    assert.equal(hasWord('The cellar was dark.', 'cellar'), true);
    assert.equal(hasWord('The bookshelf was tall.', 'else'), false);
    assert.equal(hasWord('Buy tickets now or else.', 'or else'), true);
  });
});

describe('markMiniItem', () => {
  it('marks a matching choice', () => {
    const result = markMiniItem({
      kind: 'choice',
      correctIndex: 1,
      answerIndex: 1,
      prompt: {},
      explanation: 'Yes.',
    });
    assert.equal(result.isCorrect, true);
  });

  it('accepts a correct spelling with extra capitals', () => {
    const result = markMiniItem({
      kind: 'spelling',
      correctIndex: 0,
      answerText: 'Guardian',
      prompt: {
        sentence: 'The gardian opened the gate.',
        misspelled: 'gardian',
        accepted: ['guardian'],
      },
      explanation: 'guardian',
    });
    assert.equal(result.isCorrect, true);
    assert.equal(result.sample, 'guardian');
  });

  it('rejects the misspelled word typed back', () => {
    const result = markMiniItem({
      kind: 'spelling',
      correctIndex: 0,
      answerText: 'gardian',
      prompt: {
        sentence: 'The gardian opened the gate.',
        misspelled: 'gardian',
        accepted: ['guardian'],
      },
      explanation: 'guardian',
    });
    assert.equal(result.isCorrect, false);
  });

  it('marks a rewrite against the checklist', () => {
    const prompt = {
      original: 'Dear Principal, I wish to complain about the dark library.',
      hint: 'Start in the moment.',
      mustInclude: ['library'],
      mustNotInclude: ['Dear', 'sincerely'],
      minWords: 8,
      sample: 'Maya stepped into the dark library and the door clicked shut.',
    };
    const pass = markMiniItem({
      kind: 'rewrite',
      correctIndex: 0,
      answerText: 'Maya stepped into the dark library and the door clicked shut.',
      prompt,
      explanation: 'Story line.',
    });
    assert.equal(pass.isCorrect, true);
    assert.ok(countWords(prompt.sample) >= 8);

    const fail = markMiniItem({
      kind: 'rewrite',
      correctIndex: 0,
      answerText: 'Dear Principal, the library was dark.',
      prompt,
      explanation: 'Story line.',
    });
    assert.equal(fail.isCorrect, false);
    assert.ok(fail.checks.some((check) => check.id.startsWith('avoid-') && !check.passed));
  });

  it('marks sentence order from shuffled indexes', () => {
    const sentences = [
      'Maya stopped at the gate.',
      'She pushed it open.',
      'The garden was silent.',
    ];
    const shuffled = [sentences[1], sentences[2], sentences[0]];
    const result = markMiniItem({
      kind: 'order',
      correctIndex: 0,
      answerOrder: [2, 0, 1],
      prompt: { sentences, shuffled },
      explanation: 'Time order.',
    });
    assert.equal(result.isCorrect, true);

    const wrong = markMiniItem({
      kind: 'order',
      correctIndex: 0,
      answerOrder: [0, 1, 2],
      prompt: { sentences, shuffled },
      explanation: 'Time order.',
    });
    assert.equal(wrong.isCorrect, false);
  });

  it('marks a short write for words, capitals, and required tokens', () => {
    const prompt = {
      task: 'Open a story at a locked door.',
      mustInclude: ['door'],
      mustNotInclude: ['Dear'],
      minWords: 12,
      sample: 'The locked door would not turn. Sam pressed his ear to the wood and waited.',
    };
    const pass = markMiniItem({
      kind: 'short_write',
      correctIndex: 0,
      answerText: prompt.sample,
      prompt,
      explanation: 'Open in the moment.',
    });
    assert.equal(pass.isCorrect, true);

    const fail = markMiniItem({
      kind: 'short_write',
      correctIndex: 0,
      answerText: 'door',
      prompt,
      explanation: 'Open in the moment.',
    });
    assert.equal(fail.isCorrect, false);
    assert.ok(fail.checks.some((check) => check.id === 'min-words' && !check.passed));
  });
});
