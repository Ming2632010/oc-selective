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

const SHORT_TITLES: Record<number, string> = {
  1: 'See',
  2: 'Count',
  3: 'Parts',
  4: 'Stories',
  5: 'Tens',
  6: 'Today',
};

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-AU';
  utterance.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function unitStop(unit: MathsUnitProgress, currentId: number | null) {
  const pct = unit.total ? Math.round((unit.tried / unit.total) * 100) : 0;
  const done = unit.total > 0 && unit.tried >= unit.total;
  const started = unit.tried > 0 && !done;
  return {
    pct,
    done,
    started,
    current: currentId === unit.id,
  };
}

export function MathsHome({
  overview,
  grade,
  parentView = false,
  onToggleParent,
}: {
  overview: MathsOverview | null;
  grade: string;
  parentView?: boolean;
  onToggleParent?: () => void;
}) {
  const units = overview?.units ?? [];
  const currentId = overview?.next?.unitId ?? null;
  const playHref = overview?.next
    ? `/dashboard/maths/unit/${overview.next.unitId}/practice/${overview.next.slug}`
    : null;
  const playTitle = overview?.next
    ? SHORT_TITLES[overview.next.unitId] ?? overview.next.title
    : 'Maths';

  return (
    <div className="space-y-8">
      <SeedPatch
        patch={overview?.rewards ?? null}
        variant="maths"
        parentView={parentView}
      />

      {playHref ? (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => speak(`Let's play. ${playTitle}.`)}
              aria-label="Hear the next game"
              className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-brand bg-white text-3xl text-brand shadow-card hover:bg-[#EEF6F0]"
            >
              <SpeakerIcon />
            </button>
            <Link
              href={playHref}
              aria-label={`Play ${playTitle}`}
              className="flex h-24 w-24 items-center justify-center rounded-full bg-terracotta text-white shadow-float hover:bg-terracotta-hover"
            >
              <PlayIcon />
            </Link>
          </div>
        </div>
      ) : null}

      <section>
        <ol className="relative mx-auto max-w-md space-y-5">
          <span
            aria-hidden
            className="absolute bottom-8 left-8 top-8 border-l-[3px] border-dashed border-[#C9B8A0]"
          />
          {units.map((unit) => {
            const stop = unitStop(unit, currentId);
            const title = SHORT_TITLES[unit.id] ?? unit.title;
            return (
              <li key={unit.id}>
                <Link
                  href={`/dashboard/maths/unit/${unit.id}`}
                  className="relative flex items-center gap-4 rounded-3xl px-1 py-1 hover:bg-white/70"
                >
                  <span
                    className={`relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${
                      stop.done ? 'bg-brand text-white' : 'bg-[#D6D1C7] text-warm-ink'
                    } ${stop.current ? 'maths-path-current' : ''}`}
                  >
                    {stop.started && !stop.done ? (
                      <span
                        aria-hidden
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `conic-gradient(#2D5A4A 0 ${stop.pct}%, #D6D1C7 ${stop.pct}% 100%)`,
                        }}
                      />
                    ) : null}
                    <span
                      className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full text-2xl font-semibold ${
                        stop.done ? 'text-white' : 'bg-white text-warm-ink'
                      }`}
                    >
                      {stop.done ? <CheckIcon /> : unit.id}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-serif text-2xl font-semibold text-warm-ink">
                      {title}
                    </span>
                    <span className="mt-2 block h-2 overflow-hidden rounded-full bg-[#F0EBE3]">
                      <span
                        className="block h-full rounded-full bg-brand"
                        style={{ width: `${stop.pct}%` }}
                      />
                    </span>
                    {parentView ? (
                      <span className="mt-2 block text-sm text-warm-muted">
                        Unit {unit.id} · {unit.blurb}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onToggleParent}
          className="rounded-full px-4 py-2 text-sm text-warm-subtle hover:text-warm-ink"
        >
          {parentView ? 'Back to the game' : 'Grown-ups'}
        </button>
      </div>

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
    <svg viewBox="0 0 24 24" className="h-12 w-12" aria-hidden>
      <path fill="currentColor" d="M8 5.5v13l11-6.5-11-6.5z" />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden>
      <path
        fill="currentColor"
        d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a3.5 3.5 0 0 0-1.8-3.1v6.2A3.5 3.5 0 0 0 16.5 12zm0-7.2v2.1A6.5 6.5 0 0 1 20 12a6.5 6.5 0 0 1-3.5 5.1v2.1A8.5 8.5 0 0 0 22 12a8.5 8.5 0 0 0-5.5-7.2z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9" aria-hidden>
      <path
        fill="currentColor"
        d="M9.2 16.2 5.8 12.8l-1.6 1.6 5 5 11-11-1.6-1.6z"
      />
    </svg>
  );
}
