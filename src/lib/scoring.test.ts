import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { applyPhotoTaskMatch, type ScoringResult } from './scoring';
import { emptyMarkerNotes } from './marker-notes';

function sample(result: Partial<ScoringResult> & Pick<ScoringResult, 'marker_notes'>): ScoringResult {
  return {
    score_set_a: 12,
    score_set_b: 7,
    overall_score: 19,
    scores_breakdown: { structure: 4, vocabulary: 4, audience: 4, grammar: 4 },
    ai_feedback: 'ok',
    checked_hint_1: false,
    checked_hint_2: false,
    checked_hint_3: false,
    word_count: 40,
    ...result,
  };
}

describe('applyPhotoTaskMatch', () => {
  it('caps Set A when the writing does not answer the photo question', () => {
    const notes = { ...emptyMarkerNotes(), task_match: 'no' as const, photo_question: 'Write about the park.' };
    const scored = applyPhotoTaskMatch(sample({ marker_notes: notes }));
    assert.equal(scored.score_set_a <= 6, true);
    assert.equal(scored.scores_breakdown.audience <= 1, true);
    assert.equal(scored.overall_score, scored.score_set_a + scored.score_set_b);
  });

  it('leaves scores alone when the writing answers the photo question', () => {
    const notes = { ...emptyMarkerNotes(), task_match: 'yes' as const, photo_question: 'Write about the park.' };
    const scored = applyPhotoTaskMatch(sample({ marker_notes: notes }));
    assert.equal(scored.score_set_a, 12);
    assert.equal(scored.overall_score, 19);
  });
});
