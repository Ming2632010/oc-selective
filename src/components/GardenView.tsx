'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useReducedMotion,
} from 'framer-motion';
import { apiFetch } from '@/lib/client-auth';
import {
  buildSeedPatchScene,
  type GardenPlant,
  type GardenPlantKind,
  type SeedPatchScene,
} from '@/lib/rewards';

type GardenStats = {
  lifetime_seeds: number;
  scene: SeedPatchScene;
};

type Slot = {
  left: string;
  bottom: string;
  scale: number;
};

const EMPTY_SCENE = buildSeedPatchScene({ lifetimeSeeds: 0 });

const RING_SPRING = { type: 'spring' as const, stiffness: 300, damping: 25 };
const HARVEST_SPRING = { type: 'spring' as const, stiffness: 72, damping: 16 };
/** The new plant rests in the plot for a beat so the harvest reads as a reward. */
const HARVEST_HOLD = 0.45;
const GROWTH_SPRING = { type: 'spring' as const, stiffness: 180, damping: 22 };
const PLANT_STAGGER = 0.05;

/**
 * The plot sits in the middle of the scene, so trees and bushes keep to the
 * sides and only low flowers cross the centre line, in front of the plot.
 */
const TREE_SLOTS: Slot[] = [
  { left: '11%', bottom: '48%', scale: 1.06 },
  { left: '89%', bottom: '47%', scale: 1.04 },
  { left: '22%', bottom: '54%', scale: 0.86 },
  { left: '78%', bottom: '53%', scale: 0.88 },
  { left: '7%', bottom: '40%', scale: 0.8 },
  { left: '93%', bottom: '39%', scale: 0.82 },
];

const BUSH_SLOTS: Slot[] = [
  { left: '10%', bottom: '29%', scale: 1.02 },
  { left: '90%', bottom: '28%', scale: 1 },
  { left: '19%', bottom: '35%', scale: 0.86 },
  { left: '81%', bottom: '34%', scale: 0.88 },
  { left: '28%', bottom: '40%', scale: 0.74 },
  { left: '72%', bottom: '39%', scale: 0.76 },
];

const FLOWER_SLOTS: Slot[] = [
  { left: '14%', bottom: '16%', scale: 1 },
  { left: '86%', bottom: '17%', scale: 0.98 },
  { left: '24%', bottom: '11%', scale: 0.94 },
  { left: '76%', bottom: '12%', scale: 0.92 },
  { left: '8%', bottom: '22%', scale: 0.84 },
  { left: '92%', bottom: '21%', scale: 0.82 },
  { left: '33%', bottom: '6%', scale: 1.02 },
  { left: '67%', bottom: '7%', scale: 1 },
  { left: '45%', bottom: '3%', scale: 0.94 },
  { left: '56%', bottom: '4%', scale: 0.92 },
];

const PLANT_WIDTH_REM: Record<GardenPlantKind, number> = {
  tree: 6,
  bush: 4.8,
  flower: 3.1,
};

const SOIL_SPECKS: Array<{
  left: string;
  top: string;
  size: string;
  opacity: number;
}> = [
  { left: '26%', top: '34%', size: '5px', opacity: 0.4 },
  { left: '68%', top: '28%', size: '4px', opacity: 0.34 },
  { left: '38%', top: '58%', size: '6px', opacity: 0.3 },
  { left: '74%', top: '62%', size: '5px', opacity: 0.36 },
  { left: '18%', top: '68%', size: '4px', opacity: 0.3 },
  { left: '56%', top: '40%', size: '3px', opacity: 0.32 },
  { left: '48%', top: '76%', size: '5px', opacity: 0.26 },
  { left: '82%', top: '44%', size: '3px', opacity: 0.3 },
];

const GRASS_TUFTS: Array<{ left: string; bottom: string; scale: number }> = [
  { left: '3%', bottom: '4%', scale: 1 },
  { left: '15%', bottom: '2%', scale: 0.8 },
  { left: '26%', bottom: '6%', scale: 0.66 },
  { left: '37%', bottom: '2%', scale: 0.9 },
  { left: '48%', bottom: '7%', scale: 0.6 },
  { left: '62%', bottom: '3%', scale: 0.86 },
  { left: '73%', bottom: '6%', scale: 0.7 },
  { left: '85%', bottom: '2%', scale: 0.94 },
  { left: '95%', bottom: '5%', scale: 0.74 },
  { left: '8%', bottom: '11%', scale: 0.56 },
  { left: '55%', bottom: '12%', scale: 0.5 },
  { left: '90%', bottom: '12%', scale: 0.54 },
];

