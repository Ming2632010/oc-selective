import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildWeekNote } from './week-note';

describe('buildWeekNote', () => {
  it('fills last test and next form when present', () => {
    const note = buildWeekNote({
      plot_days: 3,
      focused_minutes: 42,
      lastTest: { title: 'Term review: The last bus home', overall_score: 18 },
      nextFormLabel: 'Explanation',
      nextTitle: 'Why do volcanoes erupt?',
    });
    assert.equal(note.plot_days, 3);
    assert.equal(note.focused_minutes, 42);
    assert.equal(note.last_test_score, 18);
    assert.equal(note.next_form_label, 'Explanation');
  });

  it('allows a week with no test sat yet', () => {
    const note = buildWeekNote({
      plot_days: 0,
      focused_minutes: 0,
      lastTest: null,
      nextFormLabel: null,
      nextTitle: null,
    });
    assert.equal(note.last_test_title, null);
    assert.equal(note.last_test_score, null);
  });
});
