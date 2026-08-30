'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getStudentId, getToken } from '@/lib/client-auth';

type Prompt = {
  id: string;
  title: string;
  description: string;
  prompt_type: string;
  module_id: number;
  hint_points: string[];
  time_limit_minutes: number;
  is_locked: boolean;
};

type AttemptRow = {
  draft_number: number;
  content: string;
  plan_content: string | null;
};

function debugSecondsFromUrl(): number | null {
  if (typeof window === 'undefined') return null;
  if (window.location.hostname !== 'localhost') return null;
  const raw = Number(new URLSearchParams(window.location.search).get('seconds'));
  if (!Number.isFinite(raw) || raw < 5 || raw > 120) return null;
  return Math.floor(raw);
}

export default function WritingPracticePage() {
  const params = useParams<{ promptId: string }>();
  const router = useRouter();
  const promptId = params.promptId;

  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [plan, setPlan] = useState('');
  const [content, setContent] = useState('');
  const [draftNumber, setDraftNumber] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(30 * 60);
  const [startedAt] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [unitLocked, setUnitLocked] = useState(false);
  const [alreadyFinished, setAlreadyFinished] = useState(false);

  const contentRef = useRef(content);
  const planRef = useRef(plan);
  const draftRef = useRef(draftNumber);
  const submittingRef = useRef(false);
  const timedOutRef = useRef(false);
  contentRef.current = content;
  planRef.current = plan;
  draftRef.current = draftNumber;

  const wordCount = useMemo(
    () => content.trim().split(/\s+/).filter(Boolean).length,
    [content],
  );

  const paperClosed = timedOut || secondsLeft <= 0;

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
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
        const [promptRes, attemptsRes] = await Promise.all([
          fetch(`/api/prompts?id=${promptId}&student_id=${studentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/writing/attempt?student_id=${studentId}&prompt_id=${promptId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const promptData = await promptRes.json();
        const attemptsData = await attemptsRes.json();

        if (!promptRes.ok) {
          throw new Error(promptData.error || 'Failed to load prompt');
        }
        if (!attemptsRes.ok) {
          throw new Error(attemptsData.error || 'Failed to load attempts');
        }

        if (promptData.unit_locked) {
          setUnitLocked(true);
          setPrompt(promptData.prompt as Prompt);
          return;
        }

        const p = promptData.prompt as Prompt;
        const hints = Array.isArray(p.hint_points) ? p.hint_points : [];
        setPrompt({ ...p, hint_points: hints });

        const attempts = (attemptsData.attempts as AttemptRow[] | undefined) ?? [];
        const maxDraft = attempts.reduce(
          (max, a) => Math.max(max, a.draft_number),
          0,
        );

        if (maxDraft >= 3) {
          setAlreadyFinished(true);
          return;
        }

        const nextDraft = Math.min(maxDraft + 1, 3);
        setDraftNumber(nextDraft);

        const previous = attempts.find((a) => a.draft_number === maxDraft);
        if (previous && nextDraft > 1) {
          setContent(previous.content ?? '');
          setPlan(previous.plan_content ?? '');
        }

        const debugSeconds = debugSecondsFromUrl();
        setSecondsLeft(debugSeconds ?? (p.time_limit_minutes || 30) * 60);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load writing task');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [promptId, router]);

  async function submitAttempt(fromTimeout: boolean) {
    if (submittingRef.current) return;
    const token = getToken();
    const studentId = getStudentId();
    if (!token || !studentId || !prompt) return;

    const text = contentRef.current.trim();
    if (!text) {
      if (fromTimeout) {
        setTimedOut(true);
        setError(
          'Time is up. The paper is closed. Next time, write before the timer ends.',
        );
      }
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const timeSpentSeconds = Math.max(
        0,
        Math.floor((Date.now() - startedAt) / 1000),
      );
      const res = await fetch('/api/writing/attempt', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
          prompt_id: prompt.id,
          draft_number: draftRef.current,
          content: contentRef.current,
          plan_content: planRef.current,
          time_spent_seconds: timeSpentSeconds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Submit failed');
      }
      router.push(`/dashboard/writing/${prompt.id}/results`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!prompt || loading || unitLocked || alreadyFinished) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (!timedOutRef.current) {
            timedOutRef.current = true;
            setTimedOut(true);
            void submitAttempt(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
    // submitAttempt is stable enough via refs; we only start the clock once loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt, loading, unitLocked, alreadyFinished]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await submitAttempt(false);
  }

  if (loading) {
    return <main className="mx-auto max-w-4xl p-6">Loading writing task…</main>;
  }

  if (unitLocked && prompt) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 p-6">
        <h1 className="text-2xl font-semibold text-stone-900">{prompt.title}</h1>
        <p className="text-stone-700">
          This task is in a locked unit. Finish unit {prompt.module_id - 1} first.
        </p>
        <Link href="/dashboard" className="text-sm text-indigo-700 underline">
          Back to dashboard
        </Link>
      </main>
    );
  }

  if (alreadyFinished) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 p-6">
        <p className="text-stone-700">
          All three drafts are done for this task.
        </p>
        <Link
          href={`/dashboard/writing/${promptId}/results`}
          className="text-sm text-indigo-700 underline"
        >
          View results
        </Link>
      </main>
    );
  }

  if (!prompt) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <p className="text-red-700">{error || 'Prompt unavailable'}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-stone-300 pb-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-stone-500">
            Unit {prompt.module_id} · Draft {draftNumber}/3 · {prompt.prompt_type}
          </p>
          <h1 className="text-3xl font-semibold text-stone-900">{prompt.title}</h1>
          {draftNumber > 1 ? (
            <p className="mt-2 text-sm text-stone-600">
              Your previous draft is copied in so you can revise it.
            </p>
          ) : null}
        </div>
        <div
          className={`rounded-md px-3 py-2 font-mono text-lg ${
            secondsLeft < 60 ? 'bg-red-100 text-red-800' : 'bg-stone-100 text-stone-800'
          }`}
        >
          {mm}:{ss}
        </div>
      </header>

      {error ? <p className="rounded-md bg-red-50 p-3 text-red-800">{error}</p> : null}

      {paperClosed ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Time is up. The paper is closed.
        </p>
      ) : null}

      <section className="space-y-3 rounded-lg border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-medium">Prompt</h2>
        <p className="whitespace-pre-wrap text-stone-800">{prompt.description}</p>
        <div>
          <h3 className="mb-2 font-medium">Hint points</h3>
          <ul className="list-disc space-y-1 pl-5 text-stone-700">
            {prompt.hint_points.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>
        </div>
      </section>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-2">
          <span className="font-medium">Planning / notes</span>
          <textarea
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            rows={5}
            disabled={paperClosed || submitting}
            className="w-full rounded-md border border-stone-300 p-3 disabled:bg-stone-50"
            placeholder="Use this space to plan structure, audience, and key ideas…"
          />
        </label>

        <label className="block space-y-2">
          <span className="font-medium">Your writing</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            required
            disabled={paperClosed || submitting}
            className="w-full rounded-md border border-stone-300 p-3 disabled:bg-stone-50"
            placeholder="Write your full response here…"
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-stone-600">{wordCount} words</p>
          <button
            type="submit"
            disabled={submitting || !content.trim() || draftNumber > 3 || paperClosed}
            className="rounded-md bg-stone-900 px-4 py-2 text-white disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit attempt'}
          </button>
        </div>
      </form>
    </main>
  );
}