function slotFor(kind: GardenPlantKind, index: number): Slot {
  const source =
    kind === 'tree' ? TREE_SLOTS : kind === 'bush' ? BUSH_SLOTS : FLOWER_SLOTS;
  return source[index % source.length];
}

function kindNoun(kind: GardenPlantKind): string {
  return kind === 'tree' ? 'tree' : kind === 'bush' ? 'bush' : 'flower';
}

/**
 * Plants harvested while the student was on another page should still fly out
 * of the plot when they come back, so the last seen garden is remembered.
 */
function newlyHarvested(studentId: string, plants: GardenPlant[]): string[] {
  const ids = plants.map((plant) => plant.id);
  if (typeof window === 'undefined') return [];
  const key = `trialseed:garden:${studentId}`;
  try {
    const stored = window.sessionStorage.getItem(key);
    window.sessionStorage.setItem(key, JSON.stringify(ids));
    if (!stored) return [];
    const seen = new Set(JSON.parse(stored) as string[]);
    return ids.filter((id) => !seen.has(id));
  } catch {
    return [];
  }
}

function FlowerSprite() {
  return (
    <svg viewBox="0 0 44 78" className="h-full w-full overflow-visible" aria-hidden>
      <ellipse cx="22" cy="75" rx="11" ry="2.6" fill="#2D5A4A" opacity="0.16" />
      <path
        d="M22 75 C21.4 60 21 48 22 34"
        stroke="#4A7A63"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M21 56 C14 54 10 48 9.5 41 C16 42 20.5 47.5 21 56Z" fill="#4A7A63" />
      <path d="M23 48 C30 46 34 40 34.5 33 C28 34 23.5 39.5 23 48Z" fill="#6E9C82" />
      <g>
        {[0, 72, 144, 216, 288].map((angle) => (
          <ellipse
            key={angle}
            cx="22"
            cy="16.5"
            rx="4.6"
            ry="8.4"
            fill="#C49B7A"
            transform={`rotate(${angle} 22 25)`}
          />
        ))}
      </g>
      <circle cx="22" cy="25" r="4.6" fill="#A87356" />
      <circle cx="22" cy="25" r="1.9" fill="#EBD9C4" opacity="0.75" />
    </svg>
  );
}

function BushSprite() {
  return (
    <svg viewBox="0 0 76 60" className="h-full w-full overflow-visible" aria-hidden>
      <ellipse cx="38" cy="56" rx="24" ry="3.4" fill="#2D5A4A" opacity="0.16" />
      <path
        d="M38 56 C33 48 30 42 29 36 M38 56 C43 49 46 43 47 37"
        stroke="#4A7A63"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="21" cy="36" rx="14" ry="13" fill="#3F6E58" />
      <ellipse cx="55" cy="35" rx="14" ry="13" fill="#4A7A63" />
      <ellipse cx="38" cy="41" rx="17" ry="14" fill="#456F5A" />
      <ellipse cx="30" cy="26" rx="12" ry="11" fill="#5F8A75" />
      <ellipse cx="47" cy="25" rx="11" ry="10" fill="#6E9C82" />
      <ellipse cx="38" cy="19" rx="9" ry="8" fill="#7FA890" />
      <path
        d="M30 30 C33 26 36 24 40 23"
        stroke="#2D5A4A"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.35"
        fill="none"
      />
    </svg>
  );
}

function TreeSprite() {
  return (
    <svg viewBox="0 0 72 114" className="h-full w-full overflow-visible" aria-hidden>
      <ellipse cx="36" cy="110" rx="19" ry="3.6" fill="#2D5A4A" opacity="0.18" />
      <path
        d="M36 110 C36 96 36 84 36 70"
        stroke="#7A5A42"
        strokeWidth="5.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M36 82 C32 79 29 76 27 72 M36 77 C40 74 43 71 45 68"
        stroke="#7A5A42"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="36" cy="60" rx="26" ry="18" fill="#2D5A4A" />
      <ellipse cx="18" cy="49" rx="16" ry="14" fill="#3F6E58" />
      <ellipse cx="54" cy="48" rx="16" ry="14" fill="#456F5A" />
      <ellipse cx="36" cy="36" rx="20" ry="17" fill="#4A7A63" />
      <ellipse cx="28" cy="25" rx="11" ry="10" fill="#5F8A75" />
      <ellipse cx="46" cy="28" rx="10" ry="9" fill="#6E9C82" />
    </svg>
  );
}

