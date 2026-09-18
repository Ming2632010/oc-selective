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

export function MathsHome({
  overview,
  grade,
}: {
  overview: MathsOverview | null;
  grade: string;
}) {
  const units = overview?.units ?? [];
  return (
    <div className="space-y-6">
      {overview?.next ? (
        <section className="rounded-lg border border-[#D6E3D8] bg-[#EEF6F0] p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">Next question</p>
          <h2 className="mt-1 text-lg font-semibold text-warm-ink">{overview.next.title}</h2>
          <p className="mt-2 text-sm text-warm-muted">{overview.next.reason}</p>
          <Link
            href={`/dashboard/maths/unit/${overview.next.unitId}/practice/${overview.next.slug}`}
            className="mt-4 inline-flex rounded-full bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-hover"
          >
            Sit together
          </Link>
        </section>
      ) : null}

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-medium text-warm-ink">Maths units</h2>
          <p className="mt-1 text-sm text-warm-muted">
            A small set for {grade}. Questions change by skill — seeing, counting,
            parts, stories, tens, and everyday maths — not the same puzzle with a
            new fruit. English and Reading stay on the way.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {units.map((unit) => {
            const pct = unit.total ? Math.round((unit.tried / unit.total) * 100) : 0;
            return (
              <Link
                key={unit.id}
                href={`/dashboard/maths/unit/${unit.id}`}
                className="rounded-lg border border-warm-border bg-warm-card p-4 shadow-card hover:border-brand"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                  Unit {unit.id}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-warm-ink">{unit.title}</h3>
                <p className="mt-1 text-sm text-warm-muted">{unit.blurb}</p>
                <p className="mt-3 text-xs text-warm-subtle">
                  {unit.tried}/{unit.total} tried
                  {unit.tried > 0 ? ` · ${unit.correct} last-try correct` : ''}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#F0EBE3]">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <SeedPatch patch={overview?.rewards ?? null} variant="maths" />

      <p className="text-sm text-warm-subtle">
        English and Reading for K–Y1 are still coming soon. Selective Writing stays
        on Year 4–7 profiles.
      </p>
    </div>
  );
}
