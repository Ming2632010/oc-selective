'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getStudentId, getToken } from '@/lib/client-auth';

export default function SelectiveMathStrengthenPage() {
  const router = useRouter();
  const [openCount, setOpenCount] = useState(0);

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
      const res = await apiFetch(`/api/exam-math/overview?student_id=${studentId}`);
      if (res.response.ok) {
        setOpenCount(Number(res.data.openWrongCount ?? 0));
      }
    }
    void load();
  }, [router]);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <p className="text-sm uppercase tracking-wide text-warm-subtle">Selective Math</p>
      <h1 className="font-serif text-3xl font-semibold text-warm-ink">Strengthen</h1>
      <p className="text-sm text-warm-muted">
        After a mini exam or full paper, every miss is kept here. Later, TrialSeed
        will make a new question of the same type — same reasoning, new numbers
        — so the student practises the weakness, not the same item again.
      </p>
      <section className="rounded-lg border border-dashed border-warm-border bg-white p-6">
        <p className="font-medium text-warm-ink">
          {openCount === 0
            ? 'No missed questions yet.'
            : `${openCount} type${openCount === 1 ? '' : 's'} waiting.`}
        </p>
        <p className="mt-2 text-sm text-warm-muted">
          This list fills after a marked mini exam or paper. Misses stay until
          the same type is practised again. Nothing is deleted from student work.
        </p>
      </section>
      <Link
        href="/dashboard/selective-math"
        className="text-sm font-medium text-brand hover:text-brand-dark"
      >
        Back to Selective Math
      </Link>
    </main>
  );
}
