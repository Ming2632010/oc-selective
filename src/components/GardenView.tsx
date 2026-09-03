'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { apiFetch } from '@/lib/client-auth';
import {
  buildSeedPatchScene,
  type GardenPlant,
  type GardenPlantKind,
  type SeedPatchScene,
} from '@/lib/rewards';

type Slot = { left: string; bottom: string; scale: number };

type GardenStats = {
  lifetime_seeds: number;
  scene: SeedPatchScene;
};

const EMPTY_SCENE = buildSeedPatchScene({ lifetimeSeeds: 0 });

const TREE_SLOTS: Slot[] = [
  { left: '9%', bottom: '52%', scale: 1.05 },
  { left: '91%', bottom: '50%', scale: 1.08 },
  { left: '18%', bottom: '60%', scale: 0.9 },
  { left: '82%', bottom: '59%', scale: 0.92 },
  { left: '5%', bottom: '44%', scale: 0.82 },
  { left: '95%', bottom: '43%', scale: 0.84 },
];

const BUSH_SLOTS: Slot[] = [
  { left: '7%', bottom: '32%', scale: 1 },
  { left: '93%', bottom: '31%', scale: 1 },
  { left: '16%', bottom: '38%', scale: 0.88 },
  { left: '84%', bottom: '37%', scale: 0.9 },
  { left: '11%', bottom: '24%', scale: 0.8 },
  { left: '89%', bottom: '23%', scale: 0.8 },
];

const FLOWER_SLOTS: Slot[] = [
  { left: '5%', bottom: '14%', scale: 0.95 },
  { left: '95%', bottom: '15%', scale: 0.95 },
  { left: '12%', bottom: '11%', scale: 1 },
  { left: '88%', bottom: '12%', scale: 1 },
  { left: '20%', bottom: '16%', scale: 0.86 },
  { left: '80%', bottom: '16%', scale: 0.86 },
  { left: '8%', bottom: '22%', scale: 0.78 },
  { left: '92%', bottom: '22%', scale: 0.78 },
  { left: '26%', bottom: '12%', scale: 0.74 },
  { left: '74%', bottom: '12%', scale: 0.74 },
];

const HARVEST_SPRING = { type: 'spring' as const, stiffness: 72, damping: 16, mass: 0.85 };
const SETTLE_SPRING = { type: 'spring' as const, stiffness: 260, damping: 28 };
const RING_SPRING = { type: 'spring' as const, stiffness: 90, damping: 20 };

function slotFor(kind: GardenPlantKind, index: number): Slot {
  const source =
    kind === 'tree' ? TREE_SLOTS : kind === 'bush' ? BUSH_SLOTS : FLOWER_SLOTS;
  return source[index % source.length];
}

function FlowerMark() {
  return (
    <svg viewBox="0 0 48 72" className="h-full w-full overflow-visible" aria-hidden>
      <path d="M24 70 V32" stroke="#5c6754" strokeWidth="1.8" strokeLinecap="round" />
      <ellipse cx="17" cy="48" rx="8" ry="3.5" fill="#6f7d64" transform="rotate(-28 17 48)" />
      <ellipse cx="31" cy="47" rx="8" ry="3.5" fill="#5e6b55" transform="rotate(26 31 47)" />
      <circle cx="24" cy="24" r="8" fill="#cbb8a6" />
      <circle cx="24" cy="24" r="3.2" fill="#8a7362" />
    </svg>
  );
}

function BushMark() {
  return (
    <svg viewBox="0 0 72 56" className="h-full w-full overflow-visible" aria-hidden>
      <ellipse cx="36" cy="42" rx="24" ry="11" fill="#4f5c47" />
      <ellipse cx="22" cy="32" rx="14" ry="12" fill="#5d6b54" />
      <ellipse cx="50" cy="31" rx="14" ry="12" fill="#65735c" />
      <ellipse cx="36" cy="24" rx="15" ry="13" fill="#6e7c64" />
    </svg>
  );
}

function TreeMark() {
  return (
    <svg viewBox="0 0 64 104" className="h-full w-full overflow-visible" aria-hidden>
      <path d="M32 102 V54" stroke="#5c4a3a" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="32" cy="42" rx="20" ry="18" fill="#44513d" />
      <ellipse cx="20" cy="48" rx="12" ry="11" fill="#3d4a38" />
      <ellipse cx="44" cy="48" rx="12" ry="11" fill="#516049" />
      <ellipse cx="32" cy="30" rx="13" ry="11" fill="#5a6851" />
    </svg>
  );
}

