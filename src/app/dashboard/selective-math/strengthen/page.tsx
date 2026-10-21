'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getStudentId, getToken } from '@/lib/client-auth';

type StrengthenType = {
  familyId: string;
  skillLabel: string;
  familyLabel: string;
  timesWrong: number;
};

export default function SelectiveMathStrengthenPage() {
  const router = useRouter();
  const [types, setTypes] = useState<StrengthenType[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const res = await apiFetch(`/api/exam-math/strengthen?student_id=${studentId}`);
      if (!res.response.ok) {
        setError(typeof res.data.error === 'string' ? res.data.error : 'Could not load Strengthen.');
        setTypes([]);
        return;
      }
      setTypes(Array.isArray(res.data.types) ? res.data.types : []);
    }
    void load();
  }, [router]);

  const openCount = types?.length ?? 0;

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <p className="text-sm uppercase tracking-wide text-warm-subtle">Selective Math</p>
      <h1 className="font-serif text-3xl font-semibold text-warm-ink">Strengthen</h1>
      <p className="text-sm text-warm-muted">
        After a mini exam or paper, missed types wait here. Each practise question
        uses the same reasoning with new numbers. A miss keeps the type open. A
        correct answer clears it. Student work is never deleted.
      </p>
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      {types === null ? (
        <p className="text-sm text-warm-muted">Loading…</p>
      ) : openCount === 0 ? (
        <section className="rounded-lg border border-dashed border-warm-border bg-white p-6">
          <p className="font-medium text-warm-ink">No missed types yet.</p>
          <p className="mt-2 text-sm text-warm-muted">
            Finish a mini exam or paper. Misses appear here as types to practise.
          </p>
        </section>
      ) : (
        <ol className="space-y-3">
          {types.map((type) => (
            <li
              key={type.familyId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warm-border bg-white p-4"
            >
              <div>
                <p className="font-medium text-warm-ink">{type.skillLabel}</p>
                <p className="text-sm text-warm-muted">
                  {type.familyLabel}
                  {type.timesWrong > 1 ? ` · missed ${type.timesWrong} times` : ''}
                </p>
              </div>
              <Link
                href={`/dashboard/selective-math/strengthen/sit?family=${encodeURIComponent(type.familyId)}`}
                className="rounded-full bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-hover"
              >
                Practise this type
              </Link>
            </li>
          ))}
        </ol>
      )}
      <Link
        href="/dashboard/selective-math"
        className="text-sm font-medium text-brand hover:text-brand-dark"
      >
        Back to Selective Math
      </Link>
    </main>
  );
}
