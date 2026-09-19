'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, getStudentId, getToken } from '@/lib/client-auth';
import { MathsStimulus } from '@/components/maths/stimulus';
import { SeedAwardBanner } from '@/components/writing/seed-patch';
import { getEarlyMathUnit, type EarlyMathKind, type MathStimulus } from '@/lib/early-math';

type Item = {
  slug: string;
  unitId: number;
  kind: EarlyMathKind;
  title: string;
  stem: string;
  stimulus?: MathStimulus;
  options: string[];
  parentPrompt: string;
};

export default function MathsPracticePage() {
  const params = useParams<{ unitId: string; slug: string }>();
  const router = useRouter();
  const unitId = Number(params.unitId);
  const unit = getEarlyMathUnit(unitId);
  const [item, setItem] = useState<Item | null>(null);
  const [nextSlug, setNextSlug] = useState<string | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [result, setResult] = useState<{
    isCorrect: boolean;
    explanation: string;
    parentPrompt: string;
  } | null>(null);
  const [award, setAward] = useState<{
    total: number;
    lines: { seeds: number; label: string }[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      setChosen(null);
      setAnswerText('');
      setResult(null);
      setAward(null);
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
          `/api/maths/items?slug=${encodeURIComponent(params.slug)}&student_id=${studentId}`,
        );
        if (!res.response.ok) throw new Error(res.data.error || 'Could not load the question');
        setItem(res.data.item as Item);
        setNextSlug(typeof res.data.nextSlug === 'string' ? res.data.nextSlug : null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load the question');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [params.slug, router]);

  async function onSubmit() {
    const studentId = getStudentId();
    if (!studentId || !item || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch('/api/maths/items', {
        method: 'POST',
        body: JSON.stringify({
          student_id: studentId,
          slug: item.slug,
          answer_index: chosen,
          answer_text: answerText,
        }),
      });
      if (!res.response.ok) throw new Error(res.data.error || 'Could not check that answer');
      setResult({
        isCorrect: Boolean(res.data.isCorrect),
        explanation: String(res.data.explanation ?? ''),
        parentPrompt: String(res.data.parentPrompt ?? item.parentPrompt),
      });
      setAward(res.data.award ?? null);
      if (typeof res.data.nextSlug === 'string') setNextSlug(res.data.nextSlug);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not check that answer');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <main className="mx-auto max-w-2xl p-6">Loading question…</main>;

  return (
    <main className="mx-auto max-w-2xl space-y-5 p-6">
      <Link
        href={`/dashboard/maths/unit/${unitId}`}
        className="text-sm text-brand hover:underline"
      >
        ← {unit?.title ?? 'Maths unit'}
      </Link>
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      {item ? (
        <section className="space-y-4 rounded-lg border border-warm-border bg-warm-card p-6 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">
            Sit together · short and kind
          </p>
          <h1 className="text-2xl font-semibold text-warm-ink">{item.title}</h1>
          <p className="text-lg leading-relaxed text-warm-ink">{item.stem}</p>
          <MathsStimulus stimulus={item.stimulus} />
          {item.kind === 'count' ? (
            <input
              value={answerText}
              onChange={(event) => setAnswerText(event.target.value)}
              inputMode="numeric"
              placeholder="Type the number"
              disabled={Boolean(result)}
              className="w-full rounded-lg border border-warm-border px-3 py-3 text-lg"
            />
          ) : (
            <div className="grid gap-2">
              {item.options.map((option, index) => (
                <button
                  key={option}
                  type="button"
                  disabled={Boolean(result)}
                  onClick={() => setChosen(index)}
                  className={`rounded-lg border px-4 py-3 text-left ${
                    chosen === index
                      ? 'border-brand bg-[#EEF6F0] text-brand-dark'
                      : 'border-warm-border bg-white hover:border-brand'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
          {!result ? (
            <button
              type="button"
              onClick={() => void onSubmit()}
              disabled={
                submitting ||
                (item.kind === 'count' ? answerText.trim().length === 0 : chosen === null)
              }
              className="rounded-full bg-terracotta px-5 py-2.5 text-sm font-medium text-white hover:bg-terracotta-hover disabled:opacity-60"
            >
              {submitting ? 'Checking…' : 'Check'}
            </button>
          ) : (
            <div className="space-y-3">
              <p
                className={`rounded-lg px-3 py-2 text-sm ${
                  result.isCorrect
                    ? 'bg-[#E3EFE6] text-brand-dark'
                    : 'bg-amber-50 text-amber-950'
                }`}
              >
                {result.isCorrect ? 'Yes.' : 'Not quite.'} {result.explanation}
              </p>
              <p className="text-sm text-warm-muted">
                <span className="font-medium text-warm-ink">For the parent: </span>
                {result.parentPrompt}
              </p>
              {award ? <SeedAwardBanner total={award.total} lines={award.lines} /> : null}
              <div className="flex flex-wrap gap-2">
                {nextSlug ? (
                  <Link
                    href={`/dashboard/maths/unit/${unitId}/practice/${nextSlug}`}
                    className="rounded-full bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-hover"
                  >
                    Next question
                  </Link>
                ) : (
                  <Link
                    href={`/dashboard/maths/unit/${unitId}`}
                    className="rounded-full bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-hover"
                  >
                    Back to the unit
                  </Link>
                )}
              </div>
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}