function PlantMark({ kind }: { kind: GardenPlantKind }) {
  if (kind === 'tree') return <TreeMark />;
  if (kind === 'bush') return <BushMark />;
  return <FlowerMark />;
}

function PlotSprout({
  percent,
  kind,
}: {
  percent: number;
  kind: GardenPlantKind;
}) {
  if (percent <= 0) {
    return (
      <svg viewBox="0 0 48 16" className="mb-4 h-4 w-14 opacity-70" aria-hidden>
        <ellipse cx="14" cy="9" rx="4" ry="2.2" fill="#6b5340" />
        <ellipse cx="24" cy="10" rx="4.5" ry="2.4" fill="#5a4535" />
        <ellipse cx="34" cy="9" rx="4" ry="2.2" fill="#6b5340" />
      </svg>
    );
  }
  if (percent < 40) {
    return (
      <svg viewBox="0 0 20 36" className="h-[48%] w-auto" aria-hidden>
        <path d="M10 36 V12" stroke="#5c6754" strokeWidth="1.8" strokeLinecap="round" />
        <ellipse cx="10" cy="11" rx="4" ry="6" fill="#7d8b72" />
      </svg>
    );
  }
  const size =
    kind === 'tree' ? 'h-[78%] w-[58%]' : kind === 'bush' ? 'h-[72%] w-[62%]' : 'h-[68%] w-[42%]';
  return (
    <span className={`flex items-end ${size}`}>
      <PlantMark kind={kind} />
    </span>
  );
}

function GardenPlantMotion({
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
  const width =
    plant.kind === 'tree'
      ? 5.6 * slot.scale
      : plant.kind === 'bush'
        ? 4.4 * slot.scale
        : 2.6 * slot.scale;

  return (
    <motion.span
      title={plant.label}
      className="absolute z-[1] origin-bottom -translate-x-1/2"
      style={{ width: `${width}rem` }}
      initial={
        reduceMotion
          ? { left: slot.left, bottom: slot.bottom, opacity: 1, scale: 1 }
          : fromPatch
            ? { left: '50%', bottom: '36%', opacity: 1, scale: 1.12 }
            : { left: slot.left, bottom: slot.bottom, opacity: 0, scale: 0.72 }
      }
      animate={{ left: slot.left, bottom: slot.bottom, opacity: 1, scale: 1 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : fromPatch
            ? HARVEST_SPRING
            : { ...SETTLE_SPRING, delay }
      }
    >
      <motion.span
        className="block origin-bottom"
        animate={reduceMotion ? undefined : { rotate: [-1.8, 1.8, -1.8] }}
        transition={
          reduceMotion
            ? undefined
            : {
                duration: 5.2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: delay + (fromPatch ? 0.6 : 0),
              }
        }
      >
        <PlantMark kind={plant.kind} />
      </motion.span>
      <span className="sr-only">{plant.label}</span>
    </motion.span>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  const reduceMotion = useReducedMotion();
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, percent)) / 100);

  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="#efe8dc"
        strokeWidth="4.5"
      />
      <motion.circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="#3d4f38"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={reduceMotion ? { duration: 0 } : RING_SPRING}
      />
    </svg>
  );
}

