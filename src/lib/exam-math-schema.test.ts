import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isMissingExamMathTable } from './exam-math-schema';

describe('exam math schema', () => {
  it('recognises a missing exam_math_sittings table', () => {
    assert.equal(
      isMissingExamMathTable(new Error('relation "exam_math_sittings" does not exist')),
      true,
    );
    assert.equal(
      isMissingExamMathTable(
        new Error('Database query failed: relation "exam_math_sittings" does not exist'),
      ),
      true,
    );
    const pgError = Object.assign(new Error('relation "exam_math_sittings" does not exist'), {
      code: '42P01',
    });
    assert.equal(isMissingExamMathTable(pgError), true);
    assert.equal(isMissingExamMathTable(new Error('column "working" does not exist')), false);
    assert.equal(isMissingExamMathTable(new Error('relation "students" does not exist')), false);
  });
});
