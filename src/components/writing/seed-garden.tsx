import {
  GROWTH_STAGES,
  gardenBedStages,
  gardenSeedCount,
  growthStageIndex,
} from '@/lib/rewards';

type StageId = (typeof GROWTH_STAGES)[number]['id'];

/** Shape Green — leaf sage from the botanical painting, used on seed bars. */
export const SHAPE_GREEN = '#4F7A3A';
export const SHAPE_GREEN_TRACK = '#E3EDDA';
export const SHAPE_GREEN_SOFT = '#F1F5EA';

const PLANTER_SRC = [
  '/marketing/seed-patch/planter-sprout.png',
  '/marketing/seed-patch/planter-first-leaves.png',
  '/marketing/seed-patch/planter-seedling.png',
  '/marketing/seed-patch/planter-branching.png',
  '/marketing/seed-patch/planter-in-flower.png',
  '/marketing/seed-patch/planter-harvest.png',
] as const;

const SEED_CHIP = [
  '/marketing/seed-patch/garden-seed-0.png',
  '/marketing/seed-patch/garden-seed-1.png',
  '/marketing/seed-patch/garden-seed-2.png',
] as const;

/** Back row of the garden — crates rest on the soil line, left and right of the plot. */
const GARDEN_SLOTS: { left: string; width: string; z: number }[] = [
  { left: '0%', width: '20%', z: 2 },
  { left: '79%', width: '21%', z: 2 },
  { left: '12%', width: '16%', z: 1 },
  { left: '70%', width: '16%', z: 1 },
  { left: '-4%', width: '18%', z: 3 },
  { left: '86%', width: '18%', z: 3 },
  { left: '20%', width: '13%', z: 1 },
  { left: '66%', width: '13%', z: 1 },
  { left: '6%', width: '12%', z: 1 },
  { left: '81%', width: '12%', z: 1 },
  { left: '26%', width: '14%', z: 2 },
  { left: '60%', width: '14%', z: 2 },
];

function planterSrc(stageIndex: number): string {
  const clamped = Math.min(PLANTER_SRC.length - 1, Math.max(0, stageIndex));
  return PLANTER_SRC[clamped];
}

function PlanterPhoto({
  stageIndex,
  className,
  alt = '',
}: {
  stageIndex: number;
  className?: string;
  alt?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={planterSrc(stageIndex)}
      alt={alt}
      className={className}
      draggable={false}
    />
  );
}

export function SeedGardenScene({
  stageId,
  lifetimeSeeds = 0,
  weeklyHarvests = 0,
  className,
}: {
  stageId: string;
  lifetimeSeeds?: number;
  weeklyHarvests?: number;
  className?: string;
}) {
  const stage = (
    GROWTH_STAGES.some((row) => row.id === stageId) ? stageId : 'sprout'
  ) as StageId;
  const currentIndex = growthStageIndex(stage);
  const label =
    GROWTH_STAGES.find((row) => row.id === stage)?.label ?? 'Sprout';
  const beds = gardenBedStages({
    currentIndex,
    weeklyHarvests,
    lifetimeSeeds,
  });
  const seeds = gardenSeedCount(lifetimeSeeds);
  const showBasket = weeklyHarvests > 0 || currentIndex >= GROWTH_STAGES.length - 1;

  return (
    <figure className={className}>
      <div className="relative overflow-hidden rounded-xl border border-amber-200/70 bg-[#d7c49a] shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/marketing/seed-patch/garden-hills.jpg"
          alt=""
          className="pointer-events-none absolute inset-x-0 top-0 h-[46%] w-full object-cover object-top"
          aria-hidden
        />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-b from-[#c4ae78] via-[#a88854] to-[#7a6240]" aria-hidden />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/marketing/seed-patch/garden-soil.jpg"
            alt=""
            className="pointer-events-none absolute inset-x-0 top-[36%] h-[28%] w-full object-cover object-top opacity-95"
            aria-hidden
          />

          <div className="relative min-h-[19rem] sm:min-h-[24rem]">
            <ul className="absolute inset-x-0 top-[10%] h-[48%]" aria-hidden>
              {beds.map((stageIndex, slot) => {
                const place = GARDEN_SLOTS[slot] ?? GARDEN_SLOTS[0];
                return (
                  <li
                    key={`garden-${slot}-${stageIndex}`}
                    className="absolute bottom-0"
                    style={{
                      left: place.left,
                      width: place.width,
                      zIndex: place.z,
                    }}
                  >
                    <PlanterPhoto
                      stageIndex={stageIndex}
                      className="h-auto w-full"
                    />
                  </li>
                );
              })}
            </ul>

          {showBasket ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/marketing/seed-patch/garden-basket.jpg"
              alt=""
              className="pointer-events-none absolute bottom-[28%] right-[4%] z-[4] w-[13%] sm:w-[10%]"
              aria-hidden
            />
          ) : null}

          <ul className="absolute inset-x-0 bottom-[8%] h-[24%]" aria-hidden>
            {Array.from({ length: seeds }, (_, index) => {
              const side = index % 2 === 0 ? 4 + ((index * 9) % 22) : 74 + ((index * 7) % 22);
              const bottom = 10 + ((index * 13) % 55);
              const size = 14 + (index % 3) * 5;
              return (
                <li
                  key={`seed-${index}`}
                  className="absolute overflow-hidden rounded-[40%]"
                  style={{
                    left: `${side}%`,
                    bottom: `${bottom}%`,
                    width: size,
                    height: Math.round(size * 0.78),
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={SEED_CHIP[index % SEED_CHIP.length]}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </li>
              );
            })}
          </ul>

          <div className="absolute bottom-[-10%] left-1/2 z-10 h-[108%] w-[88%] max-w-[26rem] -translate-x-1/2 sm:w-[66%]">
            <PlanterPhoto
              stageIndex={currentIndex}
              alt={label}
              className="h-full w-full object-contain object-bottom"
            />
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center">
        <p className="text-sm font-semibold" style={{ color: SHAPE_GREEN }}>
          {label}
        </p>
        <p className="mt-0.5 text-xs text-stone-600">
          {beds.length === 0 && seeds === 0
            ? 'This plot sits in front. Seeds and harvested plants gather in the garden behind it.'
            : `${seeds} seed${seeds === 1 ? '' : 's'}${
                beds.length > 0
                  ? ` and ${beds.length} harvested plant${beds.length === 1 ? '' : 's'}`
                  : ''
              } in the garden behind this plot.`}
        </p>
      </figcaption>
    </figure>
  );
}

export function SeedGardenPath({ currentId }: { currentId: string }) {
  return <SeedGardenScene stageId={currentId} />;
}
