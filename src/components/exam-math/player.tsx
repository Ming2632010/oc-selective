'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  EXAM_MATH_CHOICES,
  emptySittingAnswers,
  examMathInstructions,
  examMathMetaLine,
  examMathSittingIsTimed,
  formatCountdown,
  markChoiceClass,
  sittingProgress,
  sittingScore,
  type ExamMathQuestion,
  type ExamMathSetKind,
  type ExamMathSittingAnswer,
} from '@/lib/exam-math';
import { ExamMathLeaveGuard } from '@/components/exam-math/leave-guard';

type PlayerKind = ExamMathSetKind | 'preview';
type PlayerPhase = 'instructions' | 'sitting' | 'results';

export function ExamMathPlayer({
  kind,
  title,
  timeLimitSeconds,
  questions,
  exitHref,
  exitLabel = 'Back',
}: {
  kind: PlayerKind;
  title: string;
  timeLimitSeconds: number;
  questions: ExamMathQuestion[];
  exitHref: string;
  exitLabel?: string;
}) {
  const [phase, setPhase] = useState<PlayerPhase>('instructions');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<ExamMathSittingAnswer[]>(() =>
    emptySittingAnswers(questions.length),
  );
  const [secondsLeft, setSecondsLeft] = useState(timeLimitSeconds);
  const [timerHidden, setTimerHidden] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);

  const question = questions[index] ?? null;
  const current = answers[index];
  const progress = sittingProgress(answers);
  const instructions = examMathInstructions(kind);
  const inSitting = phase === 'sitting';
  const timed = examMathSittingIsTimed(timeLimitSeconds);

  useEffect(() => {
    if (!inSitting || !timed) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [inSitting, timed]);

  useEffect(() => {
    if (!inSitting || !timed || secondsLeft > 0) return;
    setTimedOut(true);
    setPhase('results');
  }, [inSitting, timed, secondsLeft]);

  useEffect(() => {
    if (!inSitting) return;
    function onKey(event: KeyboardEvent) {
      const key = event.key.toUpperCase();
      const letterIndex = EXAM_MATH_CHOICES.indexOf(key as (typeof EXAM_MATH_CHOICES)[number]);
      const numberIndex = key >= '1' && key <= '5' ? Number(key) - 1 : -1;
      const chosen = letterIndex >= 0 ? letterIndex : numberIndex;
      if (chosen >= 0 && chosen <= 4) {
        event.preventDefault();
        setAnswer(chosen);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inSitting, index]);

  const score = useMemo(
    () => sittingScore({ answers, questions }),
    [answers, questions],
  );

  function setAnswer(chosen: number) {
    setAnswers((currentAnswers) =>
      currentAnswers.map((answer, answerIndex) =>
        answerIndex === index ? { ...answer, chosen } : answer,
      ),
    );
  }

  function toggleFlag() {
    setAnswers((currentAnswers) =>
      currentAnswers.map((answer, answerIndex) =>
        answerIndex === index ? { ...answer, flagged: !answer.flagged } : answer,
      ),
    );
  }

  function goTo(nextIndex: number) {
    setIndex(Math.min(questions.length - 1, Math.max(0, nextIndex)));
    setConfirmFinish(false);
  }

  if (questions.length === 0) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 p-6">
        <p className="text-sm text-warm-muted">{title} has no questions yet.</p>
        <Link href={exitHref} className="text-sm font-medium text-brand hover:text-brand-dark">
          {exitLabel}
        </Link>
      </main>
    );
  }

  if (phase === 'instructions') {
    return (
      <main className="mx-auto max-w-3xl space-y-6 p-6">
        <p className="text-sm uppercase tracking-wide text-warm-subtle">{title}</p>
        <h1 className="font-serif text-3xl font-semibold text-warm-ink">{instructions.heading}</h1>
        <p className="text-warm-muted">
          {examMathMetaLine(instructions.questions, timeLimitSeconds)}
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm text-warm-ink">
          {instructions.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <p className="text-sm text-warm-muted">
          Use paper for working out. Answers stay on this screen until you finish.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setSecondsLeft(timeLimitSeconds);
              setPhase('sitting');
            }}
            className="rounded-full bg-terracotta px-5 py-2.5 text-sm font-medium text-white hover:bg-terracotta-hover"
          >
            Start
          </button>
          <Link
            href={exitHref}
            className="rounded-full border border-brand px-5 py-2.5 text-sm font-medium text-brand hover:bg-[#EDF3ED]"
          >
            {exitLabel}
          </Link>
        </div>
      </main>
    );
  }

  if (phase === 'results') {
    return (
      <main className="mx-auto max-w-3xl space-y-6 p-6">
        <header className="space-y-1">
          <p className="text-sm uppercase tracking-wide text-warm-subtle">{title}</p>
          <h1 className="font-serif text-3xl font-semibold text-warm-ink">Sitting finished</h1>
          <p className="text-sm text-warm-muted">
            {timedOut ? 'Time ended and the sitting was submitted.' : 'You finished the sitting.'}{' '}
            {score.marked > 0
              ? `${score.correct} of ${score.marked} marked correct.`
              : `${progress.answered} of ${progress.total} answered.`}
          </p>
        </header>
        <ol className="space-y-4">
          {questions.map((item, questionIndex) => {
            const answer = answers[questionIndex];
            return (
              <li
                key={item.id}
                className="space-y-3 rounded-lg border border-warm-border bg-white p-4"
              >
                <p className="text-sm font-semibold text-warm-ink">
                  {questionIndex + 1}. {item.stem}
                </p>
                <p className="text-xs text-warm-muted">
                  {answer?.chosen === null || answer?.chosen === undefined
                    ? 'Not answered'
                    : `You chose ${EXAM_MATH_CHOICES[answer.chosen]}`}
                </p>
                <div className="grid gap-2">
                  {item.options.map((option, optionIndex) => (
                    <div
                      key={option}
                      className={`rounded-lg border px-3 py-2 text-sm ${markChoiceClass({
                        submitted: true,
                        chosen: answer?.chosen ?? null,
                        correctIndex: item.correctIndex,
                        index: optionIndex,
                      })}`}
                    >
                      <span className="mr-2 font-semibold">{EXAM_MATH_CHOICES[optionIndex]}</span>
                      {option}
                    </div>
                  ))}
                </div>
              </li>
            );
          })}
        </ol>
        <Link
          href={exitHref}
          className="inline-flex rounded-full bg-terracotta px-5 py-2.5 text-sm font-medium text-white hover:bg-terracotta-hover"
        >
          {exitLabel}
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#F4F1EA]">
      <ExamMathLeaveGuard enabled />
      <header className="border-b border-brand-dark bg-brand-dark text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#F0C9A8]">{title}</p>
            <p className="text-sm font-medium">
              Question {index + 1} of {questions.length}
            </p>
          </div>
          {timed ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTimerHidden((value) => !value)}
                className="rounded-full border border-white/50 px-3 py-1 text-xs font-medium hover:bg-white/10"
              >
                {timerHidden ? 'Show timer' : 'Hide timer'}
              </button>
              <p
                className={`rounded-md px-3 py-1 font-mono text-lg ${
                  secondsLeft < 60 ? 'bg-[#8A3A28] text-white' : 'bg-white/10 text-white'
                } ${timerHidden ? 'invisible' : ''}`}
                aria-hidden={timerHidden}
              >
                {formatCountdown(secondsLeft)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-white/80">No timer</p>
          )}
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_13rem]">
        <section className="space-y-5 rounded-lg border border-warm-border bg-white p-5 shadow-card">
          {kind === 'preview' ? (
            <p className="rounded-md border border-[#C9DDD0] bg-[#EEF6F0] px-3 py-2 text-sm text-brand-dark">
              Preview only. This is not a Selective Maths question.
            </p>
          ) : null}
          <p className="text-lg leading-relaxed text-warm-ink">{question?.stem}</p>
          <div className="grid gap-2">
            {question?.options.map((option, optionIndex) => {
              const selected = current?.chosen === optionIndex;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setAnswer(optionIndex)}
                  className={`flex items-start gap-3 rounded-lg border px-3 py-3 text-left text-sm ${markChoiceClass({
                    submitted: false,
                    chosen: current?.chosen ?? null,
                    correctIndex: null,
                    index: optionIndex,
                  })}`}
                  aria-pressed={selected}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current text-xs font-semibold">
                    {EXAM_MATH_CHOICES[optionIndex]}
                  </span>
                  <span>{option}</span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={toggleFlag}
              className={`rounded-full border px-4 py-2 text-sm font-medium ${
                current?.flagged
                  ? 'border-terracotta bg-[#FFF8F1] text-[#8A3A28]'
                  : 'border-warm-border text-warm-ink hover:border-brand'
              }`}
            >
              {current?.flagged ? 'Flagged for review' : 'Flag for review'}
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => goTo(index - 1)}
                className="rounded-full border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-[#EDF3ED] disabled:opacity-40"
              >
                Previous
              </button>
              {index < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => goTo(index + 1)}
                  className="rounded-full bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-hover"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmFinish(true)}
                  className="rounded-full bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-hover"
                >
                  Finish
                </button>
              )}
            </div>
          </div>
          {confirmFinish ? (
            <div className="space-y-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
              <p>
                {progress.blank > 0
                  ? `${progress.blank} question${progress.blank === 1 ? '' : 's'} still blank. You can finish anyway — there is no penalty for a wrong or blank answer.`
                  : 'All questions have an answer. Finish this sitting?'}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPhase('results')}
                  className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
                >
                  Submit sitting
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmFinish(false)}
                  className="rounded-full border border-brand px-4 py-2 text-sm font-medium text-brand"
                >
                  Keep going
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <aside className="space-y-4">
          <div className="rounded-lg border border-warm-border bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-warm-subtle">
              Questions
            </p>
            <div className="mt-3 grid grid-cols-5 gap-1.5 sm:grid-cols-6 lg:grid-cols-4">
              {questions.map((item, questionIndex) => {
                const answer = answers[questionIndex];
                const currentQuestion = questionIndex === index;
                const filled = answer.chosen !== null;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goTo(questionIndex)}
                    aria-current={currentQuestion ? 'step' : undefined}
                    aria-label={`Question ${questionIndex + 1}${filled ? ', answered' : ''}${answer.flagged ? ', flagged' : ''}`}
                    className={`relative h-9 rounded-md text-xs font-semibold ${
                      currentQuestion
                        ? 'bg-brand text-white'
                        : filled
                          ? 'bg-[#DCEEE3] text-brand-dark'
                          : 'border border-warm-border bg-white text-warm-ink'
                    }`}
                  >
                    {questionIndex + 1}
                    {answer.flagged ? (
                      <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-terracotta" />
                    ) : null}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-warm-muted">
              {progress.answered} answered · {progress.flagged} flagged · {progress.blank} blank
            </p>
          </div>
          <p className="text-xs text-warm-muted">
            Press A–E or 1–5 to choose. Work on paper if you need it. No calculator.
          </p>
          <Link href={exitHref} className="text-sm font-medium text-brand hover:text-brand-dark">
            {exitLabel}
          </Link>
        </aside>
      </div>
    </main>
  );
}
