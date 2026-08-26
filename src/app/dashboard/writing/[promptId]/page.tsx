'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
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

  const wordCount = useMemo(
    () => content.trim().split(/\s+/).filter(Boolean).length,
    [content],
  );

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

        const p = promptData.prompt as Prompt;
        const hints = Array.isArray(p.hint_points) ? p.hint_points : [];
        setPrompt({ ...p, hint_points: hints });
        setSecondsLeft((p.time_limit_minutes || 30) * 60);

        const maxDraft =
          (attemptsData.attempts as { draft_number: number }[] | undefined)?.reduce(
            (max, a) => Math.max(max, a.draft_number),
            0,
          ) ?? 0;
        setDraftNumber(Math.min(maxDraft + 1, 3));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load writing task');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [promptId, router]);

  useEffect(() => {
    if (!prompt || loading) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [prompt, loading]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const token = getToken();
    const studentId = getStudentId();
    if (!token || !studentId || !prompt) return;

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
          draft_number: draftNumber,
          content,
          plan_content: plan,
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
      setSubmitting(false);
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-4xl p-6">Loading writing task…</main>;
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
            className="w-full rounded-md border border-stone-300 p-3"
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
            className="w-full rounded-md border border-stone-300 p-3"
            placeholder="Write your full response here…"
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-stone-600">{wordCount} words</p>
          <button
            type="submit"
            disabled={submitting || !content.trim() || draftNumber > 3}
            className="rounded-md bg-stone-900 px-4 py-2 text-white disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit attempt'}
          </button>
        </div>
      </form>
    </main>
  );
}
