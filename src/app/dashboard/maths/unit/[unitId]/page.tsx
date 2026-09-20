'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, getStudentId, getToken } from '@/lib/client-auth';
import { getEarlyMathUnit, type EarlyMathSkill } from '@/lib/early-math';
import { MathsUnitSticker } from '@/components/maths/unit-stickers';

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

  if (loading) return <main className="min-h-dvh bg-[#FFF8E8] p-6">Loading…</main>;

  const firstOpen = items.find((item) => !item.attempted) ?? items[0];

  return (
    <main className="min-h-dvh bg-[#FFF8E8] px-4 py-6">
      <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/dashboard" className="text-sm text-warm-muted hover:text-warm-ink">
        ← Back
      </Link>
      <header className="flex flex-col items-center text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-[1.6rem] border-[3px] border-[#2D5A4A] bg-white shadow-sm">
          <MathsUnitSticker unitId={unitId} />
        </span>
        <h1 className="mt-3 text-3xl font-semibold text-warm-ink">{unit?.title}</h1>
        <p className="mt-2 text-warm-muted">{unit?.blurb}</p>
      </header>
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      {firstOpen ? (
        <Link
          href={`/dashboard/maths/unit/${unitId}/practice/${firstOpen.slug}`}
          className="flex w-full items-center justify-center rounded-[1.6rem] bg-terracotta py-4 text-2xl font-semibold text-white hover:bg-terracotta-hover"
        >
          Play
        </Link>
      ) : null}
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.slug}>
            <Link
              href={`/dashboard/maths/unit/${unitId}/practice/${item.slug}`}
              className="flex items-center justify-between gap-3 rounded-2xl border-2 border-[#E8D9B0] bg-[#FFFCF3] px-4 py-4 hover:border-terracotta"
            >
              <p className="font-medium text-warm-ink">{item.title}</p>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  item.attempted ? 'bg-[#E3EFE6] text-brand-dark' : 'bg-[#FFF1D6] text-warm-muted'
                }`}
              >
                {item.attempted ? 'Tried' : 'New'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      </div>
    </main>
  );
}
