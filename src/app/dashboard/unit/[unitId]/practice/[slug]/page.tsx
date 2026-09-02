'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, getStudentId, getToken } from '@/lib/client-auth';
import { SeedAwardBanner } from '@/components/writing/seed-patch';
import {
  MINI_ITEM_KIND_LABELS,
  type ChecklistItem,
  type MiniItemKind,
} from '@/lib/mini-item-kinds';
import { MINI_SKILL_LABELS, type MiniSkill } from '@/lib/seed-mini-drills';
import { getUnitInfo } from '@/lib/units';

type Drill = {
  slug: string;
  module_id: number;
  skill: MiniSkill;
  title: string;
  stem: string;
  options: string[];
  source?: 'seed' | 'ai';
  item_kind?: MiniItemKind;
  prompt?: {
    sentence?: string;
    misspelled?: string;
    original?: string;
    hint?: string;
    minWords?: number;
    maxWords?: number;
    shuffled?: string[];
    task?: string;
  };
};

type Result = {
  is_correct: boolean;
  correct_index: number | null;
  explanation: string;
  sample?: string | null;
  checks?: ChecklistItem[];
};

function highlightMisspelling(sentence: string, misspelled: string) {
  if (!sentence || !misspelled) return sentence;
  const index = sentence.toLowerCase().indexOf(misspelled.toLowerCase());
  if (index < 0) return sentence;
  return (
    <>
      {sentence.slice(0, index)}
      <mark className="rounded bg-amber-100 px-0.5 font-semibold text-amber-950">
        {sentence.slice(index, index + misspelled.length)}
      </mark>
      {sentence.slice(index + misspelled.length)}
    </>
  );
}

