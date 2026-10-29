'use client';

import Link from 'next/link';
import {
  difficultyBandLabel,
  type ExamMathOverview,
  type ExamMathSet,
  type ExamMathSetKind,
} from '@/lib/exam-math';
import {
  examMathTrialEndedKeepWorkMessage,
  examMathTrialInProgressMessage,
  examMathTrialOfferCopy,
} from '@/lib/exam-math-trial';

export type MathTrialInfo = {
  eligible: boolean;
  active: boolean;
  had_trial?: boolean;
  days_left: number | null;
  warmup_used?: number;
  warmup_limit?: number;
  mini_used?: number;
  mini_limit?: number;
  expires_at: string | null;
};

export function SelectiveMathLaunch({
  access,
  trial,
  startingTrial,
  onStartTrial,
}: {
  access: 'granted' | 'trial' | 'unlicensed' | 'not-found' | 'wrong-grade' | null;
  trial: MathTrialInfo | null;
  startingTrial: boolean;
  onStartTrial: () => void;
}) {
  const paid = access === 'granted';
  const onTrial = access === 'trial';
  const canStart = Boolean(trial?.eligible && !paid && !onTrial);

  return (
    <section className="space-y-4 rounded-lg border border-warm-border bg-warm-card p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">
            Selective Math
          </p>
          <h2 className="font-serif text-xl font-semibold text-warm-ink">
            Mathematical Reasoning practice
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-warm-muted">
            {onTrial
              ? examMathTrialInProgressMessage({
                  daysLeft: trial?.days_left ?? 0,
                  warmupUsed: trial?.warmup_used ?? 0,
                  warmupLimit: trial?.warmup_limit ?? 10,
                  miniUsed: trial?.mini_used ?? 0,
                  miniLimit: trial?.mini_limit ?? 12,
                })
              : paid
                ? '100 mini exams of 12 questions, 20 full papers of 35, and a strengthen list for questions missed. Original computer-test practice: five options A–E, no calculator.'
                : trial?.had_trial
                  ? examMathTrialEndedKeepWorkMessage()
                  : `7 days to decide. No card needed: ${examMathTrialOfferCopy()}. The 100 mini exams, 20 papers, and Strengthen stay in the paid year.`}
          </p>
        </div>
        {paid || onTrial ? (
          <Link
            href="/dashboard/selective-math"
            className="rounded-full bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-hover"
          >
            Open Selective Math
          </Link>
        ) : canStart ? (
          <button
            type="button"
            onClick={onStartTrial}
            disabled={startingTrial}
            className="rounded-full bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-hover disabled:opacity-60"
          >
            {startingTrial ? 'Starting…' : 'Start 7-day trial'}
          </button>
        ) : (
          <Link
            href="/subscription"
            className="rounded-full bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-hover"
          >
            Buy a year · $99
          </Link>
        )}
      </div>
      {paid ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <ModeLink
            href="/dashboard/selective-math/mini"
            title="Mini exams"
            detail="100 sets · 12 questions · no timer"
          />
          <ModeLink
            href="/dashboard/selective-math/papers"
            title="Full papers"
            detail="20 papers · 35 questions · 40 minutes"
          />
          <ModeLink
            href="/dashboard/selective-math/strengthen"
            title="Strengthen"
            detail="Missed types, then the same reasoning with new numbers"
          />
        </div>
      ) : onTrial ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <ModeLink
            href="/dashboard/selective-math/sit/trial/1"
            title="Trial warm-up"
            detail="10 questions · graphs, tables and diagrams"
          />
          <ModeLink
            href="/dashboard/selective-math/sit/trial/2"
            title="Trial mini exam"
            detail="12 questions · mixed computer-test items"
          />
        </div>
      ) : canStart ? (
        <div className="flex flex-wrap gap-3">
          <Link
            href="/subscription"
            className="rounded-full border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-[#EDF3ED]"
          >
            Buy a year · $99
          </Link>
        </div>
      ) : null}
    </section>
  );
}

function ModeLink({
  href,
  title,
  detail,
}: {
  href: string;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-warm-border bg-white px-4 py-3 hover:border-brand"
    >
      <p className="font-semibold text-warm-ink">{title}</p>
      <p className="text-sm text-warm-muted">{detail}</p>
    </Link>
  );
}

