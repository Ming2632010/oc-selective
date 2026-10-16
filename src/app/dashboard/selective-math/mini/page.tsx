'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getStudentId, getToken } from '@/lib/client-auth';
import { emptyExamMathOverview, examMathSetsOfKind, type ExamMathSet } from '@/lib/exam-math';
import {
  ExamMathBandLegend,
  ExamMathSetGrid,
} from '@/components/dashboard/selective-math-home';

export default function SelectiveMathMiniPage() {
  const router = useRouter();
  const [sets, setSets] = useState<ExamMathSet[]>(examMathSetsOfKind('mini'));
  const [readyCount, setReadyCount] = useState(0);

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
        setSets(res.data.minis ?? emptyExamMathOverview().minis);
        setReadyCount(Number(res.data.readyMiniCount ?? 0));
      }
    }
    void load();
  }, [router]);

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <p className="text-sm uppercase tracking-wide text-warm-subtle">Selective Math</p>
      <h1 className="font-serif text-3xl font-semibold text-warm-ink">Mini exams</h1>
      <p className="max-w-2xl text-sm text-warm-muted">
        100 short computer sittings. Each has 12 questions and 14 minutes, at
        the same pace as the placement test. {readyCount} of 100 are ready.
      </p>
      <ExamMathBandLegend kind="mini" />
      <ExamMathSetGrid sets={sets} />
      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/selective-math"
          className="text-sm font-medium text-brand hover:text-brand-dark"
        >
          Back to Selective Math
        </Link>
        <Link
          href="/dashboard/selective-math/sit/preview"
          className="text-sm font-medium text-brand hover:text-brand-dark"
        >
          Try the computer test screen
        </Link>
      </div>
    </main>
  );
}