function SproutSprite() {
  return (
    <svg viewBox="0 0 40 44" className="h-full w-full overflow-visible" aria-hidden>
      <path
        d="M20 43 C19.6 34 19.6 28 20 21"
        stroke="#6E9C82"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M19 30 C12 28 8 23 8 17 C14 18 18.4 22.5 19 30Z" fill="#5F8A75" />
      <path d="M21 27 C28 25 32 20 32 14 C26 15 21.6 19.5 21 27Z" fill="#7FA890" />
    </svg>
  );
}

function SeedbedSprite() {
  return (
    <svg viewBox="0 0 48 18" className="h-full w-full overflow-visible" aria-hidden>
      <ellipse cx="12" cy="11" rx="4.2" ry="2.4" fill="#8A6647" />
      <ellipse cx="24" cy="12" rx="4.6" ry="2.6" fill="#9C7454" />
      <ellipse cx="36" cy="11" rx="4.2" ry="2.4" fill="#8A6647" />
    </svg>
  );
}

function PlantSprite({ kind }: { kind: GardenPlantKind }) {
  if (kind === 'tree') return <TreeSprite />;
  if (kind === 'bush') return <BushSprite />;
  return <FlowerSprite />;
}

function GrassTuft() {
  return (
    <svg viewBox="0 0 32 20" className="h-full w-full overflow-visible" aria-hidden>
      <path
        d="M4 20 C6 13 8 9 7 4 M11 20 C12 12 13 8 14 3 M18 20 C18 13 20 9 21 5 M25 20 C25 14 27 10 28 6"
        stroke="#5F8A75"
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function GardenBackdrop() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #F7F5F0 0%, #F4F5EE 34%, #EEF2E8 52%, #E6EEE1 62%)',
        }}
      />
      <div
        className="absolute right-[10%] top-[6%] h-24 w-24 rounded-full sm:h-32 sm:w-32"
        style={{
          background:
            'radial-gradient(circle, rgba(240,223,200,0.95) 0%, rgba(240,223,200,0.5) 42%, rgba(240,223,200,0) 72%)',
        }}
        aria-hidden
      />

      <span
        className="absolute -left-[14%] bottom-[30%] h-[30%] w-[72%] rounded-[100%] bg-[#D2E0CE]"
        aria-hidden
      />
      <span
        className="absolute -right-[16%] bottom-[29%] h-[32%] w-[68%] rounded-[100%] bg-[#C8D9C4]"
        aria-hidden
      />
      <span
        className="absolute left-[20%] bottom-[34%] h-[22%] w-[60%] rounded-[100%] bg-[#BFD4BB]"
        aria-hidden
      />

      <div
        className="absolute inset-x-0 bottom-0 h-[46%]"
        style={{
          background:
            'linear-gradient(180deg, #B4CDB2 0%, #A4C4A6 32%, #91B79A 66%, #7FAA8C 100%)',
        }}
        aria-hidden
      />
      <div
        className="absolute inset-x-0 bottom-[40%] h-[10%]"
        style={{
          background:
            'linear-gradient(180deg, rgba(180,205,178,0) 0%, rgba(180,205,178,0.85) 70%)',
        }}
        aria-hidden
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[30%]"
        style={{
          background:
            'radial-gradient(120% 80% at 20% 100%, rgba(45,90,74,0.14) 0%, rgba(45,90,74,0) 60%), radial-gradient(110% 70% at 82% 100%, rgba(45,90,74,0.12) 0%, rgba(45,90,74,0) 62%)',
        }}
        aria-hidden
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[12%]"
        style={{
          background: 'linear-gradient(180deg, rgba(45,90,74,0) 0%, rgba(45,90,74,0.16) 100%)',
        }}
        aria-hidden
      />

      {GRASS_TUFTS.map((tuft) => (
        <span
          key={`${tuft.left}-${tuft.bottom}`}
          className="absolute z-[1] -translate-x-1/2 opacity-45"
          style={{
            left: tuft.left,
            bottom: tuft.bottom,
            width: `calc(${2.3 * tuft.scale}rem * var(--plant-scale, 1))`,
          }}
          aria-hidden
        >
          <GrassTuft />
        </span>
      ))}
    </>
  );
}

