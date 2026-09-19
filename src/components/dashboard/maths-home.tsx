'use client';

import Link from 'next/link';
import { SeedPatch, type SeedPatchData } from '@/components/writing/seed-patch';
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
        className="mx-auto flex w-full max-w-xl items-center justify-center gap-5 rounded-[2.5rem] bg-terracotta px-8 py-10 text-5xl font-semibold text-white shadow-float hover:bg-terracotta-hover sm:text-6xl"
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

      <ol className="flex items-center justify-center gap-2 sm:gap-3">
        {units.map((unit) => {
          const stop = unitStop(unit, currentId);
          return (
            <li key={unit.id}>
              <Link
                href={`/dashboard/maths/unit/${unit.id}`}
                aria-label={`Unit ${unit.id}${stop.current ? ', current' : ''}${stop.done ? ', finished' : ''}`}
                aria-current={stop.current ? 'step' : undefined}
                className={`flex h-11 w-11 items-center justify-center rounded-full text-lg font-semibold sm:h-12 sm:w-12 ${
                  stop.done
                    ? 'bg-brand text-white'
                    : stop.started
                      ? 'bg-[#C5D8CC] text-brand-dark'
                      : 'bg-[#D6D1C7] text-warm-ink'
                } ${stop.current ? 'maths-path-current ring-2 ring-brand ring-offset-2 ring-offset-[#f7f5f0]' : ''}`}
              >
                {stop.done ? <CheckIcon /> : unit.id}
              </Link>
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
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <path
        fill="currentColor"
        d="M9.2 16.2 5.8 12.8l-1.6 1.6 5 5 11-11-1.6-1.6z"
      />
    </svg>
  );
}
