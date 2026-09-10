'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { SeedAwardBanner } from '@/components/writing/seed-patch';
import { MarkedScript, MarkerSummary } from '@/components/writing/marked-script';
import { markerNotesFromUnknown } from '@/lib/marker-notes';
import { getStudentId, getToken } from '@/lib/client-auth';

type Attempt = {
  id: string;
  draft_number: number;
  content: string;
  marking_status?: 'pending' | 'marking' | 'complete';
  plan_content?: string | null;
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
  marker_notes?: unknown;
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
  kind?: 'practice' | 'test' | 'bonus';
};

export default function WritingResultsPage() {
  const params = useParams<{ promptId: string }>();
  const router = useRouter();
  const promptId = params.promptId;

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [selectedDraft, setSelectedDraft] = useState(1);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [samplesUnlocked, setSamplesUnlocked] = useState(false);
  const [showSamples, setShowSamples] = useState(false);
  const [nextTask, setNextTask] = useState<{
    prompt_id: string;
    title: string;
    next_draft: number;
    reason: string;
  } | null>(null);
  const [awards, setAwards] = useState<{ seeds: number; label: string }[]>([]);
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
        const attemptsRes = await fetch(
          `/api/writing/attempt?student_id=${studentId}&prompt_id=${promptId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const attemptsData = await attemptsRes.json();

        if (!attemptsRes.ok) throw new Error(attemptsData.error || 'Failed to load attempts');

        const loaded = ((attemptsData.attempts as Attempt[]) || [])
          .slice()
          .sort((a, b) => a.draft_number - b.draft_number);
        setAttempts(loaded);
        setSelectedDraft(loaded[loaded.length - 1]?.draft_number ?? 1);
        setPrompt({
          ...attemptsData.prompt,
          hint_points: Array.isArray(attemptsData.prompt.hint_points)
            ? attemptsData.prompt.hint_points
            : [],
          kind:
            attemptsData.prompt.kind === 'bonus' || attemptsData.kind === 'bonus'
              ? 'bonus'
              : attemptsData.prompt.kind === 'test' || attemptsData.kind === 'test'
                ? 'test'
                : 'practice',
        });
        setSamplesUnlocked(Boolean(attemptsData.samples_unlocked));
        setAwards(
          ((attemptsData.awards as { seeds: number; label: string }[]) || []).slice(),
        );
        setNextTask(
          attemptsData.recommendation
            ? {
                prompt_id: attemptsData.recommendation.prompt_id,
                title: attemptsData.recommendation.title,
                next_draft: attemptsData.recommendation.next_draft,
                reason: attemptsData.recommendation.reason,
              }
            : null,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load results');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [promptId, router]);

  useEffect(() => {
    const pending = attempts.find((row) => row.marking_status !== 'complete');
    if (!pending) return;
    const attemptId = pending.id;
    const token = getToken();
    const studentId = getStudentId();
    if (!token || !studentId) return;

    let cancelled = false;
    async function markAndRefresh() {
      await fetch('/api/writing/attempt/mark', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, attempt_id: attemptId }),
      });
      if (!cancelled) window.setTimeout(() => window.location.reload(), 800);
    }
    void markAndRefresh();
    return () => {
      cancelled = true;
    };
  }, [attempts]);

  const attempt =
    attempts.find((row) => row.draft_number === selectedDraft) ??
    attempts[attempts.length - 1] ??
    null;

  const hints = useMemo(() => {
    if (!prompt || !attempt) return [];
    return [
      { label: prompt.hint_points[0] || 'Hint 1', checked: attempt.checked_hint_1 },
      { label: prompt.hint_points[1] || 'Hint 2', checked: attempt.checked_hint_2 },
      { label: prompt.hint_points[2] || 'Hint 3', checked: attempt.checked_hint_3 },
    ];
  }, [prompt, attempt]);

  const notes = useMemo(
    () => (attempt ? markerNotesFromUnknown(attempt.marker_notes, attempt.content) : null),
    [attempt],
  );

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

  if (attempt.marking_status !== 'complete') {
    return (
      <main className="mx-auto max-w-4xl space-y-4 p-6">
        <h1 className="text-3xl font-semibold">{prompt.title}</h1>
        <section className="rounded-lg border border-indigo-200 bg-indigo-50 p-5 text-indigo-950">
          <h2 className="text-lg font-semibold">Your writing is saved</h2>
          <p className="mt-2">
            TrialSeed is marking this response now. This page updates automatically;
            you can leave and return without losing your work.
          </p>
        </section>
      </main>
    );
  }

  const breakdown = attempt.scores_breakdown || {
    structure: 0,
    vocabulary: 0,
    audience: 0,
    grammar: 0,
  };

  const isTest = prompt.kind === 'test' || prompt.kind === 'bonus';
  const latestDraft = attempts[attempts.length - 1]?.draft_number ?? attempt.draft_number;

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="border-b border-stone-300 pb-4">
        <p className="text-sm uppercase tracking-wide text-stone-500">
          {isTest
            ? prompt.kind === 'bonus'
              ? 'Results · Bonus exam paper · one sitting'
              : 'Results · Term review · one sitting'
            : `Results · Draft ${attempt.draft_number}/3`}
        </p>
        <h1 className="text-3xl font-semibold">{prompt.title}</h1>
        {isTest ? (
          <p className="mt-2 text-sm text-stone-600">
            This test cannot be sat again. Your sitting is saved here.
          </p>
        ) : (
          <p className="mt-2 text-sm text-stone-600">
            Every submitted draft is saved. Open any draft to review your writing
            and the mark from that sitting.
          </p>
        )}
        {!isTest && attempts.length > 1 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {attempts.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => setSelectedDraft(row.draft_number)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  selectedDraft === row.draft_number
                    ? 'bg-stone-900 text-white'
                    : 'border border-stone-300 bg-white text-stone-800 hover:border-stone-500'
                }`}
              >
                Draft {row.draft_number}
                {typeof row.overall_score === 'number'
                  ? ` · ${row.overall_score}/25`
                  : ''}
              </button>
            ))}
          </div>
        ) : null}
      </header>

      {awards.length > 0 ? (
        <SeedAwardBanner
          total={awards.reduce((sum, row) => sum + row.seeds, 0)}
          lines={awards}
        />
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <ScoreCard
          label="Set A"
          value={`${attempt.score_set_a}/15`}
          hint="Content, organisation, vocabulary and style"
        />
        <ScoreCard
          label="Set B"
          value={`${attempt.score_set_b}/10`}
          hint="Sentences, punctuation and spelling"
        />
        <ScoreCard
          label="Overall"
          value={`${attempt.overall_score}/25`}
          highlight
          hint="One marker, practice scale"
        />
      </section>

      <p className="text-sm text-stone-600">
        This mark is from one marker, out of 25. On the Selective writing paper,
        two markers each mark out of 25 and the scores are added to give /50.
        Set A is out of 15. Set B is out of 10.
      </p>

      <section className="rounded-lg border border-stone-200 p-4">
        <h2 className="mb-3 text-lg font-medium">Four-dimension breakdown</h2>
        <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_16rem]">
          <ul className="grid gap-2 sm:grid-cols-2">
            <BreakdownItem label="Organisation" value={breakdown.structure} />
            <BreakdownItem label="Vocabulary & style" value={breakdown.vocabulary} />
            <BreakdownItem label="Purpose & form" value={breakdown.audience} />
            <BreakdownItem
              label="Sentences, punctuation, spelling"
              value={breakdown.grammar}
            />
          </ul>
          <ScoreRadar breakdown={breakdown} />
        </div>
        <p className="mt-3 text-sm text-stone-600">{attempt.word_count} words</p>
      </section>

      {notes ? <MarkerSummary notes={notes} /> : (
        <section className="rounded-lg border border-stone-200 p-4">
          <h2 className="mb-2 text-lg font-medium">TrialSeed feedback</h2>
          <p className="whitespace-pre-wrap text-stone-800">{attempt.ai_feedback}</p>
        </section>
      )}

      {!isTest ? (
        <section className="rounded-lg border border-stone-200 p-4">
          <h2 className="mb-2 text-lg font-medium">Hint checklist</h2>
          <ul className="space-y-2">
            {hints.map((hint) => (
              <li key={hint.label} className="flex gap-2">
                <span className={hint.checked ? 'text-emerald-700' : 'text-red-600'}>
                  {hint.checked ? '✓' : '✗'}
                </span>
                <span>{hint.label}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {attempt.plan_content ? (
        <section className="rounded-lg border border-stone-200 p-4">
          <h2 className="mb-2 text-lg font-medium">Your plan</h2>
          <p className="whitespace-pre-wrap text-stone-800">{attempt.plan_content}</p>
        </section>
      ) : null}

      {notes ? (
        <MarkedScript content={attempt.content} notes={notes} />
      ) : (
        <section className="rounded-lg border border-stone-200 p-4">
          <h2 className="mb-2 text-lg font-medium">Your submitted writing</h2>
          <p className="whitespace-pre-wrap text-stone-800">{attempt.content}</p>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        {!isTest && latestDraft < 3 ? (
          <Link
            href={`/dashboard/writing/${promptId}`}
            className="rounded-md bg-stone-900 px-4 py-2 text-white"
          >
            Revise &amp; Resubmit (Draft {latestDraft + 1})
          </Link>
        ) : null}

        {nextTask &&
        (nextTask.prompt_id !== promptId || isTest || latestDraft >= 3) ? (
          <Link
            href={`/dashboard/writing/${nextTask.prompt_id}`}
            className="rounded-md border border-indigo-200 bg-indigo-50 px-4 py-2 text-indigo-900"
          >
            Next: {nextTask.title}
          </Link>
        ) : null}

        {isTest ? null : samplesUnlocked ? (
          <button
            type="button"
            onClick={() => setShowSamples((v) => !v)}
            className="rounded-md border border-stone-900 px-4 py-2"
          >
            {showSamples ? 'Hide sample answers' : 'View Sample Answer'}
          </button>
        ) : (
          <p className="self-center text-sm text-stone-600">
            Sample answers unlock after Draft 3.
          </p>
        )}

        <Link href="/dashboard" className="rounded-md border border-stone-300 px-4 py-2">
          Dashboard
        </Link>
      </div>

      {nextTask ? (
        <p className="text-sm text-stone-600">{nextTask.reason}</p>
      ) : null}

      {showSamples && samplesUnlocked && !isTest ? (
        <section className="space-y-4 rounded-lg border border-stone-200 p-4">
          <div>
            <h3 className="font-medium">Sample answer</h3>
            <p className="mt-2 whitespace-pre-wrap text-stone-800">
              {prompt.sample_answer_high || 'Sample unavailable.'}
            </p>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function ScoreCard({
  label,
  value,
  hint,
  highlight = false,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight
          ? 'border-stone-900 bg-stone-900 text-white'
          : 'border-stone-200 bg-stone-50'
      }`}
    >
      <p className={`text-sm ${highlight ? 'text-stone-300' : 'text-stone-500'}`}>
        {label}
      </p>
      <p className="text-2xl font-semibold">{value}</p>
      {hint ? (
        <p className={`mt-1 text-xs ${highlight ? 'text-stone-300' : 'text-stone-500'}`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function BreakdownItem({ label, value }: { label: string; value: number }) {
  return (
    <li className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-stone-700">{label}</span>
        <span className="font-medium text-stone-900">{value}/5</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
        <div
          className="h-full rounded-full bg-stone-900"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
    </li>
  );
}

function ScoreRadar({
  breakdown,
}: {
  breakdown: {
    structure: number;
    vocabulary: number;
    audience: number;
    grammar: number;
  };
}) {
  const values = [
    breakdown.structure,
    breakdown.vocabulary,
    breakdown.audience,
    breakdown.grammar,
  ].map((value) => Math.max(0, Math.min(5, value)));
  const point = (value: number, index: number) => {
    const angle = -Math.PI / 2 + index * (Math.PI / 2);
    const radius = 42 * (value / 5);
    return `${50 + Math.cos(angle) * radius},${50 + Math.sin(angle) * radius}`;
  };
  const polygon = values.map(point).join(' ');
  const grid = (value: number) => [0, 1, 2, 3].map((index) => point(value, index)).join(' ');

  return (
    <div className="mx-auto w-full max-w-56" aria-label="Four-dimension score chart">
      <svg viewBox="0 0 100 100" role="img" className="h-auto w-full">
        {[1, 2, 3, 4, 5].map((value) => (
          <polygon
            key={value}
            points={grid(value)}
            fill="none"
            stroke="#d6d3d1"
            strokeWidth="0.5"
          />
        ))}
        <line x1="50" y1="8" x2="50" y2="92" stroke="#d6d3d1" strokeWidth="0.5" />
        <line x1="8" y1="50" x2="92" y2="50" stroke="#d6d3d1" strokeWidth="0.5" />
        <polygon points={polygon} fill="#1c1917" fillOpacity="0.25" stroke="#1c1917" />
      </svg>
      <div className="grid grid-cols-2 gap-x-2 text-center text-xs text-stone-600">
        <span>Organisation</span>
        <span>Vocabulary</span>
        <span>Purpose</span>
        <span>Accuracy</span>
      </div>
    </div>
  );
}
