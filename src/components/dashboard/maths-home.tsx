'use client';

import Link from 'next/link';
import { SeedPatch, type SeedPatchData } from '@/components/writing/seed-patch';
import { MathsUnitSticker, stickerLabel } from '@/components/maths/unit-stickers';
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
      <Link
        href={playHref}
        className="mx-auto flex w-full max-w-3xl items-center justify-center gap-5 rounded-[2.5rem] bg-terracotta px-8 py-12 text-6xl font-semibold text-white shadow-float hover:bg-terracotta-hover sm:text-7xl"
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

      <ol className="flex flex-wrap items-end justify-center gap-3 sm:gap-4">
        {units.map((unit) => {
          const stop = unitStop(unit, currentId);
          const name = stickerLabel(unit.id);
          return (
            <li key={unit.id} className="flex flex-col items-center gap-1">
              <Link
                href={`/dashboard/maths/unit/${unit.id}`}
                aria-label={`${name}${stop.current ? ', play next' : ''}${stop.done ? ', finished' : ''}`}
                aria-current={stop.current ? 'step' : undefined}
                className={`relative flex h-16 w-16 items-center justify-center rounded-[1.4rem] border-2 sm:h-[4.5rem] sm:w-[4.5rem] ${
                  stop.done
                    ? 'border-brand bg-[#EEF6F0]'
                    : stop.started
                      ? 'border-terracotta bg-white'
                      : 'border-dashed border-[#D6D1C7] bg-[#F7F5F0]'
                } ${stop.current ? 'maths-path-current scale-110 border-brand' : ''}`}
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
