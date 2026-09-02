import {
  MINI_SKILL_LABELS,
  type MiniSkill,
} from '@/lib/seed-mini-drills';
import {
  DIMENSION_LABELS,
  type ScoreDimension,
} from '@/lib/writing-guidance';

export const EXTRA_PACK_SIZE = 3;
export const EXTRA_PER_UNIT_MAX = 12;
export const EXTRA_PER_UNIT_PER_DAY = 6;

export type SkillStat = {
  skill: MiniSkill;
  attempted: number;
  correct: number;
};

export type MiniFocus = {
  skills: MiniSkill[];
  reason: string;
};

export function skillAccuracy(stat: SkillStat): number | null {
  if (stat.attempted <= 0) return null;
  return stat.correct / stat.attempted;
}

export function writingDimToMiniSkill(
  dim: ScoreDimension | null,
): MiniSkill | null {
  if (!dim) return null;
  if (dim === 'grammar') return 'punctuation';
  return dim;
}

function rankedWeak(stats: SkillStat[]) {
  return stats
    .map((stat) => ({ ...stat, accuracy: skillAccuracy(stat) }))
    .filter(
      (stat): stat is SkillStat & { accuracy: number } =>
        stat.accuracy !== null,
    )
    .sort((a, b) => a.accuracy - b.accuracy || b.attempted - a.attempted);
}

function pushSkill(skills: MiniSkill[], skill: MiniSkill) {
  if (!skills.includes(skill) && skills.length < 2) {
    skills.push(skill);
  }
}

/**
 * Choose one or two mini-practice skills from missed questions and
 * recent writing scores. Year 5–6 Selective: format, audience, word
 * choice, punctuation, structure — not extra-hard topics.
 */
export function pickMiniFocus(input: {
  unitLabel: string;
  unitStats: SkillStat[];
  overallStats: SkillStat[];
  writingWeakest: ScoreDimension | null;
}): MiniFocus {
  const skills: MiniSkill[] = [];
  const notes: string[] = [];
  const unitWeak = rankedWeak(input.unitStats).filter((row) => row.accuracy < 0.85);
  const overallWeak = rankedWeak(input.overallStats).filter(
    (row) => row.accuracy < 0.85,
  );
  const fromWriting = writingDimToMiniSkill(input.writingWeakest);

  for (const row of unitWeak) {
    if (skills.length >= 2) break;
    pushSkill(skills, row.skill);
    if (notes.length === 0) {
      notes.push(
        `${MINI_SKILL_LABELS[row.skill]} questions missed in this unit`,
      );
    }
  }

  if (fromWriting) {
    pushSkill(skills, fromWriting);
    if (notes.length === 0 && input.writingWeakest) {
      notes.push(
        `recent writing scores are lowest on ${DIMENSION_LABELS[input.writingWeakest]}`,
      );
    }
  }

  for (const row of overallWeak) {
    if (skills.length >= 2) break;
    pushSkill(skills, row.skill);
    if (notes.length === 0) {
      notes.push(
        `${MINI_SKILL_LABELS[row.skill]} from other mini practice`,
      );
    }
  }

  pushSkill(skills, 'format');
  pushSkill(skills, 'punctuation');

  const labels = skills.map((skill) => MINI_SKILL_LABELS[skill]).join(' and ');
  const why = notes[0] ?? `more ${input.unitLabel.toLowerCase()} practice`;
  return {
    skills,
    reason: `These extras target ${labels} — ${why}.`,
  };
}

export function extraCapacity(existingCount: number, createdToday: number) {
  const remainingUnit = Math.max(0, EXTRA_PER_UNIT_MAX - existingCount);
  const remainingToday = Math.max(
    0,
    Math.min(EXTRA_PER_UNIT_PER_DAY - createdToday, remainingUnit),
  );
  const packSize = Math.min(EXTRA_PACK_SIZE, remainingToday);
  return {
    remaining_unit: remainingUnit,
    remaining_today: remainingToday,
    pack_size: packSize,
    can_generate: packSize > 0,
  };
}

/** Prefer focus skills, then the rest of the unused bank, in sort order. */
export function selectExtraPack<T extends { skill: MiniSkill; sort_order: number }>(
  unused: T[],
  focusSkills: MiniSkill[],
  packSize: number,
): T[] {
  const preferred = unused
    .filter((row) => focusSkills.includes(row.skill))
    .sort((a, b) => a.sort_order - b.sort_order);
  const rest = unused
    .filter((row) => !focusSkills.includes(row.skill))
    .sort((a, b) => a.sort_order - b.sort_order);
  return [...preferred, ...rest].slice(0, packSize);
}