export default function MiniPracticePage() {
  const params = useParams<{ unitId: string; slug: string }>();
  const router = useRouter();
  const unitId = Number(params.unitId);
  const slug = params.slug;
  const unitInfo = getUnitInfo(unitId);

  const [drill, setDrill] = useState<Drill | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [order, setOrder] = useState<number[]>([]);
  const [nextSlug, setNextSlug] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [award, setAward] = useState<{
    total: number;
    lines: { seeds: number; label: string }[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const kind: MiniItemKind = drill?.item_kind ?? 'choice';
  const shuffled = useMemo(
    () => (Array.isArray(drill?.prompt?.shuffled) ? drill.prompt.shuffled : []),
    [drill],
  );

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      setChosen(null);
      setAnswerText('');
      setOrder([]);
      setResult(null);
      setAward(null);
      setDrill(null);
      setNextSlug(null);
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
        const loaded = res.data.drill as Drill;
        setDrill(loaded);
        setNextSlug(
          typeof res.data.next_slug === 'string' ? res.data.next_slug : null,
        );
        const last = res.data.last_attempt as
          | {
              answer_index?: number | null;
              answer_text?: string | null;
              answer_order?: number[] | null;
              is_correct?: boolean;
            }
          | undefined;
        if (last && res.data.reveal) {
          if (typeof last.answer_index === 'number') setChosen(last.answer_index);
          if (typeof last.answer_text === 'string') setAnswerText(last.answer_text);
          if (Array.isArray(last.answer_order)) setOrder(last.answer_order);
          setResult({
            is_correct: Boolean(last.is_correct),
            correct_index:
              typeof res.data.reveal.correct_index === 'number'
                ? (res.data.reveal.correct_index as number)
                : null,
            explanation: res.data.reveal.explanation as string,
            sample:
              typeof res.data.reveal.sample === 'string'
                ? res.data.reveal.sample
                : null,
            checks: Array.isArray(res.data.reveal.checks)
              ? (res.data.reveal.checks as ChecklistItem[])
              : [],
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

  async function submit(payload: {
    answer_index?: number;
    answer_text?: string;
    answer_order?: number[];
  }) {
    if (!drill || result || submitting) return;
    const studentId = getStudentId();
    if (!studentId) return;
    setSubmitting(true);
    setError(null);
    if (typeof payload.answer_index === 'number') setChosen(payload.answer_index);
    try {
      const res = await apiFetch('/api/writing/drills', {
        method: 'POST',
        body: JSON.stringify({
          student_id: studentId,
          slug: drill.slug,
          ...payload,
        }),
      });
      if (!res.response.ok) {
        throw new Error(res.data.error || 'Could not save answer');
      }
      setResult({
        is_correct: Boolean(res.data.is_correct),
        correct_index:
          typeof res.data.correct_index === 'number'
            ? (res.data.correct_index as number)
            : null,
        explanation: res.data.explanation as string,
        sample: typeof res.data.sample === 'string' ? res.data.sample : null,
        checks: Array.isArray(res.data.checks)
          ? (res.data.checks as ChecklistItem[])
          : [],
      });
      if (res.data.award) {
        setAward({
          total: Number(res.data.award.total) || 0,
          lines: (res.data.award.lines as { seeds: number; label: string }[]) || [],
        });
      }
      setNextSlug(
        typeof res.data.next_slug === 'string' ? res.data.next_slug : null,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save answer');
      if (typeof payload.answer_index === 'number') setChosen(null);
    } finally {
      setSubmitting(false);
    }
  }

  function toggleOrder(index: number) {
    if (result || submitting) return;
    setOrder((prev) =>
      prev.includes(index) ? prev.filter((item) => item !== index) : [...prev, index],
    );
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

  const kindLabel = MINI_ITEM_KIND_LABELS[kind] ?? 'Practice';
  const locked = Boolean(result) || submitting;
  const helpText =
    kind === 'spelling'
      ? 'Find the spelling mistake and type the word correctly.'
      : kind === 'rewrite'
        ? 'Rewrite the line. You will see a short checklist after you submit.'
        : kind === 'order'
          ? 'Tap the sentences in the order a marker should read them.'
          : kind === 'short_write'
            ? 'Write one or two sentences. A short checklist will mark your work.'
            : 'Choose an answer. You will see why it is right or wrong straight away.';

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
          Mini practice
          {drill.source === 'ai' ? ' · Extra' : ''} · {kindLabel} ·{' '}
          {MINI_SKILL_LABELS[drill.skill] ?? drill.skill}
        </p>
        <h1 className="text-3xl font-semibold text-stone-900">{drill.title}</h1>
      </header>

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <p className="text-lg text-stone-800">{drill.stem}</p>

      {kind === 'choice' ? (
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
                  disabled={locked}
                  onClick={() => void submit({ answer_index: index })}
                  className={classes}
                >
                  {option}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {kind === 'spelling' ? (
        <section className="space-y-3">
          <p className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-stone-900">
            {highlightMisspelling(
              drill.prompt?.sentence ?? '',
              drill.prompt?.misspelled ?? '',
            )}
          </p>
          <label className="block text-sm font-medium text-stone-700">
            Correct spelling
            <input
              type="text"
              value={answerText}
              disabled={locked}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              onChange={(event) => setAnswerText(event.target.value)}
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-base"
            />
          </label>
          {!result ? (
            <button
              type="button"
              disabled={locked || !answerText.trim()}
              onClick={() => void submit({ answer_text: answerText })}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              Check spelling
            </button>
          ) : null}
        </section>
      ) : null}

      {kind === 'rewrite' ? (
        <section className="space-y-3">
          <blockquote className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-stone-800">
            {drill.prompt?.original}
          </blockquote>
          {drill.prompt?.hint ? (
            <p className="text-sm text-stone-600">{drill.prompt.hint}</p>
          ) : null}
          <label className="block text-sm font-medium text-stone-700">
            Your rewrite
            <textarea
              value={answerText}
              disabled={locked}
              rows={4}
              onChange={(event) => setAnswerText(event.target.value)}
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-base"
            />
          </label>
          {!result ? (
            <button
              type="button"
              disabled={locked || !answerText.trim()}
              onClick={() => void submit({ answer_text: answerText })}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              Check rewrite
            </button>
          ) : null}
        </section>
      ) : null}

      {kind === 'order' ? (
        <section className="space-y-3">
          <ol className="space-y-2">
            {shuffled.map((line, index) => {
              const place = order.indexOf(index);
              const selected = place >= 0;
              return (
                <li key={`${line}-${index}`}>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => toggleOrder(index)}
                    className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm transition ${
                      selected
                        ? 'border-indigo-400 bg-indigo-50'
                        : 'border-stone-200 bg-white hover:border-stone-400'
                    }`}
                  >
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-indigo-700">
                      {selected ? place + 1 : '·'}
                    </span>
                    <span>{line}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          {!result ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={locked || order.length !== shuffled.length}
                onClick={() => void submit({ answer_order: order })}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                Check order
              </button>
              <button
                type="button"
                disabled={locked || order.length === 0}
                onClick={() => setOrder([])}
                className="rounded-md border border-stone-300 px-4 py-2 text-sm"
              >
                Reset
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {kind === 'short_write' ? (
        <section className="space-y-3">
          {drill.prompt?.task ? (
            <p className="rounded-lg border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-950">
              {drill.prompt.task}
            </p>
          ) : null}
          <label className="block text-sm font-medium text-stone-700">
            Your sentences
            <textarea
              value={answerText}
              disabled={locked}
              rows={5}
              onChange={(event) => setAnswerText(event.target.value)}
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-base"
            />
          </label>
          <p className="text-xs text-stone-500">
            Aim for at least {drill.prompt?.minWords ?? 8} words
            {drill.prompt?.maxWords ? ` and no more than ${drill.prompt.maxWords}` : ''}.
          </p>
          {!result ? (
            <button
              type="button"
              disabled={locked || !answerText.trim()}
              onClick={() => void submit({ answer_text: answerText })}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              Check writing
            </button>
          ) : null}
        </section>
      ) : null}

      {result ? (
        <>
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
            {result.checks && result.checks.length > 0 && kind !== 'choice' ? (
              <ul className="mt-2 space-y-1">
                {result.checks.map((check) => (
                  <li key={check.id}>
                    {check.passed ? '✓' : '✗'} {check.label}
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-2">{result.explanation}</p>
            {result.sample && kind !== 'choice' ? (
              <p className="mt-2">
                <span className="font-medium">Sample: </span>
                {result.sample}
              </p>
            ) : null}
          </section>
          {award ? (
            <SeedAwardBanner total={award.total} lines={award.lines} />
          ) : null}
        </>
      ) : (
        <p className="text-sm text-stone-500">{helpText}</p>
      )}

      <div className="flex flex-wrap gap-3">
        {result && nextSlug ? (
          <Link
            href={`/dashboard/unit/${unitId}/practice/${nextSlug}`}
            className="inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Next question
          </Link>
        ) : null}
        <Link
          href={`/dashboard/unit/${unitId}`}
          className="inline-flex rounded-md border border-stone-300 px-4 py-2 text-sm"
        >
          Back to unit
        </Link>
      </div>
    </main>
  );
}
