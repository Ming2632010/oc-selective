'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getStudentId, getToken } from '@/lib/client-auth';

type Attempt = {
  id: string;
  draft_number: number;
  score_set_a: number;
  score_set_b: number;
  overall_score: number;
  scores_breakdown: {
    structure: number;
    vocabulary: number;
    audience: number;
    grammar: number;
  };
  ai_feedback: string;
  checked_hint_1: boolean;
  checked_hint_2: boolean;
  checked_hint_3: boolean;
  word_count: number;
  has_seen_sample: boolean;
};

type Prompt = {
  id: string;
  title: string;
  hint_points: string[];
  sample_answer_high?: string;
  sample_answer_medium?: string;
};

export default function WritingResultsPage() {
  const params = useParams<{ promptId: string }>();
  const router = useRouter();
  const promptId = params.promptId;

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [samplesUnlocked, setSamplesUnlocked] = useState(false);
  const [showSamples, setShowSamples] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        const [attemptsRes, promptRes] = await Promise.all([
          fetch(`/api/writing/attempt?student_id=${studentId}&prompt_id=${promptId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/prompts?id=${promptId}&student_id=${studentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const attemptsData = await attemptsRes.json();
        const promptData = await promptRes.json();

        if (!attemptsRes.ok) throw new Error(attemptsData.error || 'Failed to load attempts');
        if (!promptRes.ok) throw new Error(promptData.error || 'Failed to load prompt');

        const attempts = (attemptsData.attempts as Attempt[]) || [];
        const latest = attempts[attempts.length - 1] ?? null;
        setAttempt(latest);
        setPrompt({
          ...promptData.prompt,
          hint_points: Array.isArray(promptData.prompt.hint_points)
            ? promptData.prompt.hint_points
            : [],
        });
        setSamplesUnlocked(Boolean(promptData.samples_unlocked));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load results');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [promptId, router]);

  const hints = useMemo(() => {
    if (!prompt || !attempt) return [];
    return [
      { label: prompt.hint_points[0] || 'Hint 1', checked: attempt.checked_hint_1 },
      { label: prompt.hint_points[1] || 'Hint 2', checked: attempt.checked_hint_2 },
      { label: prompt.hint_points[2] || 'Hint 3', checked: attempt.checked_hint_3 },
    ];
  }, [prompt, attempt]);

  if (loading) {
    return <main className="mx-auto max-w-4xl p-6">Loading results…</main>;
  }

  if (error || !attempt || !prompt) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <p className="text-red-700">{error || 'No attempt found yet.'}</p>
        <Link href={`/dashboard/writing/${promptId}`} className="mt-4 inline-block underline">
          Back to writing
        </Link>
      </main>
    );
  }

  const breakdown = attempt.scores_breakdown || {
    structure: 0,
    vocabulary: 0,
    audience: 0,
    grammar: 0,
  };

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="border-b border-stone-300 pb-4">
        <p className="text-sm uppercase tracking-wide text-stone-500">
          Results · Draft {attempt.draft_number}/3
        </p>
        <h1 className="text-3xl font-semibold">{prompt.title}</h1>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <ScoreCard label="Set A" value={`${attempt.score_set_a}/15`} />
        <ScoreCard label="Set B" value={`${attempt.score_set_b}/10`} />
        <ScoreCard label="Overall" value={`${attempt.overall_score}/25`} />
      </section>

      <section className="rounded-lg border border-stone-200 p-4">
        <h2 className="mb-3 text-lg font-medium">Four-dimension breakdown</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          <li>Structure: {breakdown.structure}/5</li>
          <li>Vocabulary: {breakdown.vocabulary}/5</li>
          <li>Audience: {breakdown.audience}/5</li>
          <li>Grammar: {breakdown.grammar}/5</li>
        </ul>
        <p className="mt-3 text-sm text-stone-600">{attempt.word_count} words</p>
      </section>

      <section className="rounded-lg border border-stone-200 p-4">
        <h2 className="mb-2 text-lg font-medium">AI feedback</h2>
        <p className="whitespace-pre-wrap text-stone-800">{attempt.ai_feedback}</p>
      </section>

      <section className="rounded-lg border border-stone-200 p-4">
        <h2 className="mb-2 text-lg font-medium">Hint checklist</h2>
        <ul className="space-y-2">
          {hints.map((hint) => (
            <li key={hint.label} className="flex gap-2">
              <span>{hint.checked ? '✓' : '✗'}</span>
              <span>{hint.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        {attempt.draft_number < 3 ? (
          <Link
            href={`/dashboard/writing/${promptId}`}
            className="rounded-md bg-stone-900 px-4 py-2 text-white"
          >
            Revise &amp; Resubmit (Draft {attempt.draft_number + 1})
          </Link>
        ) : null}

        {samplesUnlocked ? (
          <button
            type="button"
            onClick={() => setShowSamples((v) => !v)}
            className="rounded-md border border-stone-900 px-4 py-2"
          >
            {showSamples ? 'Hide sample answers' : 'View Sample Answer'}
          </button>
        ) : (
          <p className="text-sm text-stone-600">
            Sample answers unlock after Draft 3.
          </p>
        )}
      </div>

      {showSamples && samplesUnlocked ? (
        <section className="space-y-4 rounded-lg border border-stone-200 p-4">
          <div>
            <h3 className="font-medium">High-scoring sample</h3>
            <p className="mt-2 whitespace-pre-wrap text-stone-800">
              {prompt.sample_answer_high || 'Sample unavailable.'}
            </p>
          </div>
          <div>
            <h3 className="font-medium">Medium-scoring sample</h3>
            <p className="mt-2 whitespace-pre-wrap text-stone-800">
              {prompt.sample_answer_medium || 'Sample unavailable.'}
            </p>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function ScoreCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
