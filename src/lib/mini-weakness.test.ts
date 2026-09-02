import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  extraCapacity,
  pickMiniFocus,
  selectExtraPack,
  writingDimToMiniSkill,
} from './mini-weakness';
import {
  buildFallbackPack,
  generateMiniPack,
  isSameMiniQuestion,
  keepNovelMiniQuestions,
  parseGeneratedPack,
  parseGeneratedQuestion,
} from './generate-mini-drills';
import { SEED_MINI_DRILLS } from './seed-mini-drills';
import { SEED_EXTRA_MINI_DRILLS } from './seed-extra-mini-drills';
import { SEED_MIXED_MINI_DRILLS } from './seed-mixed-mini-drills';

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

describe('selectExtraPack', () => {
  it('prefers focus skills from the unused bank', () => {
    const unused = SEED_EXTRA_MINI_DRILLS.filter((drill) => drill.module_id === 2);
    const pack = selectExtraPack(unused, ['punctuation', 'format'], 3);
    assert.equal(pack.length, 3);
    assert.ok(pack.every((drill) => ['punctuation', 'format'].includes(drill.skill)));
  });
});

describe('extra mini bank', () => {
  it('stores twelve extra questions with answers for each unit', () => {
    assert.equal(SEED_EXTRA_MINI_DRILLS.length, 132);
    for (let unit = 1; unit <= 11; unit += 1) {
      const inUnit = SEED_EXTRA_MINI_DRILLS.filter((drill) => drill.module_id === unit);
      assert.equal(inUnit.length, 12, `unit ${unit}`);
      const skills = new Set(inUnit.map((drill) => drill.skill));
      assert.equal(skills.size, 5, `unit ${unit} skills`);
      for (const drill of inUnit) {
        assert.ok(drill.options.length === 3, drill.slug);
        assert.ok(
          drill.correct_index >= 0 && drill.correct_index < 3,
          drill.slug,
        );
        assert.ok(drill.explanation.length >= 12, drill.slug);
      }
    }
  });

  it('does not copy a pre-set question from the same unit', () => {
    const slugs = [
      ...SEED_MINI_DRILLS.map((drill) => drill.slug),
      ...SEED_EXTRA_MINI_DRILLS.map((drill) => drill.slug),
      ...SEED_MIXED_MINI_DRILLS.map((drill) => drill.slug),
    ];
    assert.equal(new Set(slugs).size, slugs.length);
    for (let moduleId = 1; moduleId <= 11; moduleId += 1) {
      const seeds = SEED_MINI_DRILLS.filter((drill) => drill.module_id === moduleId);
      const extras = SEED_EXTRA_MINI_DRILLS.filter(
        (drill) => drill.module_id === moduleId,
      );
      for (const extra of extras) {
        const clash = seeds.find((seed) => isSameMiniQuestion(extra, seed));
        assert.equal(
          clash,
          undefined,
          `unit ${moduleId} extra copied “${clash?.title}”: ${extra.stem}`,
        );
        const titleClash = seeds.find(
          (seed) => seed.title.toLowerCase() === extra.title.toLowerCase(),
        );
        assert.equal(
          titleClash,
          undefined,
          `unit ${moduleId} extra reuses title “${extra.title}”`,
        );
      }
    }
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

  it('does not clone an earlier extra pack for the same unit', async () => {
    const previous = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      const first = await generateMiniPack({
        moduleId: 1,
        promptType: 'narrative',
        unitLabel: 'Narrative',
        focus: {
          skills: ['punctuation', 'format'],
          reason: 'test',
        },
        missedStems: [],
        packSize: 3,
        startOrder: 10,
        variation: 0,
      });
      const second = await generateMiniPack({
        moduleId: 1,
        promptType: 'narrative',
        unitLabel: 'Narrative',
        focus: {
          skills: ['punctuation', 'format'],
          reason: 'test',
        },
        missedStems: [],
        existingQuestions: first.drills,
        packSize: 3,
        startOrder: 13,
        variation: 3,
      });
      assert.equal(first.drills.length, 3);
      assert.equal(second.drills.length, 3);
      for (const drill of second.drills) {
        const clash = first.drills.find((row) => isSameMiniQuestion(drill, row));
        assert.equal(clash, undefined, `second pack copied “${clash?.title}”`);
      }
    } finally {
      if (previous === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = previous;
    }
  });

  it('never reuses a pre-set question from the same unit', async () => {
    const previous = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      for (let moduleId = 1; moduleId <= 11; moduleId += 1) {
        const seeds = SEED_MINI_DRILLS.filter(
          (drill) => drill.module_id === moduleId,
        );
        const pack = await generateMiniPack({
          moduleId,
          promptType: seeds[0].prompt_type,
          unitLabel: 'Unit',
          focus: {
            skills: ['punctuation', 'format'],
            reason: 'test',
          },
          missedStems: seeds.slice(0, 3).map((drill) => drill.stem),
          packSize: 3,
          startOrder: 10,
          variation: 0,
        });
        assert.equal(pack.drills.length, 3, `unit ${moduleId} pack size`);
        for (const drill of pack.drills) {
          const clash = seeds.find((seed) => isSameMiniQuestion(drill, seed));
          assert.equal(
            clash,
            undefined,
            `unit ${moduleId} extra copied “${clash?.title}”: ${drill.stem}`,
          );
        }
      }
    } finally {
      if (previous === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = previous;
    }
  });
});

describe('keepNovelMiniQuestions', () => {
  it('drops an extra that copies a pre-set stem', () => {
    const seed = SEED_MINI_DRILLS.find(
      (drill) =>
        drill.module_id === 1 &&
        drill.stem === 'Which sentence is punctuated correctly?',
    );
    assert.ok(seed);
    const copy = {
      title: 'More practice',
      stem: 'Which sentence is punctuated correctly?',
      options: ['A.', 'b', 'C!!!!'],
    };
    assert.equal(isSameMiniQuestion(copy, seed), true);
    assert.deepEqual(keepNovelMiniQuestions([copy], [seed]), []);
  });

  it('drops an extra that reuses the same three options', () => {
    const seed = SEED_MINI_DRILLS.find((drill) => drill.module_id === 1);
    assert.ok(seed);
    const copy = {
      title: 'A new heading',
      stem: 'Here is a freshly worded stem that looks original enough.',
      options: [...seed.options],
    };
    assert.equal(isSameMiniQuestion(copy, seed), true);
    assert.equal(keepNovelMiniQuestions([copy], [seed]).length, 0);
  });

  it('keeps a genuinely new stem and option set', () => {
    const seed = SEED_MINI_DRILLS.find((drill) => drill.module_id === 1);
    assert.ok(seed);
    const fresh = {
      title: 'Canteen list',
      stem: 'Which canteen order uses commas in a plain list?',
      options: [
        'Please pack a sandwich, an apple, and water.',
        'Please pack a sandwich an apple and water',
        'Please pack, a sandwich an apple and, water.',
      ],
    };
    assert.equal(isSameMiniQuestion(fresh, seed), false);
    assert.equal(keepNovelMiniQuestions([fresh], [seed]).length, 1);
  });
});
