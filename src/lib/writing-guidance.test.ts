import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  highestUnlockedUnit,
  isUnitUnlocked,
  maxDraftForPrompt,
  recommendNextTask,
  weakestDimension,
  type AttemptSummary,
  type PromptSummary,
} from './writing-guidance';
import { markMiniChoice, SEED_MINI_DRILLS } from './seed-mini-drills';

const prompts: PromptSummary[] = [
  { id: 'p1', title: 'The locked door', prompt_type: 'narrative', module_id: 1 },
  { id: 'p2a', title: 'In the future', prompt_type: 'diary_entry', module_id: 2 },
  { id: 'p2b', title: 'Sports carnival day', prompt_type: 'diary_entry', module_id: 2 },
  { id: 'p3', title: 'Chaos on the beach', prompt_type: 'news_report', module_id: 3 },
];

describe('highestUnlockedUnit', () => {
  it('keeps every unit open', () => {
    assert.equal(highestUnlockedUnit([]), 11);
    assert.equal(isUnitUnlocked(1), true);
    assert.equal(isUnitUnlocked(2), true);
    assert.equal(isUnitUnlocked(11), true);
    assert.equal(isUnitUnlocked(0), false);
  });
});

describe('weakestDimension', () => {
  it('returns null without scored attempts', () => {
    assert.equal(weakestDimension([]), null);
  });

  it('picks the lowest average dimension', () => {
    const attempts: AttemptSummary[] = [
      {
        prompt_id: 'p1',
        draft_number: 1,
        overall_score: 16,
        scores_breakdown: {
          structure: 4,
          vocabulary: 2,
          audience: 4,
          grammar: 3,
        },
      },
      {
        prompt_id: 'p1',
        draft_number: 2,
        overall_score: 18,
        scores_breakdown: {
          structure: 4,
          vocabulary: 1,
          audience: 4,
          grammar: 4,
        },
      },
    ];
    assert.equal(weakestDimension(attempts), 'vocabulary');
  });
});

describe('recommendNextTask', () => {
  it('continues an unfinished draft before opening a new prompt', () => {
    const attempts: AttemptSummary[] = [
      {
        prompt_id: 'p1',
        draft_number: 1,
        overall_score: 12,
        scores_breakdown: {
          structure: 2,
          vocabulary: 4,
          audience: 3,
          grammar: 3,
        },
      },
    ];
    const rec = recommendNextTask(prompts, attempts, 11);
    assert.ok(rec);
    assert.equal(rec.prompt_id, 'p1');
    assert.equal(rec.next_draft, 2);
    assert.match(rec.reason, /structure/);
  });

  it('can recommend a later unit when all units are open', () => {
    const rec = recommendNextTask(prompts, [], 11);
    assert.ok(rec);
    assert.equal(rec.prompt_id, 'p1');
  });

  it('moves to the next unit after the first prompt is fully drafted', () => {
    const attempts: AttemptSummary[] = [1, 2, 3].map((draft) => ({
      prompt_id: 'p1',
      draft_number: draft,
      overall_score: 18,
      scores_breakdown: {
        structure: 4,
        vocabulary: 4,
        audience: 3,
        grammar: 4,
      },
    }));
    const rec = recommendNextTask(prompts, attempts, 11);
    assert.ok(rec);
    assert.equal(rec.module_id, 2);
    assert.equal(rec.next_draft, 1);
    assert.equal(maxDraftForPrompt(attempts, 'p1'), 3);
  });

  it('does not recommend term-review tests as the next practice task', () => {
    const withTest: PromptSummary[] = [
      {
        id: 't1',
        title: 'Term review: The last bus home',
        prompt_type: 'narrative',
        module_id: 1,
        kind: 'test',
      },
      ...prompts,
    ];
    const rec = recommendNextTask(withTest, [], 11);
    assert.ok(rec);
    assert.equal(rec.prompt_id, 'p1');
  });
});

describe('mini drills', () => {
  it('seeds ten drills for each of the eleven units', () => {
    assert.equal(SEED_MINI_DRILLS.length, 110);
    for (let unit = 1; unit <= 11; unit += 1) {
      const inUnit = SEED_MINI_DRILLS.filter((d) => d.module_id === unit);
      assert.equal(inUnit.length, 10, `unit ${unit}`);
      const skills = new Set(inUnit.map((d) => d.skill));
      assert.equal(skills.size, 5, `unit ${unit} skills`);
    }
  });

  it('uses unique slugs and valid answer indexes', () => {
    const slugs = SEED_MINI_DRILLS.map((d) => d.slug);
    assert.equal(new Set(slugs).size, slugs.length);
    for (const drill of SEED_MINI_DRILLS) {
      assert.ok(drill.options.length >= 3, drill.slug);
      assert.ok(
        drill.correct_index >= 0 && drill.correct_index < drill.options.length,
        drill.slug,
      );
    }
  });

  it('marks a matching choice as correct', () => {
    assert.equal(markMiniChoice(1, 1), true);
    assert.equal(markMiniChoice(1, 0), false);
  });
});
