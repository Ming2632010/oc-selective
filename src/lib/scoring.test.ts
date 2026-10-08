import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyPhotoTaskMatch,
  scoreWritingAttemptHeuristic,
  type ScoringResult,
} from './scoring';
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

function setAFromBreakdown(result: ScoringResult) {
  const { structure, vocabulary, audience } = result.scores_breakdown;
  return structure + vocabulary + audience;
}

describe('applyPhotoTaskMatch', () => {
  it('caps Set A when the writing does not answer the photo question', () => {
    const notes = { ...emptyMarkerNotes(), task_match: 'no' as const, photo_question: 'Write about the park.' };
    const scored = applyPhotoTaskMatch(sample({ marker_notes: notes }));
    assert.equal(scored.score_set_a <= 6, true);
    assert.equal(scored.scores_breakdown.audience <= 1, true);
    assert.equal(scored.scores_breakdown.structure <= 3, true);
    assert.equal(scored.scores_breakdown.vocabulary <= 2, true);
    assert.equal(scored.score_set_a <= setAFromBreakdown(scored), true);
    assert.equal(scored.overall_score, scored.score_set_a + scored.score_set_b);
  });

  it('caps Set A and the breakdown when the writing only partly answers the photo question', () => {
    const notes = {
      ...emptyMarkerNotes(),
      task_match: 'partial' as const,
      photo_question: 'Write about the park.',
    };
    const scored = applyPhotoTaskMatch(
      sample({
        marker_notes: notes,
        score_set_a: 13,
        overall_score: 20,
        scores_breakdown: { structure: 5, vocabulary: 5, audience: 5, grammar: 4 },
      }),
    );
    assert.equal(scored.score_set_a <= 10, true);
    assert.equal(scored.scores_breakdown.audience <= 3, true);
    assert.equal(scored.scores_breakdown.structure <= 4, true);
    assert.equal(scored.scores_breakdown.vocabulary <= 3, true);
    assert.equal(scored.score_set_a <= setAFromBreakdown(scored), true);
    assert.equal(scored.overall_score, scored.score_set_a + scored.score_set_b);
  });

  it('leaves scores alone when the writing answers the photo question', () => {
    const notes = { ...emptyMarkerNotes(), task_match: 'yes' as const, photo_question: 'Write about the park.' };
    const scored = applyPhotoTaskMatch(sample({ marker_notes: notes }));
    assert.equal(scored.score_set_a, 12);
    assert.equal(scored.overall_score, 19);
  });

  it('caps Set A when the writing is not based on a stimulus photo', () => {
    const notes = {
      ...emptyMarkerNotes(),
      photo_kind: 'stimulus' as const,
      task_match: 'no' as const,
      photo_question: 'A wet playground with empty swings after rain.',
    };
    const scored = applyPhotoTaskMatch(sample({ marker_notes: notes }));
    assert.equal(scored.score_set_a <= 6, true);
    assert.equal(scored.overall_score, scored.score_set_a + scored.score_set_b);
  });

  it('leaves scores alone when the photo could not be read', () => {
    const notes = { ...emptyMarkerNotes(), task_match: 'unread' as const };
    const scored = applyPhotoTaskMatch(sample({ marker_notes: notes }));
    assert.equal(scored.score_set_a, 12);
    assert.equal(scored.overall_score, 19);
  });
});

describe('scoreWritingAttemptHeuristic', () => {
  it('marks a photo task unread when OpenAI is not available to read the image', () => {
    const scored = scoreWritingAttemptHeuristic({
      content: 'I like pizza and also the park is nice.',
      hintPoints: [],
      promptType: 'news_report',
      promptTitle: 'Photo task',
      promptImage: { mimeType: 'image/jpeg', bytes: Buffer.from('not-a-real-photo') },
    });
    assert.equal(scored.marker_notes.task_match, 'unread');
  });
});
