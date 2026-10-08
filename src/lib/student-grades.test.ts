import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEFAULT_STUDENT_GRADE,
  STUDENT_GRADES,
  programIdForGrade,
  usesMathsDashboard,
  usesWritingDashboard,
} from './student-grades';

describe('student grades', () => {
  it('covers Kindergarten through Year 7', () => {
    assert.deepEqual(STUDENT_GRADES, [
      'Kindergarten',
      'Year 1',
      'Year 2',
      'Year 3',
      'Year 4',
      'Year 5',
      'Year 6',
      'Year 7',
    ]);
    assert.equal(DEFAULT_STUDENT_GRADE, 'Year 5');
  });

  it('maps early years to year programs and keeps writing on Year 4–7', () => {
    assert.equal(programIdForGrade('Kindergarten'), 'k-y1');
    assert.equal(programIdForGrade('Year 1'), 'k-y1');
    assert.equal(programIdForGrade('Year 2'), 'y2');
    assert.equal(usesWritingDashboard('Kindergarten'), false);
    assert.equal(usesWritingDashboard('Year 1'), false);
    assert.equal(usesWritingDashboard('Year 3'), false);
    assert.equal(usesWritingDashboard('Year 4'), true);
    assert.equal(usesWritingDashboard('Year 7'), true);
    assert.equal(usesMathsDashboard('Kindergarten'), true);
    assert.equal(usesMathsDashboard('Year 1'), true);
    assert.equal(usesMathsDashboard('Year 4'), false);
  });
});
