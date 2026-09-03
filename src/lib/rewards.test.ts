import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  calendarDateInSydney,
  daysBetween,
  buildSeedPatchScene,
  growthStage,
  harvestBonus,
  nextPlotState,
  seedsForMini,
  seedsForWriting,
  sumSeeds,
  weekStartSydney,
} from './rewards';

describe('calendar helpers', () => {
  it('formats a Sydney calendar date as YYYY-MM-DD', () => {
    const date = calendarDateInSydney(new Date('2026-08-31T02:00:00.000Z'));
    assert.match(date, /^\d{4}-\d{2}-\d{2}$/);
  });

  it('starts the week on Monday', () => {
    assert.equal(weekStartSydney('2026-08-31'), '2026-08-31');
    assert.equal(weekStartSydney('2026-09-02'), '2026-08-31');
    assert.equal(weekStartSydney('2026-09-06'), '2026-08-31');
    assert.equal(weekStartSydney('2026-09-07'), '2026-09-07');
  });

  it('counts calendar days between dates', () => {
    assert.equal(daysBetween('2026-08-31', '2026-09-02'), 2);
  });
});

describe('seedsForMini', () => {
  it('pays a small first-try bonus and a try credit', () => {
    assert.equal(
      seedsForMini({ isCorrect: true, alreadyTried: false, miniSeedsToday: 0 })
        .seeds,
      3,
    );
    assert.equal(
      seedsForMini({ isCorrect: false, alreadyTried: false, miniSeedsToday: 0 })
        .seeds,
      1,
    );
  });

  it('shrinks repeats so mini questions cannot be farmed', () => {
    assert.equal(
      seedsForMini({ isCorrect: true, alreadyTried: true, miniSeedsToday: 0 })
        .seeds,
      1,
    );
    assert.equal(
      seedsForMini({ isCorrect: false, alreadyTried: true, miniSeedsToday: 0 })
        .seeds,
      0,
    );
  });

  it('caps mini seeds at 24 a day', () => {
    const award = seedsForMini({
      isCorrect: true,
      alreadyTried: false,
      miniSeedsToday: 23,
    });
    assert.equal(award.seeds, 1);
    assert.equal(award.capped, true);
  });
});

describe('seedsForWriting', () => {
  it('pays more for a term review than a practice draft', () => {
    const testAward = sumSeeds(
      seedsForWriting({
        kind: 'test',
        draftNumber: 1,
        overallScore: 10,
        wordCount: 50,
        timeSpentSeconds: 60,
      }),
    );
    const practice = sumSeeds(
      seedsForWriting({
        kind: 'practice',
        draftNumber: 1,
        overallScore: 10,
        wordCount: 50,
        timeSpentSeconds: 60,
      }),
    );
    assert.equal(practice, 18);
    assert.ok(testAward > practice);
    assert.equal(testAward, 50);
  });

  it('adds score, quality, and stamina lines on a strong timed test', () => {
    const lines = seedsForWriting({
      kind: 'test',
      draftNumber: 1,
      overallScore: 22,
      wordCount: 180,
      timeSpentSeconds: 15 * 60,
    });
    const labels = lines.map((line) => line.label);
    assert.ok(labels.some((label) => label.includes('Excellent')));
    assert.ok(labels.some((label) => label.includes('Exam stamina')));
    assert.equal(sumSeeds(lines), 40 + 22 + 15 + 12);
  });

  it('rewards a focused practice sitting, not a rushed one', () => {
    const focused = seedsForWriting({
      kind: 'practice',
      draftNumber: 1,
      overallScore: 16,
      wordCount: 120,
      timeSpentSeconds: 9 * 60,
    });
    const rushed = seedsForWriting({
      kind: 'practice',
      draftNumber: 1,
      overallScore: 16,
      wordCount: 120,
      timeSpentSeconds: 90,
    });
    assert.equal(sumSeeds(focused), 24);
    assert.equal(sumSeeds(rushed), 18);
  });
});

describe('nextPlotState', () => {
  it('starts a plot on the first writing day', () => {
    const next = nextPlotState({
      plotDays: 0,
      lastPlotDate: null,
      rainCheques: 0,
      today: '2026-08-31',
    });
    assert.equal(next.plotDays, 1);
    assert.equal(next.reset, false);
  });

  it('continues yesterday and pays the 3-day milestone', () => {
    const next = nextPlotState({
      plotDays: 2,
      lastPlotDate: '2026-08-30',
      rainCheques: 0,
      today: '2026-08-31',
    });
    assert.equal(next.plotDays, 3);
    assert.equal(next.milestone?.seeds, 10);
  });

  it('uses a rain cheque to cover one missed day', () => {
    const next = nextPlotState({
      plotDays: 6,
      lastPlotDate: '2026-08-29',
      rainCheques: 1,
      today: '2026-08-31',
    });
    assert.equal(next.plotDays, 7);
    assert.equal(next.usedCheque, true);
    assert.equal(next.rainCheques, 1);
    assert.equal(next.gainedCheque, true);
    assert.equal(next.milestone?.seeds, 25);
  });

  it('resets after a gap with no rain cheque', () => {
    const next = nextPlotState({
      plotDays: 9,
      lastPlotDate: '2026-08-28',
      rainCheques: 0,
      today: '2026-08-31',
    });
    assert.equal(next.plotDays, 1);
    assert.equal(next.reset, true);
  });

  it('does not double-count the same Sydney day', () => {
    const next = nextPlotState({
      plotDays: 4,
      lastPlotDate: '2026-08-31',
      rainCheques: 1,
      today: '2026-08-31',
    });
    assert.equal(next.alreadyCounted, true);
    assert.equal(next.plotDays, 4);
    assert.equal(next.milestone, null);
  });
});

describe('harvestBonus and growth', () => {
  it('pays the weekly harvest once when the 90-seed goal is crossed', () => {
    const bonus = harvestBonus({
      weekSeedsBefore: 80,
      justEarned: 18,
      alreadyClaimed: false,
    });
    assert.equal(bonus?.seeds, 20);
    assert.equal(
      harvestBonus({
        weekSeedsBefore: 90,
        justEarned: 10,
        alreadyClaimed: false,
      }),
      null,
    );
  });

  it('maps lifetime seeds onto garden stages', () => {
    assert.equal(growthStage(0).id, 'sprout');
    assert.equal(growthStage(40).id, 'first_leaves');
    assert.equal(growthStage(1000).id, 'harvest');
    assert.equal(growthStage(999).nextAt, 1000);
  });

  it('keeps only the current patch active and moves finished stages into the garden', () => {
    const empty = buildSeedPatchScene({ lifetimeSeeds: 0, completedTasks: 0 });
    assert.equal(empty.active.id, 'sprout');
    assert.equal(empty.active.percent, 0);
    assert.equal(empty.garden.length, 0);

    const mid = buildSeedPatchScene({ lifetimeSeeds: 80, completedTasks: 2, weeklyHarvests: 1 });
    assert.equal(mid.active.id, 'first_leaves');
    assert.equal(mid.active.filled, 40);
    assert.equal(mid.active.capacity, 80);
    assert.equal(mid.active.percent, 50);
    assert.ok(mid.garden.some((plant) => plant.id === 'stage-sprout'));
    assert.equal(mid.garden.filter((plant) => plant.kind === 'task').length, 2);
    assert.equal(mid.garden.filter((plant) => plant.kind === 'week').length, 1);
    assert.equal(mid.garden.some((plant) => plant.id === 'stage-first_leaves'), false);
  });
});
