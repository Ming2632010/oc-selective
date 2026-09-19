'use client';

import Link from 'next/link';
import { SeedPatch, type SeedPatchData } from '@/components/writing/seed-patch';
import { MathsUnitSticker, stampTilt, stickerLabel } from '@/components/maths/unit-stickers';
import type { EarlyMathUnit } from '@/lib/early-math';

export type MathsUnitProgress = EarlyMathUnit & {
  total: number;
  tried: number;
  correct: number;
};

export type MathsOverview = {
  units: MathsUnitProgress[];
  rewards: SeedPatchData | null;
  next: { slug: string; unitId: number; title: string; reason: string } | null;
};

function unitStop(unit: MathsUnitProgress, currentId: number | null) {
  const done = unit.total > 0 && unit.tried >= unit.total;
  const started = unit.tried > 0 && !done;
  return {
    done,
    started,
    current: currentId === unit.id,
  };
}

export function MathsHome({
  overview,
  grade,
  parentView = false,
}: {
  overview: MathsOverview | null;
  grade: string;
  parentView?: boolean;
}) {
  const units = [...(overview?.units ?? [])].sort((a, b) => a.id - b.id);
  const currentId = overview?.next?.unitId ?? null;
  const playHref = overview?.next
    ? `/dashboard/maths/unit/${overview.next.unitId}/practice/${overview.next.slug}`
    : units[0]
      ? `/dashboard/maths/unit/${units[0].id}`
      : '/dashboard';

  return (
    <div className="space-y-8">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <Link
          href={playHref}
          className="flex w-full items-center justify-center gap-5 rounded-[2.5rem] bg-terracotta px-8 py-12 text-6xl font-semibold text-white shadow-float hover:bg-terracotta-hover sm:text-7xl"
        >
          <PlayIcon />
          Play
        </Link>

        <SeedPatch
          patch={overview?.rewards ?? null}
          variant="maths"
          parentView={parentView}
          compact={!parentView}
        />
      </div>

      <ol className="-mx-3 flex flex-nowrap items-end justify-center gap-1.5 overflow-visible px-3 py-5 sm:mx-0 sm:gap-5">
        {units.map((unit) => {
          const stop = unitStop(unit, currentId);
          const name = stickerLabel(unit.id);
          const frame = stop.current
            ? 'maths-path-current rotate-0 border-solid border-brand bg-white'
            : stop.done
              ? 'border-solid border-brand bg-[#EEF6F0]'
              : stop.started
                ? 'border-solid border-terracotta bg-[#FFF8F2]'
                : 'border-dashed border-[#D6D1C7] bg-[#F4F1EA]';
          return (
            <li
              key={unit.id}
              className={`flex shrink-0 flex-col items-center gap-1 ${stop.current ? 'z-10' : ''}`}
            >
              <Link
                href={`/dashboard/maths/unit/${unit.id}`}
                aria-label={`${name}${stop.current ? ', play next' : ''}${stop.done ? ', finished' : ''}`}
                aria-current={stop.current ? 'step' : undefined}
                className={`relative flex h-14 w-14 items-center justify-center rounded-[1.35rem] border-[3px] shadow-[2px_3px_0_rgba(61,53,46,0.1)] sm:h-[4.75rem] sm:w-[4.75rem] ${frame} ${
                  stop.current ? '' : stampTilt(unit.id)
                } ${stop.done || stop.started || stop.current ? '' : 'shadow-none'}`}
              >
                <span className={stop.done || stop.started || stop.current ? '' : 'opacity-40'}>
                  <MathsUnitSticker unitId={unit.id} />
                </span>
                {stop.done ? (
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white">
                    <CheckIcon />
                  </span>
                ) : null}
              </Link>
              {parentView ? (
                <span className="text-xs text-warm-muted">{name}</span>
              ) : null}
            </li>
          );
        })}
      </ol>

      {parentView ? (
        <p className="text-sm text-warm-subtle">
          A small set for {grade}. English and Reading for K–Y1 are still coming
          soon. Selective Writing stays on Year 4–7 profiles.
        </p>
      ) : null}
    </div>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-14 w-14 sm:h-16 sm:w-16" aria-hidden>
      <path fill="currentColor" d="M8 5.5v13l11-6.5-11-6.5z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="currentColor"
        d="M9.2 16.2 5.8 12.8l-1.6 1.6 5 5 11-11-1.6-1.6z"
      />
    </svg>
  );
}
