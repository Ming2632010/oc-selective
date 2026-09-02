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
  '/marketing/seed-patch/planter-sprout.jpg',
  '/marketing/seed-patch/planter-first-leaves.jpg',
  '/marketing/seed-patch/planter-seedling.jpg',
  '/marketing/seed-patch/planter-branching.jpg',
  '/marketing/seed-patch/planter-in-flower.jpg',
  '/marketing/seed-patch/planter-harvest.jpg',
] as const;

const SEED_CHIP = [
  '/marketing/seed-patch/garden-seed-0.jpg',
  '/marketing/seed-patch/garden-seed-1.jpg',
  '/marketing/seed-patch/garden-seed-2.jpg',
] as const;

/** Plants sit on the soil in the back — not in a row, not in photo frames. */
const GARDEN_SLOTS: { left: string; bottom: string; width: string }[] = [
  { left: '1%', bottom: '34%', width: '18%' },
  { left: '80%', bottom: '33%', width: '19%' },
  { left: '14%', bottom: '40%', width: '14%' },
  { left: '70%', bottom: '42%', width: '14%' },
  { left: '-2%', bottom: '26%', width: '16%' },
  { left: '86%', bottom: '25%', width: '16%' },
  { left: '22%', bottom: '46%', width: '12%' },
  { left: '64%', bottom: '47%', width: '12%' },
  { left: '8%', bottom: '48%', width: '11%' },
  { left: '78%', bottom: '49%', width: '11%' },
  { left: '28%', bottom: '36%', width: '13%' },
  { left: '58%', bottom: '37%', width: '13%' },
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
  const showBasket = weeklyHarvests > 0 || beds.includes(GROWTH_STAGES.length - 1);

  return (
    <figure className={className}>
      <div className="relative overflow-hidden rounded-xl border border-amber-200/80 bg-[#e6d9b8] shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/marketing/seed-patch/garden-hills.jpg"
          alt=""
          className="pointer-events-none absolute inset-x-0 top-0 h-[58%] w-full object-cover object-top"
          aria-hidden
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/marketing/seed-patch/garden-soil.jpg"
          alt=""
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] w-full object-cover object-bottom"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-[48%] h-16 bg-gradient-to-b from-transparent to-[#cbb98a]/80"
          aria-hidden
        />

        <div className="relative aspect-[16/11] min-h-[16.5rem] sm:min-h-[20rem]">
          <ul className="absolute inset-0" aria-hidden>
            {beds.map((stageIndex, slot) => {
              const place = GARDEN_SLOTS[slot] ?? GARDEN_SLOTS[0];
              return (
                <li
                  key={`garden-${slot}-${stageIndex}`}
                  className="absolute"
                  style={{
                    left: place.left,
                    bottom: place.bottom,
                    width: place.width,
                  }}
                >
                  <PlanterPhoto
                    stageIndex={stageIndex}
                    className="h-auto w-full drop-shadow-[0_8px_10px_rgba(40,40,20,0.28)]"
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
              className="pointer-events-none absolute bottom-[22%] right-[6%] w-[12%] drop-shadow-md sm:w-[9%]"
              aria-hidden
            />
          ) : null}

          <ul className="absolute inset-x-[6%] bottom-[14%] h-[20%]" aria-hidden>
            {Array.from({ length: seeds }, (_, index) => {
              const left = 3 + ((index * 17 + index * index * 3) % 90);
              const bottom = 6 + ((index * 11 + 5) % 70);
              const size = 9 + (index % 4) * 2;
              return (
                <li
                  key={`seed-${index}`}
                  className="absolute overflow-hidden rounded-full"
                  style={{
                    left: `${left}%`,
                    bottom: `${bottom}%`,
                    width: size,
                    height: Math.round(size * 0.82),
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

          <div className="absolute bottom-[-6%] left-1/2 z-10 h-[92%] w-[58%] max-w-[19rem] -translate-x-1/2 sm:w-[46%]">
            <PlanterPhoto
              stageIndex={currentIndex}
              alt={label}
              className="h-full w-full object-contain object-bottom drop-shadow-[0_16px_18px_rgba(40,40,20,0.35)]"
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
                  ? ` and ${beds.length} plant${beds.length === 1 ? '' : 's'}`
                  : ''
              } in the garden behind — harvested plants stay there.`}
        </p>
      </figcaption>
    </figure>
  );
}

export function SeedGardenPath({ currentId }: { currentId: string }) {
  return <SeedGardenScene stageId={currentId} />;
}
