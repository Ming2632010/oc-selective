import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  extraCapacity,
  pickMiniFocus,
  writingDimToMiniSkill,
} from './mini-weakness';
import {
  buildFallbackPack,
  generateMiniPack,
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

  it('keeps labelled skills such as Word choice', () => {
    const question = parseGeneratedQuestion(
      {
        skill: 'Word choice',
        title: 'A clearer verb',
        stem: 'Which verb is stronger than “went” in a story opening?',
        options: ['hurried', 'went', 'did stuff'],
        correct_index: 0,
        explanation: 'A precise everyday verb is clearer than a vague one.',
      },
      ['audience', 'format'],
    );
    assert.equal(question?.skill, 'vocabulary');
  });

  it('still keeps a valid question if the skill is not the focus', () => {
    const question = parseGeneratedQuestion(
      {
        skill: 'Audience',
        title: 'Tone',
        stem: 'Which tone fits a letter to the council this week?',
        options: ['Polite and clear', 'Insults', 'Only slang'],
        correct_index: 0,
        explanation: 'Match the reader. Insults miss the audience mark.',
      },
      ['punctuation'],
    );
    assert.equal(question?.skill, 'audience');
  });

  it('accepts typical model labels for Audience, Format, and Word choice', () => {
    const parsed = parseGeneratedPack(
      {
        questions: [
          {
            skill: 'Word choice',
            title: 'Stronger verb',
            stem: 'Which verb is clearer than “went” for a narrative?',
            options: ['hurried', 'went', 'did stuff'],
            correct_index: 0,
            explanation: 'Precise everyday verbs are stronger than vague ones.',
          },
          {
            skill: 'Format',
            title: 'Story shape',
            stem: 'Which line belongs in a Selective narrative?',
            options: [
              'A beginning, a problem, and an ending',
              'BUY NOW OR ELSE!!!!',
              'Subject: hello',
            ],
            correct_index: 0,
            explanation: 'Keep the story form. Ads and email fields belong elsewhere.',
          },
          {
            skill: 'Audience',
            title: 'Who is reading',
            stem: 'Which tone fits a school story a marker will read?',
            options: [
              'Clear sentences the reader can follow',
              'yo this slaps ngl',
              'OMG worst thing ever!!!!',
            ],
            correct_index: 0,
            explanation: 'Markers need readable, respectful language, not chat slang.',
          },
        ],
      },
      ['audience', 'format'],
    );
    assert.equal(parsed.length, 3);
    assert.deepEqual(
      parsed.map((question) => question.skill),
      ['format', 'audience', 'vocabulary'],
    );
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

describe('generateMiniPack', () => {
  it('uses the local pack when OpenAI is not configured', async () => {
    const previous = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      const pack = await generateMiniPack({
        moduleId: 1,
        promptType: 'narrative',
        unitLabel: 'Narrative',
        focus: {
          skills: ['audience', 'format'],
          reason: 'test',
        },
        missedStems: [],
        packSize: 3,
        startOrder: 10,
        variation: 1,
      });
      assert.equal(pack.via, 'fallback');
      assert.equal(pack.drills.length, 3);
      assert.ok(pack.drills.every((drill) => drill.options.length === 3));
    } finally {
      if (previous === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = previous;
    }
  });
});
