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

const prompts: PromptSummary[] = [
  { id: 'p1', title: 'The locked door', prompt_type: 'narrative', module_id: 1 },
  { id: 'p2a', title: 'In the future', prompt_type: 'diary_entry', module_id: 2 },
  { id: 'p2b', title: 'Sports carnival day', prompt_type: 'diary_entry', module_id: 2 },
  { id: 'p3', title: 'Chaos on the beach', prompt_type: 'news_report', module_id: 3 },
];

describe('highestUnlockedUnit', () => {
  it('always opens unit 1', () => {
    assert.equal(highestUnlockedUnit([]), 1);
    assert.equal(isUnitUnlocked(1, []), true);
    assert.equal(isUnitUnlocked(2, []), false);
  });

  it('opens the next unit only after earlier ones are finished', () => {
    assert.equal(highestUnlockedUnit([1]), 2);
    assert.equal(highestUnlockedUnit([1, 2]), 3);
    assert.equal(highestUnlockedUnit([2]), 1);
    assert.equal(highestUnlockedUnit([1, 3]), 2);
    assert.equal(highestUnlockedUnit([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 11);
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
    const rec = recommendNextTask(prompts, attempts, 1);
    assert.ok(rec);
    assert.equal(rec.prompt_id, 'p1');
    assert.equal(rec.next_draft, 2);
    assert.match(rec.reason, /structure/);
  });

  it('does not recommend a later unit that is still locked', () => {
    const rec = recommendNextTask(prompts, [], 1);
    assert.ok(rec);
    assert.equal(rec.prompt_id, 'p1');
    assert.equal(rec.module_id, 1);
  });

  it('moves to the next open unit after the first is finished', () => {
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
    const rec = recommendNextTask(prompts, attempts, 2);
    assert.ok(rec);
    assert.equal(rec.module_id, 2);
    assert.equal(rec.next_draft, 1);
    assert.equal(maxDraftForPrompt(attempts, 'p1'), 3);
  });
});
