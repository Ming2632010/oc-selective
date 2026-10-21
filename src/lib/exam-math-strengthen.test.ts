import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildExamMathBank, makeExamMathFamilyItem } from './exam-math-bank';
import { examMathInstructions, examMathSkillLabel } from './exam-math';
import { nextStrengthenWrongState, strengthenOutcomeCopy } from './exam-math-strengthen';

describe('Selective Math Strengthen rules', () => {
  it('keeps a type open after another miss and closes it after a correct similar item', () => {
    const opened = { timesWrong: 1, similarCorrect: 0, isOpen: true };
    const missedAgain = nextStrengthenWrongState(opened, false);
    assert.equal(missedAgain.isOpen, true);
    assert.equal(missedAgain.timesWrong, 2);
    assert.equal(missedAgain.similarCorrect, 0);
    const cleared = nextStrengthenWrongState(missedAgain, true);
    assert.equal(cleared.isOpen, false);
    assert.equal(cleared.similarCorrect, 1);
    assert.equal(cleared.timesWrong, 2);
    assert.match(strengthenOutcomeCopy(false), /stays on Strengthen/);
    assert.match(strengthenOutcomeCopy(true), /cleared/);
  });

  it('mints a new same-family stem instead of replaying the bank item', () => {
    const bank = buildExamMathBank();
    const used = new Set(bank.map((item) => item.stem));
    const first = makeExamMathFamilyItem({
      familyId: 'straight-angle',
      band: 'foundation',
      usedStems: used,
      seed: 11,
    });
    used.add(first.stem);
    const second = makeExamMathFamilyItem({
      familyId: 'straight-angle',
      band: 'foundation',
      usedStems: used,
      seed: 99,
    });
    assert.equal(first.familyId, 'straight-angle');
    assert.equal(second.familyId, 'straight-angle');
    assert.notEqual(first.stem, second.stem);
    assert.equal(
      bank.some((item) => item.stem === first.stem || item.stem === second.stem),
      false,
    );
    assert.equal(first.options.length, 5);
    assert.match(examMathInstructions('strengthen').heading, /Strengthen/);
    assert.equal(examMathSkillLabel('angles'), 'Angles');
  });
});