function GrownPlant({
  plant,
  slot,
  fromPatch,
  delay,
  reduceMotion,
}: {
  plant: GardenPlant;
  slot: Slot;
  fromPatch: boolean;
  delay: number;
  reduceMotion: boolean;
}) {
  const width = `calc(${PLANT_WIDTH_REM[plant.kind] * slot.scale}rem * var(--plant-scale, 1))`;
  const resting = { left: slot.left, bottom: slot.bottom, opacity: 1, scale: 1 };

  return (
    <motion.span
      className="absolute origin-bottom -translate-x-1/2"
      style={{ width, zIndex: fromPatch ? 30 : 2 }}
      initial={
        reduceMotion
          ? resting
          : fromPatch
            ? { left: '50%', bottom: '32%', opacity: 1, scale: 1.15 }
            : { left: slot.left, bottom: slot.bottom, opacity: 0, scale: 0.7 }
      }
      animate={resting}
      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.8 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : fromPatch
            ? { ...HARVEST_SPRING, delay: HARVEST_HOLD }
            : { ...GROWTH_SPRING, delay }
      }
    >
      <motion.span
        className="block origin-bottom"
        animate={reduceMotion ? undefined : { rotate: [-1.6, 1.6, -1.6] }}
        transition={
          reduceMotion
            ? undefined
            : {
                duration: 5.4 + slot.scale,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: fromPatch ? HARVEST_HOLD + 0.8 : delay,
              }
        }
      >
        <PlantSprite kind={plant.kind} />
      </motion.span>
      <span className="sr-only">{plant.label}</span>
    </motion.span>
  );
}

function ProgressRing({
  percent,
  reduceMotion,
}: {
  percent: number;
  reduceMotion: boolean;
}) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = circumference * (1 - clamped / 100);

  return (
    <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full -rotate-90">
      <circle cx="60" cy="60" r={radius} fill="none" stroke="#EFE7D9" strokeWidth="8" />
      <circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke="#2D5A4A"
        strokeWidth="8"
        opacity="0.1"
      />
      <motion.circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke="#C49B7A"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={reduceMotion ? { duration: 0 } : RING_SPRING}
      />
      <circle
        cx="60"
        cy="60"
        r={radius - 5.5}
        fill="none"
        stroke="#2D5A4A"
        strokeWidth="0.8"
        opacity="0.18"
      />
    </svg>
  );
}

function PlotSprout({
  percent,
  kind,
  reduceMotion,
}: {
  percent: number;
  kind: GardenPlantKind;
  reduceMotion: boolean;
}) {
  const stage = percent < 10 ? 'seedbed' : percent < 40 ? 'sprout' : 'plant';
  const height =
    stage === 'seedbed' ? 'h-[14%]' : stage === 'sprout' ? 'h-[44%]' : 'h-[76%]';
  const width =
    stage === 'seedbed' ? 'w-[54%]' : stage === 'sprout' ? 'w-[34%]' : 'w-[66%]';

  return (
    <motion.div
      className={`flex items-end justify-center ${height} ${width}`}
      style={{ originY: 1 }}
      initial={false}
      animate={{ scale: 0.72 + (Math.min(100, percent) / 100) * 0.28 }}
      transition={reduceMotion ? { duration: 0 } : GROWTH_SPRING}
    >
      {stage === 'seedbed' ? (
        <SeedbedSprite />
      ) : stage === 'sprout' ? (
        <SproutSprite />
      ) : (
        <PlantSprite kind={kind} />
      )}
    </motion.div>
  );
}

