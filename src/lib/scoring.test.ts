import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyDraftMemory,
  applyPhotoTaskMatch,
  detectDraftPolish,
  formatDimensionScore,
  scoreWritingAttemptHeuristic,
  type ScoringResult,
} from './scoring';
import { emptyMarkerNotes } from './marker-notes';
import { stimulusFocusFor } from './stimulus-focus';

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

describe('draft memory', () => {
  it('detects vocabulary polish from the previous draft', () => {
    const polish = detectDraftPolish(
      'Mia got scared, so she hid in her bed. A tree was on the floor. Yesterday it was raining cats and dogs.',
      'Mia felt a jolt of fear, so she hid under her covers. A tree was on the ground. Yesterday it was raining heavily.',
    );
    assert.equal(polish.vocabulary, true);
    assert.equal(polish.vocabularyStrong, true);
  });

  it('raises vocabulary from the previous draft without leaving the basic overall band', () => {
    const previousContent =
      'Mia got scared , so she hid in her bed. A tree was on the floor. She felt sorry for the flowers.';
    const currentContent =
      'Mia felt a jolt of fear, so she hid under her covers. A tree was on the ground. Mia felt a deep sadness for the flowers.';
    const scored = applyDraftMemory(
      sample({
        score_set_a: 10,
        score_set_b: 6,
        overall_score: 16,
        scores_breakdown: { structure: 3, vocabulary: 3, audience: 2, grammar: 3 },
        marker_notes: emptyMarkerNotes(),
      }),
      {
        content: currentContent,
        hintPoints: [],
        promptType: 'narrative',
        draftNumber: 2,
        previousDrafts: [
          {
            draft_number: 1,
            content: previousContent,
            score_set_a: 10,
            score_set_b: 6,
            overall_score: 16,
            scores_breakdown: { structure: 3, vocabulary: 3, audience: 2, grammar: 3 },
          },
        ],
      },
    );
    assert.equal(scored.overall_score, 16);
    assert.equal(scored.score_set_a, 10);
    assert.ok(scored.scores_breakdown.vocabulary >= 4);
    assert.match(scored.marker_notes.strengths.join(' '), /vocabulary mark rose/i);
  });

  it('formats half-point dimension scores for the results page', () => {
    assert.equal(formatDimensionScore(3), '3');
    assert.equal(formatDimensionScore(3.5), '3.5');
    assert.equal(formatDimensionScore(3.51), '3.5');
  });
});

describe('scoreWritingAttemptHeuristic', () => {
  it('names the letterbox and a plan-change when a cleanup story misses the picture', () => {
    const scored = scoreWritingAttemptHeuristic({
      content: [
        'BOOM! A storm was raging outside. Mia got scared, so she hid in her bed.',
        'After breakfast she checked the backyard. Flowers were knocked down by hail.',
        'A tree was on the floor. She swept the road and drove to buy new flowers.',
        'Mia felt happy that she helped the environment.',
      ].join(' '),
      hintPoints: [
        'Show the street after the storm with precise detail',
        'Introduce a discovery that changes the character’s plan',
        'Resolve the discovery without starting a new story',
      ],
      promptType: 'narrative',
      promptTitle: 'After the storm',
      stimulusFocus: stimulusFocusFor('/stimuli/after-the-storm.jpg', 'After the storm'),
    });
    assert.equal(scored.checked_hint_2, false);
    assert.ok(
      scored.marker_notes.annotations.some(
        (row) => row.kind === 'content' && /letterbox/i.test(`${row.issue} ${row.suggestion}`),
      ),
    );
    assert.ok(
      scored.marker_notes.next_steps.some((row) => /envelope/i.test(row) && /plan/i.test(row)),
    );
    assert.equal(/add more detail/i.test(scored.marker_notes.next_steps.join(' ')), false);
  });

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