export function SelectiveMathOverview({
  overview,
  studentName,
}: {
  overview: ExamMathOverview | null;
  studentName: string;
}) {
  const minis = overview?.minis ?? [];
  const papers = overview?.papers ?? [];
  const trials = overview?.trials ?? [];
  const onTrial = overview?.access === 'trial';
  const readyMinis = overview?.readyMiniCount ?? 0;
  const readyPapers = overview?.readyPaperCount ?? 0;
  const wrongs = overview?.openWrongCount ?? 0;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-warm-subtle">Selective Math</p>
        <h1 className="font-serif text-3xl font-semibold text-warm-ink">
          Mathematical Reasoning
        </h1>
        <p className="max-w-2xl text-sm text-warm-muted">
          {onTrial
            ? `7-day trial for ${studentName}. ${examMathTrialOfferCopy()}. Mini exams, papers, and Strengthen stay in the paid year.`
            : `Computer-based practice for ${studentName}. Mini exams and full papers match the latest Selective test sitting: five options A–E, on-screen timer, flag and review, no calculator.`}
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="rounded-full border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-[#EDF3ED]"
        >
          Back to dashboard
        </Link>
      </div>

      {onTrial ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {trials.map((set) => (
            <ModeCard
              key={`${set.kind}-${set.setNumber}`}
              href={`/dashboard/selective-math/sit/trial/${set.setNumber}`}
              title={set.title}
              count={set.isReady ? `${set.questionCount} questions` : 'Not ready'}
              detail={
                set.setNumber === 1
                  ? 'Graphs, tables, clocks and diagrams. No timer.'
                  : 'Mixed computer-test items. No timer.'
              }
            />
          ))}
        </div>
      ) : (
        <>
      <div className="grid gap-4 sm:grid-cols-3">
        <ModeCard
          href="/dashboard/selective-math/mini"
          title="Mini exams"
          count={`${readyMinis} / 100 ready`}
          detail="12 questions, no timer, mixed current-style items."
        />
        <ModeCard
          href="/dashboard/selective-math/papers"
          title="Full papers"
          count={`${readyPapers} / 20 ready`}
          detail="35 questions, 40 minutes, Mathematical Reasoning."
        />
        <ModeCard
          href="/dashboard/selective-math/strengthen"
          title="Strengthen"
          count={wrongs === 0 ? 'None to review yet' : `${wrongs} open`}
          detail="Collects missed types, then asks a new question of the same type."
        />
      </div>

      <SetPreview kind="mini" sets={minis.slice(0, 20)} href="/dashboard/selective-math/mini" />
      <SetPreview kind="paper" sets={papers} href="/dashboard/selective-math/papers" />
        </>
      )}
    </div>
  );
}

function ModeCard({
  href,
  title,
  count,
  detail,
}: {
  href: string;
  title: string;
  count: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="space-y-2 rounded-lg border border-warm-border bg-white p-4 shadow-card hover:border-brand"
    >
      <h2 className="font-serif text-lg font-semibold text-warm-ink">{title}</h2>
      <p className="text-sm font-medium text-brand">{count}</p>
      <p className="text-sm text-warm-muted">{detail}</p>
    </Link>
  );
}

function SetPreview({
  kind,
  sets,
  href,
}: {
  kind: ExamMathSetKind;
  sets: ExamMathSet[];
  href: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-lg font-semibold text-warm-ink">
          {kind === 'mini' ? 'Mini exams 1–20' : 'Full papers'}
        </h2>
        <Link href={href} className="text-sm font-medium text-brand hover:text-brand-dark">
          See all
        </Link>
      </div>
      <ExamMathSetGrid sets={sets} />
    </section>
  );
}

export function ExamMathSetGrid({ sets }: { sets: ExamMathSet[] }) {
  return (
    <ol className="grid grid-cols-5 gap-2 sm:grid-cols-10">
      {sets.map((set) => (
        <li key={`${set.kind}-${set.setNumber}`}>
          {set.isReady ? (
            <Link
              href={`/dashboard/selective-math/sit/${set.kind}/${set.setNumber}`}
              className="flex h-11 items-center justify-center rounded-md bg-brand text-sm font-semibold text-white"
              title={`${set.title} · ${difficultyBandLabel(set.difficultyBand)}`}
            >
              {set.setNumber}
            </Link>
          ) : (
            <span
              className="flex h-11 items-center justify-center rounded-md border border-dashed border-warm-border bg-[#F7F5F0] text-sm text-warm-subtle"
              title={`${set.title} · not ready`}
            >
              {set.setNumber}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

export function ExamMathBandLegend({ kind }: { kind: ExamMathSetKind }) {
  if (kind === 'mini') {
    return (
      <p className="text-sm text-warm-muted">
        1–20 foundation · 21–60 standard · 61–100 exam pace. All use current
        Selective question types.
      </p>
    );
  }
  return (
    <p className="text-sm text-warm-muted">
      Papers 1–5 start a little gentler. Papers 6–20 sit at test level. Each
      paper is 35 questions in 40 minutes.
    </p>
  );
}