export function GardenView({ studentId }: { studentId: string | null }) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [stats, setStats] = useState<GardenStats | null>(null);
  const [harvestIds, setHarvestIds] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);
  const pulse = useAnimationControls();
  const lastPercent = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    setHarvestIds([]);
    lastPercent.current = null;

    async function load() {
      if (!studentId) {
        setStats({ lifetime_seeds: 0, scene: EMPTY_SCENE });
        return;
      }
      const res = await apiFetch(
        `/api/dashboard/stats?student_id=${encodeURIComponent(studentId)}`,
      );
      if (cancelled) return;
      if (!res.response.ok) {
        setFailed(true);
        setStats({ lifetime_seeds: 0, scene: EMPTY_SCENE });
        return;
      }
      const lifetime = Number(res.data.lifetime_seeds ?? 0);
      const scene =
        (res.data.scene as SeedPatchScene | undefined) ??
        buildSeedPatchScene({ lifetimeSeeds: lifetime });
      setStats({ lifetime_seeds: lifetime, scene });
      setHarvestIds(newlyHarvested(studentId, scene.garden));
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const scene = stats?.scene ?? EMPTY_SCENE;
  const lifetimeSeeds = stats?.lifetime_seeds ?? 0;
  const percent = scene.active.percent;

  useEffect(() => {
    if (!stats) return;
    if (lastPercent.current === null) {
      lastPercent.current = percent;
      return;
    }
    if (lastPercent.current === percent) return;
    lastPercent.current = percent;
    if (!reduceMotion) {
      void pulse.start({ scale: [1, 1.04, 1] }, { duration: 0.6, ease: 'easeOut' });
    }
  }, [percent, pulse, reduceMotion, stats]);

  const grouped = useMemo(() => {
    const trees: GardenPlant[] = [];
    const bushes: GardenPlant[] = [];
    const flowers: GardenPlant[] = [];
    for (const plant of scene.garden) {
      if (plant.kind === 'tree') trees.push(plant);
      else if (plant.kind === 'bush') bushes.push(plant);
      else flowers.push(plant);
    }
    return { trees, bushes, flowers };
  }, [scene.garden]);

  const nextKind: GardenPlantKind = (
    ['flower', 'bush', 'tree'] as const
  ).includes(scene.active.id as GardenPlantKind)
    ? (scene.active.id as GardenPlantKind)
    : 'flower';
  const remaining = Math.max(0, scene.active.capacity - scene.active.filled);

  function renderPlants(plants: GardenPlant[], kind: GardenPlantKind) {
    return plants.map((plant, index) => (
      <GrownPlant
        key={plant.id}
        plant={plant}
        slot={slotFor(kind, index)}
        fromPatch={harvestIds.includes(plant.id)}
        delay={index * PLANT_STAGGER}
        reduceMotion={reduceMotion}
      />
    ));
  }

  const caption = failed
    ? 'The garden is resting — progress will load again soon.'
    : remaining === scene.active.capacity
      ? `Sow seeds to raise a new ${kindNoun(nextKind)}`
      : `${remaining} more seed${remaining === 1 ? '' : 's'} to harvest this ${kindNoun(nextKind)}`;

  return (
    <section
      data-testid="garden-view"
      className="font-inter overflow-hidden rounded-3xl border border-[#2D5A4A]/10 shadow-[0_18px_44px_-28px_rgba(45,90,74,0.55)]"
    >
      <h2 className="sr-only">
        Garden · {lifetimeSeeds} seeds · {scene.garden.length} plants harvested ·{' '}
        {percent}% toward the next {kindNoun(nextKind)}
      </h2>
      <div
        className="relative h-[27rem] overflow-hidden [--plant-scale:0.66] sm:h-[31rem] sm:[--plant-scale:0.85] lg:h-[34rem] lg:[--plant-scale:1]"
        style={{ backgroundColor: '#F7F5F0' }}
      >
        <GardenBackdrop />

        <AnimatePresence>
          {renderPlants(grouped.trees, 'tree')}
          {renderPlants(grouped.bushes, 'bush')}
          {renderPlants(grouped.flowers, 'flower')}
        </AnimatePresence>

        <motion.div
          className="absolute left-1/2 top-[55%] z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          animate={pulse}
        >
          <p className="flex items-baseline gap-2 leading-none">
            <span
              className="text-[2.1rem] tabular-nums text-[#3D352E] sm:text-[2.6rem] lg:text-[3rem]"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {stats ? lifetimeSeeds : '—'}
            </span>
            <span
              className="text-lg text-[#3D352E]/65 sm:text-xl"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              seeds
            </span>
          </p>

          <div
            className="relative mt-3 h-44 w-44 rounded-full sm:h-52 sm:w-52 lg:h-60 lg:w-60"
            style={{ boxShadow: '0 24px 38px -20px rgba(45,90,74,0.6)' }}
          >
            <ProgressRing percent={percent} reduceMotion={reduceMotion} />
            <div
              className="absolute inset-[11%] flex items-end justify-center overflow-hidden rounded-full pb-[13%]"
              style={{
                background:
                  'radial-gradient(circle at 50% 22%, #9E7855 0%, #86603F 42%, #6B4C2F 78%, #563C25 100%)',
                boxShadow: 'inset 0 8px 16px rgba(61,53,46,0.34)',
              }}
            >
              {SOIL_SPECKS.map((speck) => (
                <span
                  key={`${speck.left}-${speck.top}`}
                  className="absolute rounded-full bg-[#3D2A1A]"
                  style={{
                    left: speck.left,
                    top: speck.top,
                    width: speck.size,
                    height: speck.size,
                    opacity: speck.opacity,
                  }}
                  aria-hidden
                />
              ))}
              <span
                className="absolute inset-x-[18%] bottom-[13%] h-[9%] rounded-[100%]"
                style={{
                  background:
                    'radial-gradient(60% 100% at 50% 100%, #8A6647 0%, rgba(138,102,71,0) 78%)',
                }}
                aria-hidden
              />
              <PlotSprout
                percent={percent}
                kind={nextKind}
                reduceMotion={reduceMotion}
              />
            </div>
          </div>

          <p
            className={`mt-4 max-w-[16rem] text-center text-[0.8rem] font-medium leading-snug sm:text-sm ${
              percent >= 80 && !failed ? 'text-[#A6714A]' : 'text-[#3D352E]/85'
            }`}
          >
            {caption}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
