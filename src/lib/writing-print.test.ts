import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  formatPrintDate,
  printDocumentTitle,
  printSittingLabel,
} from './writing-print';

describe('printSittingLabel', () => {
  it('names practice drafts and one-sitting papers', () => {
    assert.equal(printSittingLabel({ kind: 'practice', draftNumber: 2 }), 'Draft 2 of 3');
    assert.equal(printSittingLabel({ kind: 'custom', draftNumber: 1 }), 'Custom task · one attempt');
    assert.equal(printSittingLabel({ kind: 'test', draftNumber: 1 }), 'Term review · one sitting');
    assert.equal(
      printSittingLabel({ kind: 'bonus', draftNumber: 1 }),
      'Bonus exam paper · one sitting',
    );
  });
});

describe('formatPrintDate', () => {
  it('prints an Australia/Sydney calendar date', () => {
    assert.equal(formatPrintDate('2026-10-06T12:00:00.000Z'), '6 October 2026');
  });
});

describe('printDocumentTitle', () => {
  it('puts the task, sitting, and TrialSeed in the print file name', () => {
    assert.equal(
      printDocumentTitle({
        taskTitle: 'The empty seat',
        sittingLabel: 'Draft 1 of 3',
      }),
      'The empty seat · Draft 1 of 3 · TrialSeed',
    );
  });
});
