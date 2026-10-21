'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, getStudentId, getToken } from '@/lib/client-auth';
import { ExamMathPlayer } from '@/components/exam-math/player';
import {
  examMathNotReadyMessage,
  findExamMathSet,
  type ExamMathQuestion,
  type ExamMathSetKind,
} from '@/lib/exam-math';

function isSetKind(value: string): value is ExamMathSetKind {
  return value === 'mini' || value === 'paper';
}

export default function SelectiveMathSitPage() {
  const params = useParams<{ kind: string; n: string }>();
  const router = useRouter();
  const [questions, setQuestions] = useState<ExamMathQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultsNote, setResultsNote] = useState<string | null>(null);

  const set = useMemo(() => {
    if (!isSetKind(params.kind)) return null;
    const setNumber = Number(params.n);
    if (!Number.isInteger(setNumber)) return null;
    return findExamMathSet(params.kind, setNumber);
  }, [params.kind, params.n]);

  useEffect(() => {
    async function load() {
      if (!getToken()) {
        router.replace('/login');
        return;
      }
      const studentId = getStudentId();
      if (!studentId) {
        router.replace('/dashboard');
        return;
      }
      if (!set) return;
      const res = await apiFetch(
        `/api/exam-math/questions?kind=${set.kind}&n=${set.setNumber}&student_id=${studentId}`,
      );
      if (!res.response.ok) {
        setError(typeof res.data.error === 'string' ? res.data.error : 'Could not load this set.');
        setQuestions([]);
        return;
      }
      setQuestions(Array.isArray(res.data.questions) ? res.data.questions : []);
    }
    void load();
  }, [router, set]);

  if (!set) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 p-6">
        <h1 className="font-serif text-2xl font-semibold text-warm-ink">Set not found</h1>
        <Link href="/dashboard/selective-math" className="text-sm font-medium text-brand">
          Back to Selective Math
        </Link>
      </main>
    );
  }

  if (questions === null) {
    return <main className="mx-auto max-w-3xl p-6">Loading…</main>;
  }

  if (questions.length === 0) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 p-6">
        <p className="text-sm uppercase tracking-wide text-warm-subtle">Selective Math</p>
        <h1 className="font-serif text-3xl font-semibold text-warm-ink">{set.title}</h1>
        <p className="rounded-lg border border-dashed border-warm-border bg-white p-5 text-sm text-warm-ink">
          {error ?? examMathNotReadyMessage(set.kind)}
        </p>
        <Link
          href={set.kind === 'mini' ? '/dashboard/selective-math/mini' : '/dashboard/selective-math/papers'}
          className="text-sm font-medium text-brand"
        >
          Back to {set.kind === 'mini' ? 'mini exams' : 'papers'}
        </Link>
      </main>
    );
  }

  return (
    <ExamMathPlayer
      kind={set.kind}
      title={set.title}
      timeLimitSeconds={set.timeLimitSeconds}
      questions={questions}
      exitHref={set.kind === 'mini' ? '/dashboard/selective-math/mini' : '/dashboard/selective-math/papers'}
      exitLabel={`Back to ${set.kind === 'mini' ? 'mini exams' : 'papers'}`}
      resultsNote={resultsNote}
      onComplete={async ({ answers, timedOut, timerHidden }) => {
        const studentId = getStudentId();
        if (!studentId) return;
        const res = await apiFetch('/api/exam-math/sittings', {
          method: 'POST',
          body: JSON.stringify({
            student_id: studentId,
            kind: set.kind,
            n: set.setNumber,
            answers: questions.map((question, index) => ({
              id: question.id,
              chosen: answers[index]?.chosen ?? null,
              flagged: Boolean(answers[index]?.flagged),
            })),
            timed_out: timedOut,
            timer_hidden: timerHidden,
          }),
        });
        if (!res.response.ok) {
          setResultsNote('The sitting was marked on this screen, but Strengthen could not be updated.');
          return;
        }
        const open = Number(res.data.openWrongCount ?? 0);
        setResultsNote(
          open === 0
            ? 'No types were added to Strengthen.'
            : `${open} type${open === 1 ? '' : 's'} ${open === 1 ? 'is' : 'are'} on Strengthen for the same reasoning with new numbers.`,
        );
      }}
    />
  );
}
