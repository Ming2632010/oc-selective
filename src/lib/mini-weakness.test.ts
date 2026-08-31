import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  extraCapacity,
  pickMiniFocus,
  writingDimToMiniSkill,
} from './mini-weakness';
import {
  buildFallbackPack,
  parseGeneratedPack,
  parseGeneratedQuestion,
} from './generate-mini-drills';

describe('pickMiniFocus', () => {
  it('targets missed mini skills in the unit first', () => {
    const focus = pickMiniFocus({
      unitLabel: 'Formal Letter',
      unitStats: [
        { skill: 'format', attempted: 2, correct: 2 },
        { skill: 'punctuation', attempted: 2, correct: 0 },
        { skill: 'audience', attempted: 1, correct: 1 },
        { skill: 'vocabulary', attempted: 0, correct: 0 },
        { skill: 'structure', attempted: 1, correct: 1 },
      ],
      overallStats: [],
      writingWeakest: 'vocabulary',
    });
    assert.equal(focus.skills[0], 'punctuation');
    assert.ok(focus.skills.includes('vocabulary'));
    assert.match(focus.reason, /Punctuation/);
  });

  it('maps writing grammar scores onto punctuation', () => {
    assert.equal(writingDimToMiniSkill('grammar'), 'punctuation');
    const focus = pickMiniFocus({
      unitLabel: 'Email',
      unitStats: [],
      overallStats: [],
      writingWeakest: 'grammar',
    });
    assert.ok(focus.skills.includes('punctuation'));
    assert.match(focus.reason, /sentences, punctuation and spelling/);
  });

  it('falls back to format when there is no history', () => {
    const focus = pickMiniFocus({
      unitLabel: 'Narrative',
      unitStats: [],
      overallStats: [],
      writingWeakest: null,
    });
    assert.ok(focus.skills.includes('format'));
    assert.equal(focus.skills.length, 2);
  });
});

describe('extraCapacity', () => {
  it('blocks extra questions after the unit cap', () => {
    const cap = extraCapacity(12, 0);
    assert.equal(cap.can_generate, false);
    assert.equal(cap.pack_size, 0);
  });

  it('allows a pack of three when there is room', () => {
    const cap = extraCapacity(3, 0);
    assert.equal(cap.can_generate, true);
    assert.equal(cap.pack_size, 3);
  });
});

describe('parseGeneratedPack', () => {
  it('keeps only valid three-option questions in the target skills', () => {
    const parsed = parseGeneratedPack(
      {
        questions: [
          {
            skill: 'punctuation',
            title: 'Full stop',
            stem: 'Which sentence is punctuated correctly for a letter?',
            options: ['Hello.', 'hello', 'HELLO!!!!'],
            correct_index: 0,
            explanation: 'Start with a capital and end with one full stop.',
          },
          {
            skill: 'vocabulary',
            title: 'x',
            stem: 'too short',
            options: ['a'],
            correct_index: 9,
            explanation: 'no',
          },
        ],
      },
      ['punctuation', 'format'],
    );
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].skill, 'punctuation');
  });

  it('rejects a skill outside the requested set', () => {
    const question = parseGeneratedQuestion(
      {
        skill: 'audience',
        title: 'Tone',
        stem: 'Which tone fits a letter to the council this week?',
        options: ['Polite and clear', 'Insults', 'Only slang'],
        correct_index: 0,
        explanation: 'Match the reader. Insults miss the audience mark.',
      },
      ['punctuation'],
    );
    assert.equal(question, null);
  });
});

describe('buildFallbackPack', () => {
  it('builds three extra letter questions for the focus skills', () => {
    const pack = buildFallbackPack({
      moduleId: 9,
      promptType: 'formal_letter',
      focus: {
        skills: ['punctuation', 'format'],
        reason: 'test',
      },
      packSize: 3,
      startOrder: 10,
      variation: 0,
    });
    assert.equal(pack.length, 3);
    assert.ok(pack.every((drill) => drill.module_id === 9));
    assert.ok(pack.every((drill) => drill.options.length === 3));
    assert.ok(pack.every((drill) => drill.slug.startsWith('ai-9-')));
    assert.deepEqual(
      pack.map((drill) => drill.sort_order),
      [11, 12, 13],
    );
  });
});
