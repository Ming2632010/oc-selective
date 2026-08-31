'use client';

import { useEffect, useRef, useState } from 'react';

type WarmupItem = {
  id: string;
  kind: 'thinking' | 'reading';
  stem: string;
  options: string[];
};

export function ExamWarmup({
  promptId,
  studentId,
  token,
  onDone,
}: {
  promptId: string;
  studentId: string;
  token: string;
  onDone: (result?: { correct: number; total: number }) => void;
}) {
  const [questions, setQuestions] = useState<WarmupItem[]>([]);
  const [choices, setChoices] = useState<(number | null)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/writing/warmup?student_id=${studentId}&prompt_id=${promptId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load warm-up');
        if (data.completed) {
          onDoneRef.current();
          return;
        }
        const items = (data.questions as WarmupItem[]) || [];
        setQuestions(items);
        setChoices(items.map(() => null));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load warm-up');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [promptId, studentId, token]);

  async function submit() {
    if (choices.some((c) => c === null)) {
      setError('Answer every question before you continue.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/writing/warmup', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
          prompt_id: promptId,
          answers: choices,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save warm-up');
      onDone({
        correct: Number(data.correct) || 0,
        total: Number(data.total) || questions.length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save warm-up');
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-stone-600">Loading warm-up…</p>;
  }

  return (
    <section className="space-y-5 rounded-lg border border-stone-200 bg-white p-5">
      <div>
        <p className="text-sm uppercase tracking-wide text-stone-500">
          Before the writing paper
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-stone-900">
          Short thinking and reading warm-up
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          On test day, writing is the last paper. These few questions stand in
          for a tired brain. You do not need every answer right — then the
          writing paper starts.
        </p>
      </div>

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}

      <ol className="space-y-5">
        {questions.map((question, index) => (
          <li key={question.id} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              {question.kind === 'thinking' ? 'Thinking' : 'Reading'} · {index + 1} of{' '}
              {questions.length}
            </p>
            <p className="whitespace-pre-wrap text-stone-800">{question.stem}</p>
            <div className="flex flex-col gap-2">
              {question.options.map((option, optionIndex) => {
                const selected = choices[index] === optionIndex;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setChoices((prev) => {
                        const next = prev.slice();
                        next[index] = optionIndex;
                        return next;
                      })
                    }
                    className={`rounded-md border px-3 py-2 text-left text-sm ${
                      selected
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-300 bg-white text-stone-800 hover:border-stone-500'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      <button
        type="button"
        disabled={submitting || questions.length === 0}
        onClick={() => void submit()}
        className="rounded-md bg-stone-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {submitting ? 'Saving…' : 'Finish warm-up'}
      </button>
    </section>
  );
}
