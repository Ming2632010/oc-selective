import Image from 'next/image';
import { GROWTH_STAGES } from '@/lib/rewards';

type StageId = (typeof GROWTH_STAGES)[number]['id'];

export function SeedGardenScene({
  stageId,
  className,
}: {
  stageId: string;
  className?: string;
}) {
  const stage = (
    GROWTH_STAGES.some((row) => row.id === stageId) ? stageId : 'sprout'
  ) as StageId;
  const currentIndex = Math.max(
    0,
    GROWTH_STAGES.findIndex((row) => row.id === stage),
  );
  const label =
    GROWTH_STAGES.find((row) => row.id === stage)?.label ?? 'Sprout';

  return (
    <figure className={className}>
      <div className="relative overflow-hidden rounded-xl border border-amber-200/80 bg-[#efe6d4] shadow-sm">
        <Image
          src="/marketing/seed-patch-garden.jpg"
          alt={`Seed Patch garden at the ${label} stage, with pink blossoms when the plot is in flower`}
          width={1536}
          height={1024}
          className="h-auto w-full"
          sizes="(min-width: 1024px) 720px, 100vw"
          priority={false}
        />
        <ol
          className="pointer-events-none absolute inset-0 grid grid-cols-6 px-[2.5%] pb-[17%] pt-[24%]"
          aria-hidden
        >
          {GROWTH_STAGES.map((row, index) => (
            <li key={row.id} className="relative">
              {index === currentIndex ? (
                <span className="absolute left-1/2 top-[52%] block h-[78%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-400 shadow-[0_0_0_1px_rgba(180,120,40,0.45)]" />
              ) : null}
            </li>
          ))}
        </ol>
      </div>
      <ol className="mt-2 grid grid-cols-6 gap-1">
        {GROWTH_STAGES.map((row, index) => {
          const state =
            index < currentIndex
              ? 'done'
              : index === currentIndex
                ? 'now'
                : 'later';
          return (
            <li key={row.id}>
              <p
                className={`text-center text-[10px] leading-tight sm:text-xs ${
                  state === 'now'
                    ? 'font-semibold text-rose-800'
                    : state === 'done'
                      ? 'text-stone-700'
                      : 'text-stone-400'
                }`}
              >
                {row.label}
              </p>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}

export function SeedGardenPath({ currentId }: { currentId: string }) {
  return <SeedGardenScene stageId={currentId} />;
}
