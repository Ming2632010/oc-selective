'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, getStudentId, getToken } from '@/lib/client-auth';
import { MathsStimulus } from '@/components/maths/stimulus';
import { PictureTray } from '@/components/maths/toys';
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

  const pictures = pictureChoices(item?.stimulus);
  const tileAnswers = Boolean(
    !pictures &&
      item &&
      item.options.length > 0 &&
      item.options.every((option) => option.length <= 8),
  );

  if (loading) {
    return <main className="min-h-dvh bg-[#FFF8E8] p-6 text-warm-ink">Loading…</main>;
  }

  return (
    <main className="min-h-dvh bg-[#FFF8E8] px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-5">
        <Link
          href={`/dashboard/maths/unit/${unitId}`}
          className="inline-flex text-sm text-warm-muted hover:text-warm-ink"
        >
          ← {unit?.title ?? 'Back'}
        </Link>
        {error ? (
          <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}
        {item ? (
          <section className="space-y-6 rounded-[2rem] border-2 border-[#E8D9B0] bg-[#FFFCF3] p-5 shadow-[3px_5px_0_rgba(61,53,46,0.08)] sm:p-8">
            <h1 className="sr-only">{item.title}</h1>
            <p className="sr-only">{item.stem}</p>
            {item.stimulus?.type === 'oddOneOut' ? null : (
              <MathsStimulus stimulus={item.stimulus} />
            )}
            <p className="text-center text-3xl leading-snug font-semibold text-warm-ink sm:text-4xl">
              {kidAsk(item)}
            </p>
            {pictures ? (
              <div
                className={`grid grid-cols-2 gap-3 ${
                  pictures.length === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3'
                }`}
              >
                {pictures.map((picture, index) => (
                  <button
                    key={`${picture.icon}-${index}`}
                    type="button"
                    disabled={Boolean(result)}
                    onClick={() => setChosen(index)}
                    aria-label={item.options[index] ?? `Picture ${index + 1}`}
                    className={`rounded-[1.4rem] border-[3px] px-3 py-3 ${
                      chosen === index
                        ? 'border-[#2D5A4A] bg-[#EEF6F0]'
                        : 'border-[#E8D9B0] bg-white hover:border-terracotta'
                    }`}
                  >
                    <PictureTray
                      icon={picture.icon}
                      count={picture.count}
                      color={picture.color}
                    />
                  </button>
                ))}
              </div>
            ) : item.kind === 'count' ? (
              <NumberPad
                value={answerText}
                disabled={Boolean(result)}
                onChange={setAnswerText}
              />
            ) : (
              <div
                className={
                  tileAnswers
                    ? 'grid grid-cols-2 gap-3 sm:grid-cols-4'
                    : 'grid gap-3'
                }
              >
                {item.options.map((option, index) => (
                  <button
                    key={option}
                    type="button"
                    disabled={Boolean(result)}
                    onClick={() => setChosen(index)}
                    className={`${
                      tileAnswers
                        ? 'min-h-20 rounded-[1.4rem] text-3xl font-bold'
                        : 'rounded-2xl px-4 py-4 text-left text-lg font-medium'
                    } border-[3px] ${
                      chosen === index
                        ? 'border-[#2D5A4A] bg-[#EEF6F0] text-brand-dark'
                        : 'border-[#E8D9B0] bg-white text-warm-ink hover:border-terracotta'
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
                className="flex w-full items-center justify-center rounded-[1.6rem] bg-terracotta py-4 text-2xl font-semibold text-white hover:bg-terracotta-hover disabled:opacity-50"
              >
                {submitting ? '…' : 'Check'}
              </button>
            ) : (
              <div className="space-y-4">
                <p
                  className={`rounded-2xl px-4 py-3 text-lg font-medium ${
                    result.isCorrect
                      ? 'bg-[#E3EFE6] text-brand-dark'
                      : 'bg-[#FFF1D6] text-warm-ink'
                  }`}
                >
                  {result.isCorrect ? 'Yes!' : 'Try again next time.'} {result.explanation}
                </p>
                <details className="rounded-2xl bg-white/70 px-4 py-3 text-sm text-warm-muted">
                  <summary className="cursor-pointer font-medium text-warm-ink">Grown-ups</summary>
                  <p className="mt-2">{item.stem}</p>
                  <p className="mt-2">{result.parentPrompt}</p>
                </details>
                {award ? <SeedAwardBanner total={award.total} lines={award.lines} /> : null}
                {nextSlug ? (
                  <Link
                    href={`/dashboard/maths/unit/${unitId}/practice/${nextSlug}`}
                    className="flex w-full items-center justify-center rounded-[1.6rem] bg-terracotta py-4 text-2xl font-semibold text-white hover:bg-terracotta-hover"
                  >
                    Next
                  </Link>
                ) : (
                  <Link
                    href={`/dashboard/maths/unit/${unitId}`}
                    className="flex w-full items-center justify-center rounded-[1.6rem] bg-terracotta py-4 text-2xl font-semibold text-white hover:bg-terracotta-hover"
                  >
                    Done
                  </Link>
                )}
              </div>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}

function pictureChoices(stimulus?: MathStimulus) {
  if (!stimulus || !('type' in stimulus)) return null;
  if (stimulus.type === 'matchNumber') {
    return stimulus.choices.map((choice) => ({
      icon: choice.icon,
      count: choice.count,
      color: undefined as string | undefined,
    }));
  }
  if (stimulus.type === 'oddOneOut') {
    return stimulus.items.map((item) => ({
      icon: item.icon,
      count: item.count ?? 1,
      color: item.color,
    }));
  }
  return null;
}

function kidAsk(item: Item) {
  const stimulus = item.stimulus;
  if (!stimulus || !('type' in stimulus)) return item.stem;
  if (stimulus.type === 'tenFrame' || stimulus.type === 'dots' || stimulus.type === 'fingers') {
    return 'How many?';
  }
  if (stimulus.type === 'numberTrack' && stimulus.missing?.length) {
    return 'What number is missing?';
  }
  if (stimulus.type === 'matchNumber') return `Which one is ${stimulus.target}?`;
  if (stimulus.type === 'howManyMore') return 'How many more?';
  if (stimulus.type === 'oddOneOut') return 'Which one is different?';
  if (stimulus.type === 'pattern') return 'What comes next?';
  if (stimulus.type === 'partWhole') return 'What is the missing part?';
  if (stimulus.type === 'clock') return 'What time is it?';
  if (stimulus.type === 'sharing') return 'How many for each?';
  return item.stem;
}

function NumberPad({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled: boolean;
}) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  return (
    <div className="space-y-4">
      <p className="text-center text-6xl font-bold text-warm-ink">{value || '?'}</p>
      <div className="mx-auto grid max-w-xs grid-cols-5 gap-2">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => onChange(value.length >= 3 ? value : `${value}${key}`)}
            className="flex h-14 items-center justify-center rounded-2xl border-[3px] border-[#E8D9B0] bg-white text-2xl font-bold text-warm-ink hover:border-terracotta disabled:opacity-60"
          >
            {key}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={disabled || value.length === 0}
        onClick={() => onChange(value.slice(0, -1))}
        className="mx-auto block text-sm font-medium text-warm-muted hover:text-warm-ink disabled:opacity-40"
      >
        Clear last
      </button>
    </div>
  );
}
