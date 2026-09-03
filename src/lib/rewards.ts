/**
 * Seed Patch — TrialSeed’s writing reward program.
 *
 * Inspired by habit loops (show up daily, celebrate progress) but not a copy
 * of XP, gems, streaks, or leagues. Seeds pay more for real writing and
 * test quality than for tapping through mini questions.
 */

export const REWARD_TZ = 'Australia/Sydney';

export const MINI_DAILY_SEED_CAP = 24;
export const WEEKLY_HARVEST_GOAL = 90;
export const WEEKLY_HARVEST_BONUS = 20;
export const MAX_RAIN_CHEQUES = 2;

export type AwardLine = {
  seeds: number;
  label: string;
};

export type GrowthStage = {
  id: string;
  label: string;
  blurb: string;
  min: number;
  nextAt: number | null;
};

export const GROWTH_STAGES: GrowthStage[] = [
  {
    id: 'sprout',
    label: 'Sprout',
    blurb: 'The first seeds are in.',
    min: 0,
    nextAt: 40,
  },
  {
    id: 'first_leaves',
    label: 'First leaves',
    blurb: 'Mini practice is starting to stick.',
    min: 40,
    nextAt: 120,
  },
  {
    id: 'seedling',
    label: 'Seedling',
    blurb: 'Full tasks are becoming a habit.',
    min: 120,
    nextAt: 280,
  },
  {
    id: 'branching',
    label: 'Branching',
    blurb: 'Revisions and tests are stacking up.',
    min: 280,
    nextAt: 560,
  },
  {
    id: 'in_flower',
    label: 'In flower',
    blurb: 'Strong papers and a steady plot.',
    min: 560,
    nextAt: 1000,
  },
  {
    id: 'harvest',
    label: 'Harvest',
    blurb: 'A writer who shows up and finishes.',
    min: 1000,
    nextAt: null,
  },
];

export const PLOT_MILESTONES: Record<number, { seeds: number; rainCheque: boolean }> =
  {
    3: { seeds: 10, rainCheque: false },
    7: { seeds: 25, rainCheque: true },
    14: { seeds: 45, rainCheque: true },
    30: { seeds: 80, rainCheque: false },
  };

export function calendarDateInSydney(at: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: REWARD_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(at);
}

