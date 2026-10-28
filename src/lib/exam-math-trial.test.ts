import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  EXAM_MATH_TRIAL_MINI_QUESTIONS,
  EXAM_MATH_TRIAL_MINI_SET,
  EXAM_MATH_TRIAL_WARMUP_QUESTIONS,
  EXAM_MATH_TRIAL_WARMUP_SET,
  examMathTrialCatalogue,
  findExamMathSet,
} from './exam-math';
import {
  canStartExamMathTrial,
  examMathTrialOfferCopy,
  hasExamMathProductAccess,
} from './exam-math-trial';
import {
  EXAM_MATH_SOURCE_PHRASE_BLOCKLIST,
  EXAM_MATH_TRIAL_BANK_SIZE,
  buildExamMathBank,
  buildExamMathTrialBank,
} from './exam-math-bank';

describe('Selective Math trial rules', () => {
  it('lasts seven days and offers 10 mixed questions plus a 12-question mini', () => {
    assert.equal(EXAM_MATH_TRIAL_WARMUP_QUESTIONS, 10);
    assert.equal(EXAM_MATH_TRIAL_MINI_QUESTIONS, 12);
    assert.match(examMathTrialOfferCopy(), /10 mixed questions/);
    assert.match(examMathTrialOfferCopy(), /12-question mini exam/);
    assert.equal(hasExamMathProductAccess('trial'), true);
    assert.equal(hasExamMathProductAccess('granted'), true);
    assert.equal(hasExamMathProductAccess('unlicensed'), false);
  });

  it('lets Year 4–7 start a math trial once', () => {
    assert.deepEqual(
      canStartExamMathTrial({ grade: 'Year 5', hadTrial: false, hasPaidAccess: false }),
      { ok: true },
    );
    const kindergarten = canStartExamMathTrial({
      grade: 'Kindergarten',
      hadTrial: false,
      hasPaidAccess: false,
    });
    assert.equal(kindergarten.ok, false);
    const used = canStartExamMathTrial({
      grade: 'Year 5',
      hadTrial: true,
      hasPaidAccess: false,
    });
    assert.equal(used.ok, false);
    const paid = canStartExamMathTrial({
      grade: 'Year 5',
      hadTrial: false,
      hasPaidAccess: true,
    });
    assert.equal(paid.ok, false);
  });
});

describe('Selective Math trial bank', () => {
  const paid = buildExamMathBank();
  const trial = buildExamMathTrialBank();

  it('adds 22 extra trial items with graphs and diagrams', () => {
    assert.equal(EXAM_MATH_TRIAL_BANK_SIZE, 22);
    assert.equal(trial.length, 22);
    assert.equal(examMathTrialCatalogue().length, 2);
    assert.equal(findExamMathSet('trial', EXAM_MATH_TRIAL_WARMUP_SET)?.questionCount, 10);
    assert.equal(findExamMathSet('trial', EXAM_MATH_TRIAL_MINI_SET)?.questionCount, 12);
    assert.equal(trial.filter((item) => item.setNumber === 1).length, 10);
    assert.equal(trial.filter((item) => item.setNumber === 2).length, 12);
    assert.ok(trial.every((item) => item.kind === 'trial'));
    assert.ok(trial.some((item) => item.stimulus?.type === 'bar'));
    assert.ok(trial.some((item) => item.stimulus?.type === 'pie'));
    assert.ok(trial.some((item) => item.stimulus?.type === 'table'));
    assert.ok(trial.some((item) => item.stimulus?.type === 'clock'));
  });

  it('keeps trial stems unique from the paid bank', () => {
    const paidStems = new Set(paid.map((item) => item.stem));
    const trialStems = trial.map((item) => item.stem);
    assert.equal(new Set(trialStems).size, trialStems.length);
    for (const stem of trialStems) {
      assert.equal(paidStems.has(stem), false, stem);
      assert.equal(itemOptionsOk(trial.find((row) => row.stem === stem)!), true, stem);
    }
    const hay = trialStems.join('\n').toLowerCase();
    for (const phrase of EXAM_MATH_SOURCE_PHRASE_BLOCKLIST) {
      assert.equal(hay.includes(phrase), false, phrase);
    }
  });
});

function itemOptionsOk(item: { options: string[]; correctIndex: number }) {
  return item.options.length === 5 && new Set(item.options).size === 5 && item.correctIndex >= 0 && item.correctIndex <= 4;
}
