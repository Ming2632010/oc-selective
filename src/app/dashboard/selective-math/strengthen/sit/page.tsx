'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch, getStudentId, getToken } from '@/lib/client-auth';
import { ExamMathPlayer } from '@/components/exam-math/player';
import { strengthenOutcomeCopy } from '@/lib/exam-math-strengthen';
import type { ExamMathQuestion } from '@/lib/exam-math';

type Loaded = ExamMathQuestion & { familyLabel?: string; skillLabel?: string };

export default function SelectiveMathStrengthenSitPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-3xl p-6">Loading…</main>}>
      <StrengthenSit />
    </Suspense>
  );
}

function StrengthenSit() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const familyId = searchParams.get('family') ?? undefined;
  const [question, setQuestion] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultsNote, setResultsNote] = useState<string | null>(null);
  const [stillOpen, setStillOpen] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

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
      setQuestion(null);
      setResultsNote(null);
      setStillOpen(false);
      const res = await apiFetch('/api/exam-math/strengthen/next', {
        method: 'POST',
        body: JSON.stringify({ student_id: studentId, family_id: familyId }),
      });
      if (!res.response.ok) {
        setError(typeof res.data.error === 'string' ? res.data.error : 'Could not make a new question.');
        return;
      }
      setQuestion(res.data.question as Loaded);
    }
    void load();
  }, [router, familyId, reloadToken]);

  if (error && !question) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 p-6">
        <h1 className="font-serif text-2xl font-semibold text-warm-ink">Strengthen</h1>
        <p className="text-sm text-warm-ink">{error}</p>
        <Link href="/dashboard/selective-math/strengthen" className="text-sm font-medium text-brand">
          Back to Strengthen
        </Link>
      </main>
    );
  }

  if (!question) {
    return <main className="mx-auto max-w-3xl p-6">Loading…</main>;
  }

  return (
    <ExamMathPlayer
      key={question.id}
      kind="strengthen"
      title={question.skillLabel ? `${question.skillLabel} · Strengthen` : 'Strengthen'}
      timeLimitSeconds={0}
      questions={[question]}
      exitHref="/dashboard/selective-math/strengthen"
      exitLabel="Back to Strengthen"
      confirmBeforeFinish={false}
      resultsNote={resultsNote}
      resultsActions={
        stillOpen ? (
          <button
            type="button"
            onClick={() => setReloadToken((value) => value + 1)}
            className="inline-flex rounded-full border border-brand px-5 py-2.5 text-sm font-medium text-brand hover:bg-[#EDF3ED]"
          >
            Try another
          </button>
        ) : null
      }
      onComplete={async ({ answers }) => {
        const studentId = getStudentId();
        if (!studentId) return;
        const res = await apiFetch('/api/exam-math/strengthen/attempt', {
          method: 'POST',
          body: JSON.stringify({
            student_id: studentId,
            item_id: question.id,
            chosen: answers[0]?.chosen ?? null,
          }),
        });
        if (!res.response.ok) {
          setResultsNote('Marked on this screen, but the Strengthen list could not be updated.');
          return;
        }
        setStillOpen(Boolean(res.data.stillOpen));
        setResultsNote(strengthenOutcomeCopy(Boolean(res.data.correct)));
      }}
    />
  );
}
