import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  hintCovered,
  isWeakVocabularyFalsePositive,
  looksLikeEventList,
  sequenceStartCount,
} from './writing-hints';

describe('hintCovered', () => {
  it('treats a sports-carnival opening as covering “set the scene” without the word scene', () => {
    const content =
      'Today was our school sports carnival. It started very early. When we arrived at the oval, everyone was wearing their house colours.';
    assert.equal(hintCovered(content, 'Set the scene for how the day began'), true);
  });

  it('treats the boy falling as covering a tense moment hint', () => {
    const content = 'I was coming second, but then the boy next to me tripped and fell.';
    assert.equal(hintCovered(content, 'Describe a tense or funny moment during an event'), true);
  });
});

describe('looksLikeEventList', () => {
  it('does not treat next-to-me or coming-second as extra events', () => {
    const content = [
      'Dear Diary,',
      'It was a chilly Friday morning when the sports carnival began.',
      '',
      'Then came the 100-metre sprint. I was coming second, but the boy next to me stumbled.',
      '',
      'By the end of the day I felt proud.',
    ].join('\n');
    assert.equal(sequenceStartCount(content) < 3, true);
    assert.equal(looksLikeEventList(content), false);
  });

  it('still flags a diary that hops from bus to game to lunch to bus', () => {
    const content = [
      'Dear Diary,',
      'I just have to share this hilarious carnival! So first the day started as even the bus ride was so fun! The guy named Ben was extremely funny and even the sun was jealous.',
      '',
      'After we arrived at the sports carnival I played a game called Spot It for about ten minutes.',
      '',
      'Then we ate lunch and I had a peanut butter sandwich which is my favourite.',
      '',
      'At the end of the day we all hopped on the bus again and had another roast battle.',
    ].join('\n');
    assert.equal(sequenceStartCount(content) >= 3, true);
    assert.equal(looksLikeEventList(content), true);
  });
});

describe('isWeakVocabularyFalsePositive', () => {
  it('ignores very in the very end and went in went off', () => {
    const end = 'cheered for each other until the very end.';
    const gun = 'When the starter gun went off, I ran.';
    const veryAt = end.indexOf('very');
    const wentAt = gun.indexOf('went');
    assert.equal(isWeakVocabularyFalsePositive('very', end, veryAt, veryAt + 4), true);
    assert.equal(isWeakVocabularyFalsePositive('went', gun, wentAt, wentAt + 4), true);
    assert.equal(isWeakVocabularyFalsePositive('very', 'I was very tired.', 6, 10), false);
  });
});
