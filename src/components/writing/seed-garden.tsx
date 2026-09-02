import {
  GROWTH_STAGES,
  gardenBedStages,
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

/** Back-of-garden beds sit behind the zoomed plot; later harvests fill the sides. */
const GARDEN_SLOTS: {
  left: string;
  top: string;
  width: string;
  rotate: string;
  opacity: number;
}[] = [
  { left: '3%', top: '10%', width: '22%', rotate: '-8deg', opacity: 0.92 },
  { left: '74%', top: '8%', width: '23%', rotate: '7deg', opacity: 0.92 },
  { left: '22%', top: '2%', width: '17%', rotate: '4deg', opacity: 0.78 },
  { left: '54%', top: '1%', width: '17%', rotate: '-5deg', opacity: 0.78 },
  { left: '-1%', top: '32%', width: '24%', rotate: '-3deg', opacity: 0.88 },
  { left: '78%', top: '30%', width: '24%', rotate: '5deg', opacity: 0.88 },
  { left: '12%', top: '18%', width: '16%', rotate: '6deg', opacity: 0.72 },
  { left: '68%', top: '16%', width: '16%', rotate: '-6deg', opacity: 0.72 },
  { left: '38%', top: '6%', width: '14%', rotate: '-3deg', opacity: 0.64 },
  { left: '48%', top: '18%', width: '15%', rotate: '8deg', opacity: 0.7 },
  { left: '6%', top: '44%', width: '18%', rotate: '-9deg', opacity: 0.8 },
  { left: '76%', top: '46%', width: '18%', rotate: '4deg', opacity: 0.8 },
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
    // Cropped stills from the botanical painting — one crate per stage.
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

  return (
    <figure className={className}>
      <div className="relative overflow-hidden rounded-xl border border-amber-200/80 bg-[#cfc6a8] shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/marketing/seed-patch/garden-backdrop.jpg"
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-top"
          aria-hidden
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/marketing/seed-patch/garden-leaf-left.jpg"
          alt=""
          className="pointer-events-none absolute left-0 top-0 w-[34%] opacity-90"
          aria-hidden
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/marketing/seed-patch/garden-leaf-right.jpg"
          alt=""
          className="pointer-events-none absolute right-0 top-0 w-[34%] opacity-90"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#efe6cc]/25 via-transparent to-[#8a7a52]/35"
          aria-hidden
        />

        <div className="relative min-h-[22rem] sm:min-h-[26rem]">
          <ul className="absolute inset-x-0 top-0 h-[68%]" aria-hidden>
            {beds.map((stageIndex, slot) => {
              const place = GARDEN_SLOTS[slot] ?? GARDEN_SLOTS[0];
              return (
                <li
                  key={`garden-${slot}-${stageIndex}`}
                  className="absolute overflow-hidden rounded-md shadow-[0_6px_14px_rgba(50,60,30,0.22)]"
                  style={{
                    left: place.left,
                    top: place.top,
                    width: place.width,
                    aspectRatio: '3 / 4',
                    transform: `rotate(${place.rotate})`,
                    opacity: place.opacity,
                  }}
                >
                  <PlanterPhoto
                    stageIndex={stageIndex}
                    className="h-full w-full object-cover object-center"
                  />
                </li>
              );
            })}
          </ul>

          <div className="absolute bottom-1 left-1/2 z-10 w-[78%] max-w-[22rem] -translate-x-1/2 sm:bottom-2 sm:w-[58%]">
            <div className="relative aspect-[3/4] overflow-hidden rounded-[1.6rem] bg-[#d8d0b4] shadow-[0_16px_32px_rgba(50,55,30,0.38)] ring-[3px] ring-amber-400">
              <PlanterPhoto
                stageIndex={currentIndex}
                alt={label}
                className="h-full w-full object-cover object-center"
              />
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center">
        <p className="text-sm font-semibold" style={{ color: SHAPE_GREEN }}>
          {label}
        </p>
        <p className="mt-0.5 text-xs text-stone-600">
          {beds.length > 0
            ? `${beds.length} plant${beds.length === 1 ? '' : 's'} in the garden behind — harvested plots stay there.`
            : 'The garden behind this plot fills as plants are harvested.'}
        </p>
      </figcaption>
    </figure>
  );
}

export function SeedGardenPath({ currentId }: { currentId: string }) {
  return <SeedGardenScene stageId={currentId} />;
}
