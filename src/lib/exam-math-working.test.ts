import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildExamMathBank, buildExamMathTrialBank } from './exam-math-bank';
import {
  attachAnswerWorking,
  completeWorking,
  parseExamMathWorking,
  workingHasFigure,
} from './exam-math-working';

describe('Selective Math working helpers', () => {
  it('parses steps and keeps nested tables', () => {
    const parsed = parseExamMathWorking([
      {
        heading: 'Method',
        body: 'Add the parts.',
        stimulus: {
          type: 'table',
          caption: 'Parts',
          headers: ['Part', 'Value'],
          rows: [
            ['A', '2'],
            ['B', '3'],
          ],
        },
      },
    ]);
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0]?.heading, 'Method');
    assert.equal(parsed[0]?.stimulus?.type, 'table');
    assert.equal(parseExamMathWorking(null).length, 0);
  });

  it('adds a letter-check table as the last step', () => {
    const working = attachAnswerWorking(
      [{ heading: 'Method', body: 'Multiply first.' }],
      ['12', '14', '16', '18', '20'],
      2,
    );
    assert.equal(working.at(-1)?.heading, 'The answer');
    assert.match(working.at(-1)?.body ?? '', /C: 16/);
    assert.equal(working.at(-1)?.stimulus?.type, 'table');
    assert.equal(workingHasFigure(working), true);
  });

  it('falls back to the short explanation when method steps are missing', () => {
    const working = completeWorking({
      options: ['A', 'B', 'C', 'D', 'E'],
      correctIndex: 0,
      explanation: 'Add 3 each time.',
    });
    assert.equal(working[0]?.heading, 'Method');
    assert.equal(working[0]?.body, 'Add 3 each time.');
    assert.equal(working[1]?.heading, 'The answer');
  });
});

describe('Selective Math full method write-ups', () => {
  const bank = [...buildExamMathBank(), ...buildExamMathTrialBank()];

  it('gives every item numbered working with a graph or table', () => {
    for (const item of bank) {
      assert.ok(item.working.length >= 2, item.familyId);
      assert.equal(item.working.at(-1)?.heading, 'The answer', item.familyId);
      assert.ok(workingHasFigure(item.working), item.familyId);
      assert.ok(
        item.working.some((step) => step.heading !== 'The answer' && step.stimulus),
        item.familyId,
      );
    }
  });
});
