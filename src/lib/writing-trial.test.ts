import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  WRITING_TRIAL_DAYS,
  WRITING_TRIAL_DRAFTS,
  WRITING_TRIAL_FULL_TASKS,
  WRITING_TRIAL_MINI_QUESTIONS,
  canStartWritingTrial,
  clipTrialMiniDrills,
  clipTrialRecommendation,
  hasWritingProductAccess,
  trialAllowsPracticeTask,
  trialDaysLeft,
  trialExpiresAt,
  trialExamLockMessage,
  trialFullTaskLimitMessage,
  trialMiniLimitMessage,
  trialOfferCopy,
  trialStartRequiredMessage,
  writingAccessRequiredMessage,
} from './writing-trial';

describe('writing trial rules', () => {
  it('lasts seven days and allows one full writing task with three attempts', () => {
    assert.equal(WRITING_TRIAL_DAYS, 7);
    assert.equal(WRITING_TRIAL_FULL_TASKS, 1);
    assert.equal(WRITING_TRIAL_DRAFTS, 3);
    assert.equal(WRITING_TRIAL_MINI_QUESTIONS, 10);
    assert.equal(
      trialOfferCopy(),
      '10 mini practice questions and one full writing task with three attempts',
    );
    const start = new Date('2026-09-21T00:00:00Z');
    assert.equal(trialExpiresAt(start).toISOString(), '2026-09-28T00:00:00.000Z');
    assert.equal(trialDaysLeft(new Date('2026-09-28T00:00:00Z'), start), 7);
  });

  it('lets Year 4–7 start a trial once', () => {
    assert.deepEqual(
      canStartWritingTrial({ grade: 'Year 5', hadTrial: false, hasPaidAccess: false }),
      { ok: true },
    );
    const kindergarten = canStartWritingTrial({
      grade: 'Kindergarten',
      hadTrial: false,
      hasPaidAccess: false,
    });
    assert.equal(kindergarten.ok, false);
    if (!kindergarten.ok) assert.match(kindergarten.reason, /Year 4–7/);
    const used = canStartWritingTrial({
      grade: 'Year 5',
      hadTrial: true,
      hasPaidAccess: false,
    });
    assert.equal(used.ok, false);
    if (!used.ok) assert.match(used.reason, /already used/);
    const paid = canStartWritingTrial({
      grade: 'Year 5',
      hadTrial: false,
      hasPaidAccess: true,
    });
    assert.equal(paid.ok, false);
    if (!paid.ok) assert.match(paid.reason, /already has/);
  });

  it('allows only the extra trial paper, keeps its three drafts, and blocks paid unit papers', () => {
    assert.equal(
      trialAllowsPracticeTask({
        promptKind: 'trial',
        alreadyTried: false,
        distinctTried: 0,
      }).ok,
      true,
    );
    assert.equal(
      trialAllowsPracticeTask({
        promptKind: 'trial',
        alreadyTried: true,
        distinctTried: 1,
      }).ok,
      true,
    );
    const paidUnit = trialAllowsPracticeTask({
      promptKind: 'practice',
      alreadyTried: false,
      distinctTried: 0,
    });
    assert.equal(paidUnit.ok, false);
    if (!paidUnit.ok) assert.equal(paidUnit.message, trialExamLockMessage());
    const exam = trialAllowsPracticeTask({
      promptKind: 'test',
      alreadyTried: false,
      distinctTried: 0,
    });
    assert.equal(exam.ok, false);
    const custom = trialAllowsPracticeTask({
      promptKind: 'custom',
      alreadyTried: false,
      distinctTried: 0,
    });
    assert.equal(custom.ok, false);
  });

  it('treats a live trial as product access', () => {
    assert.equal(hasWritingProductAccess('trial'), true);
    assert.equal(hasWritingProductAccess('granted'), true);
    assert.equal(hasWritingProductAccess('unlicensed'), false);
    assert.equal(
      trialStartRequiredMessage(),
      'Start the 7-day trial on the dashboard first.',
    );
    assert.equal(writingAccessRequiredMessage(true), trialStartRequiredMessage());
    assert.equal(
      writingAccessRequiredMessage(false),
      'Selective Writing access is required for this child.',
    );
  });

  it('opens ten mini questions and keeps tried ones after the cap', () => {
    const drills = Array.from({ length: 19 }, (_, index) => ({ id: `d${index + 1}` }));
    assert.deepEqual(
      clipTrialMiniDrills(drills, new Set(), 0).map((row) => row.id),
      Array.from({ length: 10 }, (_, index) => `d${index + 1}`),
    );
    const withTried = clipTrialMiniDrills(drills, new Set(['d1', 'd2']), 2);
    assert.equal(withTried.length, 10);
    assert.ok(withTried.some((row) => row.id === 'd1'));
    assert.ok(withTried.some((row) => row.id === 'd10'));
    assert.equal(
      clipTrialMiniDrills(drills, new Set(['d1']), 10).map((row) => row.id).join(','),
      'd1',
    );
    assert.equal(trialMiniLimitMessage(), 'The trial includes 10 mini questions. Buy a year for mini practice in every unit.');
  });

  it('keeps the started trial paper in the next-task slot and hides a second start', () => {
    assert.equal(
      clipTrialRecommendation(
        { prompt_id: 'started', next_draft: 2 },
        1,
      )?.prompt_id,
      'started',
    );
    assert.equal(
      clipTrialRecommendation(
        { prompt_id: 'fresh', next_draft: 1 },
        1,
      ),
      null,
    );
  });
});
