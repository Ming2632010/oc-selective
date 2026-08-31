'use client';

import { useEffect, useState } from 'react';
import {
  gradeDecode,
  type DecodeAnswers,
  type DecodeGuide,
} from '@/lib/decode-guide';

const DECODE_SECONDS = 30;

function Chip({
  selected,
  children,
  onClick,
}: {
  selected: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3 py-2 text-left text-sm ${
        selected
          ? 'border-stone-900 bg-stone-900 text-white'
          : 'border-stone-300 bg-white text-stone-800 hover:border-stone-500'
      }`}
    >
      {children}
    </button>
  );
}

export function PromptDecode({
  guide,
  onDone,
}: {
  guide: DecodeGuide;
  onDone: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(DECODE_SECONDS);
  const [answers, setAnswers] = useState<DecodeAnswers>({
    formLabel: null,
    topic: null,
    audience: null,
  });
  const [recap, setRecap] = useState<ReturnType<typeof gradeDecode> | null>(null);

  useEffect(() => {
    if (recap) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [recap]);

  useEffect(() => {
    if (secondsLeft !== 0 || recap) return;
    setRecap(gradeDecode(guide, answers));
  }, [secondsLeft, recap, guide, answers]);

  const ready = Boolean(answers.formLabel && answers.topic && answers.audience);

  function finish() {
    setRecap(gradeDecode(guide, answers));
  }

  if (recap) {
    const rows: { label: string; ok: boolean; correct: string }[] = [
      { label: 'Form', ok: recap.form, correct: guide.formLabel },
      { label: 'Topic / job', ok: recap.topic, correct: guide.topic },
      { label: 'Audience', ok: recap.audience, correct: guide.audience },
    ];
    return (
      <section className="space-y-4 rounded-lg border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Prompt decode</h2>
        <p className="text-sm text-stone-600">
          A 30-second read before you write. This does not count toward the
          30-minute paper.
        </p>
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.label} className="rounded-md bg-stone-50 px-3 py-2 text-sm">
              <span className={row.ok ? 'text-emerald-700' : 'text-amber-800'}>
                {row.ok ? 'Right' : 'Look again'}
              </span>
              <span className="text-stone-500"> · {row.label}: </span>
              <span className="text-stone-800">{row.correct}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onDone}
          className="rounded-md bg-stone-900 px-4 py-2 text-white"
        >
          Start writing
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-5 rounded-lg border border-stone-200 bg-white p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Prompt decode</h2>
          <p className="mt-1 text-sm text-stone-600">
            30 seconds. Name the form, the job, and who it is for. Then the
            paper starts.
          </p>
        </div>
        <p className="rounded-md bg-stone-100 px-3 py-2 font-mono text-lg text-stone-800">
          0:{String(secondsLeft).padStart(2, '0')}
        </p>
      </header>

      <div className="space-y-2">
        <p className="text-sm font-medium text-stone-800">What form is this?</p>
        <div className="flex flex-wrap gap-2">
          {guide.formOptions.map((option) => (
            <Chip
              key={option}
              selected={answers.formLabel === option}
              onClick={() => setAnswers((prev) => ({ ...prev, formLabel: option }))}
            >
              {option}
            </Chip>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-stone-800">What is the job?</p>
        <div className="flex flex-col gap-2">
          {guide.topicOptions.map((option) => (
            <Chip
              key={option}
              selected={answers.topic === option}
              onClick={() => setAnswers((prev) => ({ ...prev, topic: option }))}
            >
              {option}
            </Chip>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-stone-800">Who is it for?</p>
        <div className="flex flex-col gap-2">
          {guide.audienceOptions.map((option) => (
            <Chip
              key={option}
              selected={answers.audience === option}
              onClick={() => setAnswers((prev) => ({ ...prev, audience: option }))}
            >
              {option}
            </Chip>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={!ready}
        onClick={finish}
        className="rounded-md bg-stone-900 px-4 py-2 text-white disabled:opacity-50"
      >
        Check my decode
      </button>
    </section>
  );
}
