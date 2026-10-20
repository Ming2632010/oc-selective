'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getStudentId, getToken } from '@/lib/client-auth';
import {
  emptyExamThinkingOverview,
  examThinkingSetsOfKind,
  type ExamThinkingSet,
} from '@/lib/exam-thinking';
import {
  ExamThinkingBandLegend,
  ExamThinkingSetGrid,
} from '@/components/dashboard/selective-thinking-home';

export default function SelectiveThinkingMiniPage() {
  const router = useRouter();
  const [sets, setSets] = useState<ExamThinkingSet[]>(examThinkingSetsOfKind('mini'));
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
      const res = await apiFetch(`/api/exam-thinking/overview?student_id=${studentId}`);
      if (res.response.ok) {
        setSets(res.data.minis ?? emptyExamThinkingOverview().minis);
        setReadyCount(Number(res.data.readyMiniCount ?? 0));
      }
    }
    void load();
  }, [router]);

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <p className="text-sm uppercase tracking-wide text-warm-subtle">Selective Thinking Skills</p>
      <h1 className="font-serif text-3xl font-semibold text-warm-ink">Mini exams</h1>
      <p className="max-w-2xl text-sm text-warm-muted">
        100 short computer sittings. Each has 12 questions and no timer, so
        the student can work through them without the exam clock. {readyCount}{' '}
        of 100 are ready.
      </p>
      <ExamThinkingBandLegend kind="mini" />
      <ExamThinkingSetGrid sets={sets} />
      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/selective-thinking"
          className="text-sm font-medium text-brand hover:text-brand-dark"
        >
          Back to Thinking Skills
        </Link>
        <Link
          href="/dashboard/selective-thinking/sit/preview"
          className="text-sm font-medium text-brand hover:text-brand-dark"
        >
          Try the computer test screen
        </Link>
      </div>
    </main>
  );
}
