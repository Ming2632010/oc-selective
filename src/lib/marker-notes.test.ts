import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  annotationSegments,
  buildMarkerNotesHeuristic,
  combineRemoteMarkerNotes,
  inferPhotoKind,
  markerNotesFromUnknown,
  normalizeMarkerNotes,
  photoTaskCardCopy,
} from './marker-notes';

describe('buildMarkerNotesHeuristic', () => {
  it('marks spelling, missing apostrophes, and keeps the student’s own sentences for rewrites', () => {
    const content =
      'The gardian opened the gate. I dont stop. Dust hung in the air.';
    const notes = buildMarkerNotesHeuristic({
      content,
      promptType: 'narrative',
      hintPoints: ['Open with a hook and set the scene clearly'],
    });
    const kinds = notes.annotations.map((row) => row.kind);
    assert.ok(kinds.includes('spelling'));
    assert.ok(kinds.includes('punctuation'));
    assert.ok(notes.annotations.some((row) => row.quote.toLowerCase() === 'gardian'));
    assert.ok(notes.rewrites.some((row) => row.original.includes('gardian')));
    assert.match(notes.summary, /Set A/);
    assert.match(notes.summary, /Set B/);
  });

  it('flags a short narrative as under-developed Selective content', () => {
    const content =
      'The handle turned. Dust hung in the air. I ran out with a glowing jar in my pocket.';
    const notes = buildMarkerNotesHeuristic({
      content,
      promptType: 'narrative',
      hintPoints: [
        'Open with a hook and set the scene clearly',
        'Build tension through the middle with vivid detail',
        'Resolve the story with a satisfying or surprising ending',
      ],
    });
    assert.ok(notes.annotations.some((row) => row.kind === 'content'));
    assert.ok(notes.rewrites.length >= 2);
    assert.ok(notes.rewrites[0].improved.length > notes.rewrites[0].original.length);
    const improved = notes.rewrites.map((row) => row.improved);
    assert.equal(new Set(improved).size, improved.length);
    assert.ok(notes.next_steps.some((row) => /hint/i.test(row) || /paragraph/i.test(row) || /160/i.test(row)));
    assert.equal(notes.annotations.filter((row) => row.kind === 'sentence').length <= 1, true);
  });

  it('marks a short empty-seat draft with one content note, exact errors, and one-sentence rewrites', () => {
    const content =
      'I sat down. The seat was empty. I dont know wich way to look. It was very nice and then I got scared. The train moved.';
    const notes = buildMarkerNotesHeuristic({
      content,
      promptType: 'narrative',
      promptTitle: 'The empty seat',
      hintPoints: [
        'Open with a hook and set the scene clearly',
        'Build tension through the middle with vivid detail',
        'Resolve the story with a satisfying or surprising ending',
      ],
    });
    assert.equal(notes.version, 5);
    assert.match(notes.summary, /TrialSeed mark-up/);
    assert.equal(/teacher/i.test(notes.summary), false);
    assert.equal(notes.annotations.filter((row) => row.kind === 'content').length, 1);
    assert.equal(notes.annotations.filter((row) => row.kind === 'sentence').length, 0);
    assert.ok(notes.annotations.some((row) => row.quote.toLowerCase() === 'dont'));
    assert.ok(notes.annotations.some((row) => row.quote.toLowerCase() === 'wich'));
    assert.ok(
      notes.annotations.some((row) => /very nice|nice/i.test(row.quote) && row.kind === 'vocabulary'),
    );
    const look = notes.rewrites.find((row) => /look/i.test(row.original));
    assert.ok(look);
    assert.match(look?.improved ?? '', /don't/i);
    assert.match(look?.improved ?? '', /which/i);
    assert.equal(/\.\s+[A-Z]/.test(look?.improved ?? ''), false);
    assert.equal(new Set(notes.rewrites.map((row) => row.improved)).size, notes.rewrites.length);
    for (const row of notes.rewrites) {
      assert.match(row.improved, /[.!?]$/);
      assert.notEqual(row.improved.toLowerCase(), row.original.toLowerCase());
    }
    const vocabRewrite = notes.rewrites.find((row) => /very nice|got scared/i.test(row.original));
    assert.ok(vocabRewrite);
    assert.match(vocabRewrite?.improved ?? '', /still|calm|fear|froze/i);
    assert.ok(notes.rewrites.some((row) => /sat down on the empty seat/i.test(row.improved)));
    assert.equal(notes.next_steps.filter((row) => /Cover this task hint/i.test(row)).length <= 1, true);
    assert.match(notes.annotations.find((row) => row.kind === 'content')?.suggestion ?? '', /seat|train/i);
  });

  it('rewrites a locked-door sketch from the student’s own lines without a nonsense comparison', () => {
    const content = 'The handle turned. Dust hung in the air. I ran out with a glowing jar in my pocket.';
    const notes = buildMarkerNotesHeuristic({
      content,
      promptType: 'narrative',
      promptTitle: 'The locked door',
    });
    const dust = notes.rewrites.find((row) => /dust/i.test(row.original));
    assert.ok(dust);
    assert.match(dust?.improved ?? '', /Dust hung in the air/i);
    assert.equal(/more than the handle/i.test(dust?.improved ?? ''), false);
  });
});

describe('normalizeMarkerNotes', () => {
  it('attaches quotes to character offsets in the student writing', () => {
    const content = 'The handle turned. Dust hung in the air.';
    const notes = normalizeMarkerNotes(
      {
        summary: 'A marker note.',
        strengths: ['Clear first image'],
        next_steps: ['Add the middle'],
        annotations: [
          {
            kind: 'vocabulary',
            quote: 'turned',
            issue: 'A more precise verb would help.',
            suggestion: 'Try hesitated, or stuck.',
          },
        ],
        rewrites: [
          {
            original: 'The handle turned.',
            improved: 'The handle hesitated, then turned.',
            why: 'Set A rewards a hook.',
            set: 'A',
          },
        ],
      },
      content,
    );
    assert.equal(notes.annotations[0].start, content.indexOf('turned'));
    assert.equal(content.slice(notes.annotations[0].start, notes.annotations[0].end), 'turned');
  });

  it('drops incomplete remote notes', () => {
    const notes = normalizeMarkerNotes({ annotations: [{ kind: 'spelling' }] }, 'Hello.');
    assert.equal(notes.annotations.length, 0);
  });

  it('keeps the question read from a custom-task photo', () => {
    const notes = normalizeMarkerNotes(
      {
        summary: 'The writing did not answer the photo question.',
        photo_question: 'Write a news report about this playground.',
        task_match: 'no',
      },
      'I like pizza.',
    );
    assert.equal(notes.photo_question, 'Write a news report about this playground.');
    assert.equal(notes.task_match, 'no');
  });

  it('keeps a picture-stimulus description from a custom-task photo', () => {
    const notes = normalizeMarkerNotes(
      {
        summary: 'The writing did not use the photo.',
        photo_kind: 'stimulus',
        photo_question: 'A wet playground with empty swings after rain.',
        task_match: 'no',
      },
      'I like pizza.',
    );
    assert.equal(notes.photo_kind, 'stimulus');
    assert.equal(notes.photo_question, 'A wet playground with empty swings after rain.');
    assert.equal(notes.task_match, 'no');
  });
});

describe('markerNotesFromUnknown', () => {
  it('keeps unread photo-match notes even without a copied question', () => {
    const notes = markerNotesFromUnknown({ task_match: 'unread' }, 'I like pizza.');
    assert.equal(notes?.task_match, 'unread');
  });
});

describe('combineRemoteMarkerNotes', () => {
  it('keeps local spelling notes when the model also comments', () => {
    const content = 'The gardian opened the gate.';
    const local = buildMarkerNotesHeuristic({ content, promptType: 'narrative' });
    const combined = combineRemoteMarkerNotes(content, local, {
      summary: 'Model summary.',
      strengths: ['You started in the moment.'],
      rewrites: [
        {
          original: 'The gardian opened the gate.',
          improved: 'The guardian eased the iron gate open.',
          why: 'Correct the spelling and add a precise verb.',
        },
      ],
    });
    assert.equal(combined.summary, 'Model summary.');
    assert.ok(combined.annotations.some((row) => row.kind === 'spelling'));
    assert.equal(combined.rewrites[0].improved.includes('guardian'), true);
  });

  it('keeps the photo question from the remote marker notes', () => {
    const content = 'I like pizza.';
    const local = buildMarkerNotesHeuristic({ content, promptType: 'news_report' });
    const combined = combineRemoteMarkerNotes(content, local, {
      summary: 'The writing did not answer the photo question.',
      photo_question: 'Write a news report about this playground.',
      task_match: 'no',
    });
    assert.equal(combined.photo_question, 'Write a news report about this playground.');
    assert.equal(combined.task_match, 'no');
  });

  it('keeps a picture-stimulus description from the remote marker notes', () => {
    const content = 'I like pizza.';
    const local = buildMarkerNotesHeuristic({ content, promptType: 'narrative' });
    const combined = combineRemoteMarkerNotes(content, local, {
      summary: 'The writing did not use the photo.',
      photo_kind: 'stimulus',
      photo_question: 'A wet playground with empty swings after rain.',
      task_match: 'no',
    });
    assert.equal(combined.photo_kind, 'stimulus');
    assert.equal(combined.photo_question, 'A wet playground with empty swings after rain.');
    assert.equal(combined.task_match, 'no');
  });
});

describe('annotationSegments', () => {
  it('splits the script so highlighted spans keep their note index', () => {
    const content = 'The gardian opened the gate.';
    const notes = buildMarkerNotesHeuristic({ content, promptType: 'narrative' });
    const spelling = notes.annotations.find((row) => row.kind === 'spelling');
    assert.ok(spelling);
    const segments = annotationSegments(content, notes.annotations);
    const marked = segments.find((row) => row.text === 'gardian');
    assert.ok(marked);
    assert.equal(marked?.kind, 'spelling');
    assert.equal(typeof marked?.noteIndex, 'number');
  });

  it('expands a partial-word annotation so rendered markup cannot split a word', () => {
    const content = 'After the Storm';
    const segments = annotationSegments(content, [
      {
        kind: 'punctuation',
        start: 3,
        end: 5,
        quote: 'er',
        issue: 'Test annotation',
        suggestion: 'Test suggestion',
      },
    ]);
    assert.deepEqual(
      segments.map((segment) => segment.text),
      ['After', ' the Storm'],
    );
    assert.equal(segments[0]?.kind, 'punctuation');
  });
});

describe('photoTaskCardCopy', () => {
  it('uses question wording for a photographed written task', () => {
    const card = photoTaskCardCopy({
      photo_kind: 'question',
      photo_question: 'Write a news report about this playground.',
      task_match: 'no',
    });
    assert.equal(card?.heading, 'Question from the photo');
    assert.equal(card?.body, 'Write a news report about this playground.');
    assert.match(card?.verdict?.text ?? '', /does not answer that question/);
  });

  it('uses picture wording when the photo is a stimulus, not a written question', () => {
    const card = photoTaskCardCopy({
      photo_kind: 'stimulus',
      photo_question: 'A wet playground with empty swings after rain.',
      task_match: 'no',
    });
    assert.equal(card?.heading, 'What the photo shows');
    assert.equal(card?.body, 'A wet playground with empty swings after rain.');
    assert.match(card?.verdict?.text ?? '', /not based on that photo/);
  });

  it('treats a scene description as a picture task when photo_kind is missing', () => {
    const card = photoTaskCardCopy({
      photo_question: 'An empty seat on a quiet train, with no one sitting there.',
      task_match: 'no',
    });
    assert.equal(card?.heading, 'What the photo shows');
    assert.match(card?.verdict?.text ?? '', /not based on that photo/);
  });

  it('does not call an unread photo a visible scene', () => {
    const card = photoTaskCardCopy({ task_match: 'unread' });
    assert.equal(card?.heading, 'From the photo');
    assert.match(card?.fallback ?? '', /could not copy a question or describe the picture/);
  });
});

describe('inferPhotoKind', () => {
  it('treats copied task wording as a question and a scene as a stimulus', () => {
    assert.equal(inferPhotoKind('Write a news report about this playground.'), 'question');
    assert.equal(inferPhotoKind('What happened at the night market?'), 'question');
    assert.equal(inferPhotoKind('An empty seat on a quiet train, with no one sitting there.'), 'stimulus');
  });
});
