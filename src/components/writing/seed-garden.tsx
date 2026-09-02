import Image from 'next/image';
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

const GARDEN_SLOTS: { left: string; top: string; size: string; rotate: string }[] = [
  { left: '2%', top: '10%', size: '28%', rotate: '-8deg' },
  { left: '70%', top: '8%', size: '30%', rotate: '7deg' },
  { left: '0%', top: '38%', size: '26%', rotate: '-4deg' },
  { left: '74%', top: '36%', size: '27%', rotate: '5deg' },
  { left: '14%', top: '2%', size: '22%', rotate: '3deg' },
  { left: '58%', top: '0%', size: '23%', rotate: '-5deg' },
  { left: '8%', top: '22%', size: '20%', rotate: '6deg' },
  { left: '66%', top: '22%', size: '21%', rotate: '-6deg' },
  { left: '-2%', top: '56%', size: '24%', rotate: '-2deg' },
  { left: '78%', top: '54%', size: '24%', rotate: '4deg' },
  { left: '22%', top: '8%', size: '18%', rotate: '-9deg' },
  { left: '54%', top: '6%', size: '18%', rotate: '8deg' },
];

function PlanterCrop({
  stageIndex,
  className,
}: {
  stageIndex: number;
  className?: string;
}) {
  const clamped = Math.min(GROWTH_STAGES.length - 1, Math.max(0, stageIndex));
  return (
    <div className={`relative overflow-hidden ${className ?? ''}`}>
      {/* Sprite crop of one planter from the botanical strip. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/marketing/seed-patch-garden.jpg"
        alt=""
        className="pointer-events-none absolute top-[-10%] h-[128%] max-w-none"
        style={{
          width: '600%',
          left: `${-clamped * 100}%`,
        }}
      />
    </div>
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
      <div className="relative overflow-hidden rounded-xl border border-amber-200/80 bg-[#d7e2c4] shadow-sm">
        <Image
          src="/marketing/seed-patch-garden.jpg"
          alt=""
          width={1536}
          height={1024}
          className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-[1px]"
          sizes="(min-width: 1024px) 720px, 100vw"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#c9d6b8]/50 via-transparent to-[#8fa56a]/40"
          aria-hidden
        />
        <div className="relative min-h-[17.5rem] sm:min-h-[20.5rem]">
          <ul className="absolute inset-0" aria-hidden>
            {beds.map((stageIndex, slot) => {
              const place = GARDEN_SLOTS[slot] ?? GARDEN_SLOTS[0];
              return (
                <li
                  key={`garden-${slot}-${stageIndex}`}
                  className="absolute overflow-hidden rounded-lg shadow-sm"
                  style={{
                    left: place.left,
                    top: place.top,
                    width: place.size,
                    aspectRatio: '1 / 1',
                    transform: `rotate(${place.rotate})`,
                  }}
                >
                  <PlanterCrop stageIndex={stageIndex} className="h-full w-full" />
                </li>
              );
            })}
          </ul>
          <div className="absolute bottom-[-6%] left-1/2 z-10 w-[78%] max-w-[22rem] -translate-x-1/2 sm:w-[62%]">
            <div className="relative aspect-square overflow-hidden rounded-[1.75rem] shadow-[0_12px_28px_rgba(60,70,40,0.28)] ring-[3px] ring-amber-400">
              <PlanterCrop stageIndex={currentIndex} className="h-full w-full" />
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