export function GardenView({
  studentId,
}: {
  studentId: string | null;
}) {
  const reduceMotion = useReducedMotion();
  const [stats, setStats] = useState<GardenStats | null>(null);
  const [failed, setFailed] = useState(false);
  const knownIds = useRef(new Set<string>());
  const didInit = useRef(false);
  const [harvesting, setHarvesting] = useState<string[]>([]);

  useEffect(() => {
    knownIds.current = new Set();
    didInit.current = false;
    setHarvesting([]);
    setFailed(false);
    let cancelled = false;
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
      const nextScene =
        (res.data.scene as SeedPatchScene | undefined) ??
        buildSeedPatchScene({ lifetimeSeeds: lifetime });
      setStats({ lifetime_seeds: lifetime, scene: nextScene });
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const scene = stats?.scene ?? EMPTY_SCENE;
  const lifetimeSeeds = stats?.lifetime_seeds ?? 0;

  useLayoutEffect(() => {
    if (!stats) return;
    const ids = scene.garden.map((plant) => plant.id);
    if (!didInit.current) {
      ids.forEach((id) => knownIds.current.add(id));
      didInit.current = true;
      return;
    }
    const fresh: string[] = [];
    ids.forEach((id) => {
      if (!knownIds.current.has(id)) fresh.push(id);
      knownIds.current.add(id);
    });
    if (fresh.length) {
      setHarvesting((current) => current.concat(fresh));
    }
  }, [scene.garden, stats]);

  const grouped = useMemo(() => {
    const trees: GardenPlant[] = [];
    const bushes: GardenPlant[] = [];
    const flowers: GardenPlant[] = [];
    scene.garden.forEach((plant) => {
      if (plant.kind === 'tree') trees.push(plant);
      else if (plant.kind === 'bush') bushes.push(plant);
      else flowers.push(plant);
    });
    return { trees, bushes, flowers };
  }, [scene.garden]);

  const nextKind = (
    ['flower', 'bush', 'tree'].includes(scene.active.id)
      ? scene.active.id
      : 'flower'
  ) as GardenPlantKind;
  const remaining = Math.max(0, scene.active.capacity - scene.active.filled);

  function renderGroup(plants: GardenPlant[], kind: GardenPlantKind) {
    return plants.map((plant, index) => (
      <GardenPlantMotion
        key={plant.id}
        plant={plant}
        slot={slotFor(kind, index)}
        fromPatch={harvesting.includes(plant.id)}
        delay={index * 0.05}
        reduceMotion={Boolean(reduceMotion)}
      />
    ));
  }

  return (
    <section data-testid="garden-view" className="overflow-hidden rounded-2xl">
      <h2 className="sr-only">
        Seed Patch · {lifetimeSeeds} seeds · {scene.active.label}
      </h2>
      <div className="relative h-[32rem] overflow-hidden rounded-2xl sm:h-[38rem]">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, #d8ddd4 0%, #e4e2d6 28%, #c5c8b4 46%, #8a9278 68%, #5c6550 100%)',
          }}
        />
        <span
          className="absolute right-[12%] top-[9%] h-10 w-10 rounded-full bg-[#e7dfc8] opacity-80 sm:h-12 sm:w-12"
          aria-hidden
        />
        <span
          className="absolute -left-[14%] top-[30%] h-36 w-[46%] rounded-[100%] bg-[#6a755c]"
          aria-hidden
        />
        <span
          className="absolute -right-[10%] top-[27%] h-40 w-[40%] rounded-[100%] bg-[#5f6b53]"
          aria-hidden
        />
        <span
          className="absolute left-[28%] top-[34%] h-24 w-[32%] rounded-[100%] bg-[#738066]"
          aria-hidden
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[54%]"
          style={{
            background:
              'linear-gradient(180deg, rgba(115,128,102,0.2) 0%, #7a846c 14%, #5d664f 100%)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[26%]"
          style={{
            background:
              'repeating-linear-gradient(90deg, rgba(62,70,50,0.14) 0 8px, rgba(122,132,108,0.08) 8px 16px)',
          }}
        />

        <AnimatePresence>
          {renderGroup(grouped.trees, 'tree')}
          {renderGroup(grouped.bushes, 'bush')}
          {renderGroup(grouped.flowers, 'flower')}
        </AnimatePresence>

        <div className="absolute left-1/2 top-[56%] z-20 -translate-x-1/2 -translate-y-1/2">
          <div className="flex flex-col items-center">
            <p className="mb-3 text-center">
              <span className="block text-[11px] font-medium uppercase tracking-[0.22em] text-stone-600">
                Seed patch
              </span>
              <span className="mt-1 block text-3xl font-medium tabular-nums tracking-tight text-stone-800 sm:text-4xl">
                {stats ? lifetimeSeeds : '—'}
              </span>
            </p>
            <div className="relative h-48 w-48 sm:h-60 sm:w-60">
              <ProgressRing percent={scene.active.percent} />
              <div
                className="absolute inset-[11px] flex flex-col items-center justify-end overflow-hidden rounded-full pb-7 sm:inset-[13px] sm:pb-8"
                style={{
                  background:
                    'radial-gradient(circle at 50% 36%, #8a6a4e 0%, #5c4332 52%, #3f2e24 100%)',
                }}
              >
                <motion.div
                  className="flex h-full w-full items-end justify-center"
                  initial={false}
                  animate={{ scale: 0.92 + (scene.active.percent / 100) * 0.12 }}
                  transition={reduceMotion ? { duration: 0 } : SETTLE_SPRING}
                  style={{ originY: 1 }}
                >
                  <PlotSprout percent={scene.active.percent} kind={nextKind} />
                </motion.div>
              </div>
            </div>
            <p className="mt-3 text-center text-xs tracking-wide text-stone-600">
              {failed
                ? 'Garden is resting'
                : remaining === scene.active.capacity
                  ? 'Sow seeds to grow this plot'
                  : `${remaining} more to harvest`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
