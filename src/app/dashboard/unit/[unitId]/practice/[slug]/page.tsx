'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, getStudentId, getToken } from '@/lib/client-auth';
import { MINI_SKILL_LABELS, type MiniSkill } from '@/lib/seed-mini-drills';
import { getUnitInfo } from '@/lib/units';

type Drill = {
  slug: string;
  module_id: number;
  skill: MiniSkill;
  title: string;
  stem: string;
  options: string[];
};

export default function MiniPracticePage() {
  const params = useParams<{ unitId: string; slug: string }>();
  const router = useRouter();
  const unitId = Number(params.unitId);
  const slug = params.slug;
  const unitInfo = getUnitInfo(unitId);

  const [drill, setDrill] = useState<Drill | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [result, setResult] = useState<{
    is_correct: boolean;
    correct_index: number;
    explanation: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
      try {
        const res = await apiFetch(
          `/api/writing/drills?slug=${encodeURIComponent(slug)}&student_id=${studentId}`,
        );
        if (!res.response.ok) {
          throw new Error(res.data.error || 'Failed to load question');
        }
        setDrill(res.data.drill as Drill);
        if (res.data.last_attempt && res.data.reveal) {
          setChosen(res.data.last_attempt.answer_index as number);
          setResult({
            is_correct: Boolean(res.data.last_attempt.is_correct),
            correct_index: res.data.reveal.correct_index as number,
            explanation: res.data.reveal.explanation as string,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load question');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [slug, router]);

  async function submit(index: number) {
    if (!drill || result || submitting) return;
    const studentId = getStudentId();
    if (!studentId) return;
    setSubmitting(true);
    setError(null);
    setChosen(index);
    try {
      const res = await apiFetch('/api/writing/drills', {
        method: 'POST',
        body: JSON.stringify({
          student_id: studentId,
          slug: drill.slug,
          answer_index: index,
        }),
      });
      if (!res.response.ok) {
        throw new Error(res.data.error || 'Could not save answer');
      }
      setResult({
        is_correct: Boolean(res.data.is_correct),
        correct_index: res.data.correct_index as number,
        explanation: res.data.explanation as string,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save answer');
      setChosen(null);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-3xl p-6">Loading question…</main>;
  }

  if (!drill) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="text-red-700">{error || 'Question not found.'}</p>
        <Link href={`/dashboard/unit/${unitId}`} className="mt-4 inline-block underline">
          Back to unit
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="border-b border-stone-300 pb-4">
        <Link
          href={`/dashboard/unit/${unitId}`}
          className="text-sm text-stone-500 hover:underline"
        >
          ← Back to {unitInfo.title}
        </Link>
        <p className="mt-2 text-sm uppercase tracking-wide text-indigo-700">
          Mini practice · {MINI_SKILL_LABELS[drill.skill] ?? drill.skill}
        </p>
        <h1 className="text-3xl font-semibold text-stone-900">{drill.title}</h1>
      </header>

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <p className="text-lg text-stone-800">{drill.stem}</p>

      <ul className="space-y-2">
        {drill.options.map((option, index) => {
          const selected = chosen === index;
          const showMark = Boolean(result);
          const isRight = result?.correct_index === index;
          let classes =
            'w-full rounded-lg border px-4 py-3 text-left text-sm transition ';
          if (showMark && isRight) {
            classes += 'border-emerald-400 bg-emerald-50 text-emerald-900';
          } else if (showMark && selected && !isRight) {
            classes += 'border-red-300 bg-red-50 text-red-900';
          } else if (selected) {
            classes += 'border-indigo-400 bg-indigo-50';
          } else {
            classes += 'border-stone-200 bg-white hover:border-stone-400';
          }

          return (
            <li key={option}>
              <button
                type="button"
                disabled={Boolean(result) || submitting}
                onClick={() => void submit(index)}
                className={classes}
              >
                {option}
              </button>
            </li>
          );
        })}
      </ul>

      {result ? (
        <section
          className={`rounded-lg border px-4 py-3 text-sm ${
            result.is_correct
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-amber-200 bg-amber-50 text-amber-950'
          }`}
        >
          <p className="font-medium">
            {result.is_correct ? 'Correct.' : 'Not quite.'}
          </p>
          <p className="mt-2">{result.explanation}</p>
        </section>
      ) : (
        <p className="text-sm text-stone-500">Choose an answer. You will see why it is right or wrong straight away.</p>
      )}

      <Link
        href={`/dashboard/unit/${unitId}`}
        className="inline-flex rounded-md border border-stone-300 px-4 py-2 text-sm"
      >
        Back to unit
      </Link>
    </main>
  );
}