export function parseYmd(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function daysBetween(from: string, to: string): number {
  return Math.round(
    (parseYmd(to).getTime() - parseYmd(from).getTime()) / 86_400_000,
  );
}

/** Monday of the Sydney week that contains `today` (YYYY-MM-DD). */
export function weekStartSydney(today: string): string {
  const date = parseYmd(today);
  const dow = date.getUTCDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  date.setUTCDate(date.getUTCDate() + mondayOffset);
  return date.toISOString().slice(0, 10);
}

export function growthStage(lifetimeSeeds: number): GrowthStage {
  let current = GROWTH_STAGES[0];
  for (const stage of GROWTH_STAGES) {
    if (lifetimeSeeds >= stage.min) current = stage;
  }
  return current;
}

export type GardenPlantKind = 'stage' | 'week' | 'task';

export type GardenPlant = {
  id: string;
  kind: GardenPlantKind;
  label: string;
};

export type ActivePatchView = {
  id: string;
  label: string;
  blurb: string;
  filled: number;
  capacity: number;
  percent: number;
};

export type SeedPatchScene = {
  active: ActivePatchView;
  garden: GardenPlant[];
};

export function harvestedStages(lifetimeSeeds: number): GrowthStage[] {
  return GROWTH_STAGES.filter(
    (stage) => stage.nextAt !== null && lifetimeSeeds >= stage.nextAt,
  );
}

export function buildSeedPatchScene(input: {
  lifetimeSeeds: number;
  completedTasks?: number;
  weeklyHarvests?: number;
}): SeedPatchScene {
  const stage = growthStage(input.lifetimeSeeds);
  const capacity = stage.nextAt ? stage.nextAt - stage.min : 1;
  const filled = stage.nextAt
    ? Math.max(0, Math.min(capacity, input.lifetimeSeeds - stage.min))
    : capacity;
  const percent = stage.nextAt ? Math.round((filled / capacity) * 100) : 100;

  const garden: GardenPlant[] = harvestedStages(input.lifetimeSeeds).map((row) => ({
    id: `stage-${row.id}`,
    kind: 'stage',
    label: row.label,
  }));

  const weeklyHarvests = Math.max(0, Math.floor(input.weeklyHarvests ?? 0));
  for (let index = 0; index < weeklyHarvests; index += 1) {
    garden.push({
      id: `week-${index + 1}`,
      kind: 'week',
      label: `Week ${index + 1} harvest`,
    });
  }

  const completedTasks = Math.max(0, Math.floor(input.completedTasks ?? 0));
  const taskCap = 18;
  for (let index = 0; index < Math.min(completedTasks, taskCap); index += 1) {
    garden.push({
      id: `task-${index + 1}`,
      kind: 'task',
      label: `Finished task ${index + 1}`,
    });
  }

  return {
    active: {
      id: stage.id,
      label: stage.label,
      blurb: stage.blurb,
      filled,
      capacity,
      percent,
    },
    garden,
  };
}

export function seedsForMini(input: {
  isCorrect: boolean;
  alreadyTried: boolean;
  miniSeedsToday: number;
}): { seeds: number; label: string; capped: boolean } {
  let seeds: number;
  let label: string;

  if (input.alreadyTried) {
    seeds = input.isCorrect ? 1 : 0;
    label = input.isCorrect ? 'Mini retry — correct' : 'Mini retry';
  } else if (input.isCorrect) {
    seeds = 3;
    label = 'Mini practice — correct';
  } else {
    seeds = 1;
    label = 'Mini practice — tried';
  }

  const room = Math.max(0, MINI_DAILY_SEED_CAP - input.miniSeedsToday);
  const awarded = Math.min(seeds, room);
  return {
    seeds: awarded,
    label: awarded < seeds ? `${label} (daily cap)` : label,
    capped: awarded < seeds,
  };
}

export function seedsForWriting(input: {
  kind: 'practice' | 'test';
  draftNumber: number;
  overallScore: number;
  wordCount: number;
  timeSpentSeconds: number;
}): AwardLine[] {
  const lines: AwardLine[] = [];
  const score = Number.isFinite(input.overallScore)
    ? Math.max(0, Math.min(25, Math.round(input.overallScore)))
    : 0;
  const words = Math.max(0, input.wordCount);
  const seconds = Math.max(0, input.timeSpentSeconds);

  if (input.kind === 'test') {
    lines.push({ seeds: 40, label: 'Sat the term review' });
    lines.push({ seeds: score, label: `Paper scored ${score}/25` });
    if (score >= 22) {
      lines.push({ seeds: 15, label: 'Excellent paper (22+)' });
    } else if (score >= 18) {
      lines.push({ seeds: 10, label: 'Strong paper (18+)' });
    }
    if (seconds >= 12 * 60 && words >= 120) {
      lines.push({ seeds: 12, label: 'Exam stamina (12+ minutes)' });
    }
    return lines;
  }

  if (input.draftNumber === 1) {
    lines.push({ seeds: 18, label: 'First draft' });
  } else if (input.draftNumber === 2) {
    lines.push({ seeds: 10, label: 'Revision draft' });
  } else {
    lines.push({ seeds: 12, label: 'Finished all three drafts' });
  }

  if (seconds >= 8 * 60 && words >= 80) {
    lines.push({ seeds: 6, label: 'Focused sitting (8+ minutes)' });
  }

  return lines;
}

export function plotMilestoneAward(plotDays: number): AwardLine | null {
  const milestone = PLOT_MILESTONES[plotDays];
  if (!milestone) return null;
  return {
    seeds: milestone.seeds,
    label:
      plotDays === 1
        ? 'First day on the plot'
        : `${plotDays} days on the plot`,
  };
}

export function nextPlotState(input: {
  plotDays: number;
  lastPlotDate: string | null;
  rainCheques: number;
  today: string;
}): {
  plotDays: number;
  lastPlotDate: string;
  rainCheques: number;
  alreadyCounted: boolean;
  usedCheque: boolean;
  reset: boolean;
  milestone: AwardLine | null;
  gainedCheque: boolean;
} {
  if (input.lastPlotDate === input.today) {
    return {
      plotDays: input.plotDays,
      lastPlotDate: input.today,
      rainCheques: input.rainCheques,
      alreadyCounted: true,
      usedCheque: false,
      reset: false,
      milestone: null,
      gainedCheque: false,
    };
  }

  let plotDays = 1;
  let rainCheques = input.rainCheques;
  let usedCheque = false;
  let reset = false;

  if (input.lastPlotDate) {
    const gap = daysBetween(input.lastPlotDate, input.today);
    if (gap === 1) {
      plotDays = input.plotDays + 1;
    } else if (gap > 1) {
      const missing = gap - 1;
      if (rainCheques >= missing) {
        rainCheques -= missing;
        usedCheque = true;
        plotDays = input.plotDays + 1;
      } else {
        rainCheques = 0;
        plotDays = 1;
        reset = true;
      }
    }
  }

  const milestone = plotMilestoneAward(plotDays);
  let gainedCheque = false;
  if (PLOT_MILESTONES[plotDays]?.rainCheque && rainCheques < MAX_RAIN_CHEQUES) {
    rainCheques += 1;
    gainedCheque = true;
  }

  return {
    plotDays,
    lastPlotDate: input.today,
    rainCheques,
    alreadyCounted: false,
    usedCheque,
    reset,
    milestone,
    gainedCheque,
  };
}

export function harvestBonus(input: {
  weekSeedsBefore: number;
  justEarned: number;
  alreadyClaimed: boolean;
}): AwardLine | null {
  if (input.alreadyClaimed) return null;
  if (input.weekSeedsBefore >= WEEKLY_HARVEST_GOAL) return null;
  if (input.weekSeedsBefore + input.justEarned < WEEKLY_HARVEST_GOAL) return null;
  return {
    seeds: WEEKLY_HARVEST_BONUS,
    label: 'Weekly harvest (90 seeds)',
  };
}

export function sumSeeds(lines: AwardLine[]): number {
  return lines.reduce((total, line) => total + line.seeds, 0);
}

export function focusedSecondsToCount(timeSpentSeconds: number): number {
  return Math.max(0, Math.min(30 * 60, Math.floor(timeSpentSeconds)));
}
