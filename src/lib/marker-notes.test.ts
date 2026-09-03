import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  annotationSegments,
  buildMarkerNotesHeuristic,
  combineRemoteMarkerNotes,
  normalizeMarkerNotes,
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
});
