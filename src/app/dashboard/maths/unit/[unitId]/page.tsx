'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, getStudentId, getToken } from '@/lib/client-auth';
import { EARLY_MATH_SKILL_LABELS, getEarlyMathUnit, type EarlyMathSkill } from '@/lib/early-math';

type ItemCard = {
  slug: string;
  title: string;
  skill: EarlyMathSkill;
  difficulty: string;
  attempted: boolean;
};

export default function MathsUnitPage() {
  const params = useParams<{ unitId: string }>();
  const router = useRouter();
  const unitId = Number(params.unitId);
  const unit = getEarlyMathUnit(unitId);
  const [items, setItems] = useState<ItemCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = getToken();
      const studentId = getStudentId();
      if (!token) {
        router.replace('/login');
        return;
      }
      if (!studentId) {
        router.replace('/dashboard');
        return;
      }
      if (!unit) {
        setError('That Maths unit is not in this path.');
        setLoading(false);
        return;
      }
      try {
        const res = await apiFetch(`/api/maths/items?unit_id=${unitId}&student_id=${studentId}`);
        if (!res.response.ok) throw new Error(res.data.error || 'Could not load Maths');
        setItems((res.data.items as ItemCard[]) ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load Maths');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [router, unit, unitId]);

  if (loading) return <main className="mx-auto max-w-3xl p-6">Loading Maths…</main>;

  const firstOpen = items.find((item) => !item.attempted) ?? items[0];

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <Link href="/dashboard" className="text-sm text-brand hover:underline">
        ← Dashboard
      </Link>
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
          K–Y1 Maths · Unit {unitId}
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-warm-ink">{unit?.title}</h1>
        <p className="mt-2 text-warm-muted">{unit?.blurb}</p>
        <p className="mt-1 text-sm text-warm-subtle">
          Kindy: {unit?.kindyFocus} Year 1: {unit?.year1Focus}
        </p>
      </header>
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      {firstOpen ? (
        <Link
          href={`/dashboard/maths/unit/${unitId}/practice/${firstOpen.slug}`}
          className="inline-flex rounded-full bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-hover"
        >
          {firstOpen.attempted ? 'Practise again' : 'Start this unit'}
        </Link>
      ) : null}
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.slug}>
            <Link
              href={`/dashboard/maths/unit/${unitId}/practice/${item.slug}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-warm-border bg-warm-card px-4 py-3 hover:border-brand"
            >
              <div>
                <p className="font-medium text-warm-ink">{item.title}</p>
                <p className="text-xs text-warm-subtle">
                  {EARLY_MATH_SKILL_LABELS[item.skill] ?? item.skill}
                  {item.difficulty === 'stretch' ? ' · Year 1 stretch' : ''}
                  {item.difficulty === 'kindy' ? ' · Kindy core' : ''}
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  item.attempted ? 'bg-[#E3EFE6] text-brand-dark' : 'bg-[#F0EBE3] text-warm-muted'
                }`}
              >
                {item.attempted ? 'Tried' : 'New'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
