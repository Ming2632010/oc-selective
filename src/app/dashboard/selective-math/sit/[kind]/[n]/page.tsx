'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getStudentId, getToken } from '@/lib/client-auth';
import {
  examMathMetaLine,
  examMathNotReadyMessage,
  findExamMathSet,
  type ExamMathSetKind,
} from '@/lib/exam-math';

function isSetKind(value: string): value is ExamMathSetKind {
  return value === 'mini' || value === 'paper';
}

export default function SelectiveMathSitPage() {
  const params = useParams<{ kind: string; n: string }>();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const set = useMemo(() => {
    if (!isSetKind(params.kind)) return null;
    const setNumber = Number(params.n);
    if (!Number.isInteger(setNumber)) return null;
    return findExamMathSet(params.kind, setNumber);
  }, [params.kind, params.n]);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    if (!getStudentId()) {
      router.replace('/dashboard');
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return <main className="mx-auto max-w-3xl p-6">Loading…</main>;
  }

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

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <p className="text-sm uppercase tracking-wide text-warm-subtle">Selective Math</p>
      <h1 className="font-serif text-3xl font-semibold text-warm-ink">{set.title}</h1>
      <p className="text-sm text-warm-muted">
        {examMathMetaLine(set.questionCount, set.timeLimitSeconds)}
      </p>
      <p className="rounded-lg border border-dashed border-warm-border bg-white p-5 text-sm text-warm-ink">
        {examMathNotReadyMessage(set.kind)}
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href={set.kind === 'mini' ? '/dashboard/selective-math/mini' : '/dashboard/selective-math/papers'}
          className="rounded-full border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-[#EDF3ED]"
        >
          Back to {set.kind === 'mini' ? 'mini exams' : 'papers'}
        </Link>
        <Link
          href="/dashboard/selective-math/sit/preview"
          className="rounded-full bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-hover"
        >
          Try the computer test screen
        </Link>
      </div>
    </main>
  );
}
