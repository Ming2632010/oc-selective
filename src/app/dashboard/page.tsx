'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  apiFetch,
  clearSession,
  getStudentId,
  getToken,
  setStudentId,
} from '@/lib/client-auth';
import { typeLabel, UNIT_GROUPS, unitsByGroup, type UnitGroup } from '@/lib/units';
import { WritingProgressLine, type HistoryPoint } from '@/components/writing/progress-line';
import { SeedPatch, type SeedPatchData } from '@/components/writing/seed-patch';
import { WeekNote } from '@/components/writing/week-note';
import type { WeekNoteData } from '@/lib/week-note';

const SubjectChat = dynamic(
  () => import('@/components/writing/subject-chat').then((module) => module.SubjectChat),
  { ssr: false },
);

type Student = {
  id: string;
  name: string;
  grade: string;
  is_active: boolean;
};

type ProgressRow = {
  module_id: number;
  prompt_count: number;
  completed_count: number;
  is_completed: boolean;
};

type SubscriptionItem = {
  subject: string;
  student_id: string | null;
  status: string;
  expires_at: string | null;
  active: boolean;
};

type SubscriptionState = {
  subscriptions: SubscriptionItem[];
  has_active: boolean;
};

type MiniProgressRow = {
  module_id: number;
  drill_count: number;
  completed_count: number;
};

type TermTest = {
  id: string;
  title: string;
  prompt_type: string;
  module_id: number;
  overall_score: number | null;
  sat: boolean;
  locked?: boolean;
  practice_tried?: number;
  practice_total?: number;
};

type BonusPaper = {
  id: string;
  title: string;
  prompt_type: string;
  overall_score: number | null;
  sat: boolean;
  locked: boolean;
};

type BonusPapersState = {
  access: {
    locked: boolean;
    writingTried: number;
    writingTotal: number;
    reviewsSat: number;
    reviewsTotal: number;
  };
  lock_reason: string;
  papers: BonusPaper[];
};

type Recommendation = {
  prompt_id: string;
  title: string;
  module_id: number;
  next_draft: number;
  reason: string;
};

const EXPIRY_WARNING_DAYS = 7;

const GROUP_BLURBS: Record<UnitGroup, string> = {
  Creative: 'Imagine and describe',
  Informative: 'Inform and explain',
  Persuasive: 'Convince and influence',
};

function subscriptionBanner(
  sub: SubscriptionState | null,
  studentId: string | null,
): {
  tone: 'warn' | 'info';
  message: string;
} | null {
  if (!sub) return null;

  const writingAccess = sub.subscriptions.find(
    (item) => item.subject === 'writing' && item.student_id === studentId && item.active,
  );
  if (!writingAccess) {
    return {
      tone: 'warn',
      message:
        'This child does not have Selective Writing access yet.',
    };
  }

  const times = [writingAccess]
    .filter((s) => s.expires_at)
    .map((s) => new Date(s.expires_at as string).getTime())
    .filter((t) => Number.isFinite(t));

  if (times.length > 0) {
    const soonest = Math.min(...times);
    const daysLeft = Math.ceil((soonest - Date.now()) / (24 * 60 * 60 * 1000));
    if (daysLeft <= EXPIRY_WARNING_DAYS) {
      return {
        tone: 'info',
        message: `A subscription expires in ${daysLeft} day${
          daysLeft === 1 ? '' : 's'
        }. Renew to avoid interruption.`,
      };
    }
  }

  return null;
}

type ModuleStatus = 'Not Started' | 'In Progress' | 'Completed';

function moduleStatus(row: ProgressRow | undefined): ModuleStatus {
  if (!row || row.completed_count === 0) return 'Not Started';
  if (row.is_completed) return 'Completed';
  return 'In Progress';
}

function statusBadgeClasses(status: ModuleStatus): string {
  switch (status) {
    case 'Completed':
      return 'bg-emerald-100 text-emerald-800';
    case 'In Progress':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-stone-100 text-stone-600';
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [miniProgress, setMiniProgress] = useState<MiniProgressRow[]>([]);
  const [termTests, setTermTests] = useState<TermTest[]>([]);
  const [bonusPapers, setBonusPapers] = useState<BonusPapersState | null>(null);
  const [rewards, setRewards] = useState<SeedPatchData | null>(null);
  const [weekNote, setWeekNote] = useState<WeekNoteData | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(
    null,
  );
  const [subscription, setSubscription] = useState<SubscriptionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState('');
  const [newGrade, setNewGrade] = useState('Year 5');
  const [creating, setCreating] = useState(false);

  async function loadDashboard(requestedStudentId?: string | null) {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    if (requestedStudentId) {
      setSelectedStudentId(requestedStudentId);
      setProgress([]);
      setMiniProgress([]);
      setTermTests([]);
      setBonusPapers(null);
      setRewards(null);
      setWeekNote(null);
      setHistory([]);
      setRecommendation(null);
    }
    setLoading(true);
    setError(null);
    const query = requestedStudentId ? `?student_id=${requestedStudentId}` : '';
    try {
      const res = await apiFetch(`/api/dashboard/bootstrap${query}`);
      if (!res.response.ok) {
        if (res.response.status === 401) {
          clearSession();
          router.replace('/login');
          return;
        }
        throw new Error(res.data.error || 'Failed to load dashboard');
      }
      setUserName(res.data.user?.full_name || res.data.user?.email || 'there');
      setStudents((res.data.students as Student[]) || []);
      setSubscription({
        subscriptions: (res.data.subscriptions as SubscriptionItem[]) || [],
        has_active: Boolean(res.data.has_active),
      });
      const selected = (res.data.selected_student_id as string | null) ?? null;
      setSelectedStudentId(selected);
      if (selected) setStudentId(selected);
      const guidance = res.data.guidance as {
        progress?: ProgressRow[]; mini_progress?: MiniProgressRow[]; term_tests?: TermTest[];
        bonus_papers?: BonusPapersState | null; rewards?: SeedPatchData | null;
        week_note?: WeekNoteData | null; history?: HistoryPoint[]; recommendation?: Recommendation | null;
      } | null;
      setProgress(guidance?.progress ?? []);
      setMiniProgress(guidance?.mini_progress ?? []);
      setTermTests(guidance?.term_tests ?? []);
      setBonusPapers(guidance?.bonus_papers ?? null);
      setRewards(guidance?.rewards ?? null);
      setWeekNote(guidance?.week_note ?? null);
      setHistory(guidance?.history ?? []);
      setRecommendation(guidance?.recommendation ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard(getStudentId());
    // The dashboard bootstrap endpoint owns all authenticated initial data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function onCreateStudent(event: FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await apiFetch('/api/students', {
        method: 'POST',
        body: JSON.stringify({ name: newName, grade: newGrade }),
      });
      if (!res.response.ok) {
        throw new Error(res.data.error || 'Could not create student');
      }
      const student = res.data.student as Student;
      setStudents((prev) => [...prev, student]);
      setStudentId(student.id);
      setNewName('');
      await loadDashboard(student.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create student');
    } finally {
      setCreating(false);
    }
  }

  function onSelectStudent(id: string) {
    setStudentId(id);
    void loadDashboard(id);
  }

  function logout() {
    clearSession();
    router.push('/login');
  }

  if (loading) {
    return <main className="mx-auto max-w-5xl p-6">Loading dashboard…</main>;
  }

  const activeStudent =
    students.find((s) => s.id === selectedStudentId) ?? null;
  const selectedWritingAccess = subscription?.subscriptions.find(
    (item) =>
      item.subject === 'writing' &&
      item.student_id === selectedStudentId &&
      item.active,
  );

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-warm-border pb-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-warm-subtle">Dashboard</p>
          <h1 className="text-3xl font-semibold text-warm-ink">Hi, {userName}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/subscription"
            className="rounded-full border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-[#EDF3ED]"
          >
            Subscription
          </Link>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-[#EDF3ED]"
          >
            Log out
          </button>
        </div>
      </header>

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {(() => {
        const banner = subscriptionBanner(subscription, selectedStudentId);
        if (!banner) return null;
        const classes =
          banner.tone === 'warn'
            ? 'border-amber-300 bg-amber-50 text-amber-900'
            : 'border-[#C9DDD0] bg-[#EEF6F0] text-brand-dark';
        return (
          <div
            className={`flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3 ${classes}`}
          >
            <p className="text-sm">{banner.message}</p>
            <Link
              href="/subscription"
              className="rounded-full bg-terracotta px-3 py-1.5 text-sm font-medium text-white hover:bg-terracotta-hover"
            >
              Manage subscription
            </Link>
          </div>
        );
      })()}

      {students.length === 0 ? (
        <section className="space-y-4 rounded-lg border border-warm-border bg-warm-card p-6 shadow-card">
          <div>
            <h2 className="text-xl font-semibold text-warm-ink">
              Let&apos;s set up a student profile
            </h2>
            <p className="mt-1 text-sm text-warm-muted">
              Add the student who will be practising so we can track their
              progress across all eleven units.
            </p>
          </div>
          <form
            onSubmit={onCreateStudent}
            className="grid gap-3 sm:grid-cols-[1fr_10rem_auto]"
          >
            <input
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Student name"
              className="rounded-lg border border-warm-border bg-warm-card px-3 py-2"
            />
            <select
              value={newGrade}
              onChange={(e) => setNewGrade(e.target.value)}
              className="rounded-lg border border-warm-border bg-warm-card px-3 py-2"
            >
              {['Year 4', 'Year 5', 'Year 6', 'Year 7'].map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={creating}
              className="rounded-full bg-terracotta px-4 py-2 font-medium text-white hover:bg-terracotta-hover disabled:opacity-60"
            >
              {creating ? 'Creating…' : 'Create profile'}
            </button>
          </form>
        </section>
      ) : (
        <>
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warm-border bg-warm-card p-4 shadow-card">
            <div>
              <p className="text-sm text-warm-subtle">Student</p>
              <p className="text-lg font-medium text-warm-ink">
                {activeStudent?.name}{' '}
                <span className="text-warm-subtle">· {activeStudent?.grade}</span>
              </p>
            </div>
            {students.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {students.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => onSelectStudent(student.id)}
                    className={`rounded-full px-3 py-2 text-sm ${
                      selectedStudentId === student.id
                        ? 'bg-brand text-white'
                        : 'border border-warm-border bg-warm-card text-warm-ink hover:border-brand'
                    }`}
                  >
                    {student.name}
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          <section className="space-y-3 rounded-lg border border-warm-border bg-warm-card p-4 shadow-card">
            <div>
              <h2 className="text-lg font-semibold text-warm-ink">Add another child</h2>
              <p className="text-sm text-warm-muted">
                Each child has their own progress and needs their own Selective Writing access.
              </p>
            </div>
            <form
              onSubmit={onCreateStudent}
              className="grid gap-3 sm:grid-cols-[1fr_10rem_auto]"
            >
              <input
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Child name"
                className="rounded-lg border border-warm-border bg-warm-card px-3 py-2"
              />
              <select
                value={newGrade}
                onChange={(e) => setNewGrade(e.target.value)}
                className="rounded-lg border border-warm-border bg-warm-card px-3 py-2"
              >
                {['Year 4', 'Year 5', 'Year 6', 'Year 7'].map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={creating}
                className="rounded-full bg-terracotta px-4 py-2 font-medium text-white hover:bg-terracotta-hover disabled:opacity-60"
              >
                {creating ? 'Adding…' : 'Add child'}
              </button>
            </form>
          </section>

          {selectedWritingAccess ? (
            <>
          {recommendation ? (
            <section className="rounded-lg border border-[#D6E3D8] bg-[#EEF6F0] p-5 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                Next task
              </p>
              <h2 className="mt-1 text-lg font-semibold text-warm-ink">
                {recommendation.title}
              </h2>
              <p className="mt-2 text-sm text-warm-muted">{recommendation.reason}</p>
              <Link
                href={`/dashboard/writing/${recommendation.prompt_id}`}
                className="mt-4 inline-flex rounded-full bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-hover"
              >
                {recommendation.next_draft === 1
                  ? 'Start this task'
                  : `Continue draft ${recommendation.next_draft}`}
              </Link>
            </section>
          ) : null}

          <SeedPatch patch={rewards} />
          <WeekNote note={weekNote} />

          <div className="grid gap-4 lg:grid-cols-2">
            <WritingProgressLine history={history} />
            {selectedStudentId ? (
              <SubjectChat studentId={selectedStudentId} subject="writing" />
            ) : null}
          </div>

          <section className="space-y-8">
            <div>
              <h2 className="text-lg font-medium text-warm-ink">Writing units</h2>
              <p className="mt-1 text-sm text-warm-muted">
                Start any unit. Each one has mini practice and three full
                writing tasks. Term reviews stay locked until you have tried
                every full writing task in that unit at least once. One
                sitting, one attempt only.
              </p>
            </div>
            {UNIT_GROUPS.map((group) => {
              const groupUnits = unitsByGroup(group);
              const groupTests = termTests.filter((test) =>
                groupUnits.some((unit) => unit.id === test.module_id),
              );

              return (
              <div key={group} className="space-y-4">
                <div className="flex items-baseline gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-warm-ink">
                    {group}
                  </h3>
                  <p className="text-sm text-warm-subtle">
                    {GROUP_BLURBS[group]}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {groupUnits.map((unit) => {
                    const row = progress.find((p) => p.module_id === unit.id);
                    const status = moduleStatus(row);
                    const total = row?.prompt_count ?? 0;
                    const done = row?.completed_count ?? 0;
                    const pct =
                      total > 0 ? Math.round((done / total) * 100) : 0;
                    const mini = miniProgress.find((p) => p.module_id === unit.id);
                    const miniTotal = mini?.drill_count ?? 0;
                    const miniDone = mini?.completed_count ?? 0;

                    const card = (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold uppercase tracking-wide text-warm-subtle">
                              Unit {unit.id}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClasses(
                                status,
                              )}`}
                            >
                              {status}
                            </span>
                          </div>
                          <h4 className="text-lg font-semibold text-warm-ink">
                            {unit.title}
                          </h4>
                          <p className="text-sm text-warm-muted">{unit.blurb}</p>
                        </div>

                        <div className="mt-5 space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-warm-subtle">
                            <span>
                              Mini {miniDone}/{miniTotal || '—'} · Writing{' '}
                              {done}/{total || '—'}
                            </span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-[#F0EBE3]">
                            <div
                              className="h-full rounded-full bg-terracotta transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </>
                    );

                    return (
                      <Link
                        key={unit.id}
                        href={`/dashboard/unit/${unit.id}`}
                        className="group flex flex-col justify-between rounded-lg border border-warm-border bg-warm-card p-5 shadow-card transition hover:border-brand"
                      >
                        {card}
                      </Link>
                    );
                  })}
                </div>
                {groupTests.length > 0 ? (
                  <div className="space-y-3 rounded-lg border border-[#D6E3D8] bg-[#F4F8F3] p-4">
                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-brand-dark">
                        Term review
                      </h4>
                      <p className="mt-1 text-sm text-warm-muted">
                        {groupTests.length} test
                        {groupTests.length === 1 ? '' : 's'} — one for each{' '}
                        {group.toLowerCase()} unit. Unlock a review by trying
                        all three full writing tasks in that unit. Exam-style:
                        one sitting, AI marking, no re-attempt.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {groupTests.map((test) => {
                        const unit = groupUnits.find(
                          (row) => row.id === test.module_id,
                        );
                        const href = test.sat
                          ? `/dashboard/writing/${test.id}/results`
                          : `/dashboard/writing/${test.id}`;
                        const tried = test.practice_tried ?? 0;
                        const total = test.practice_total ?? 0;
                        const card = (
                          <>
                            <div className="space-y-1.5">
                              <span className="text-xs font-semibold uppercase tracking-wide text-brand">
                                {unit?.title ?? `Unit ${test.module_id}`}
                              </span>
                              <p className="font-medium text-warm-ink">
                                {test.title}
                              </p>
                            </div>
                            <p className="mt-3 text-sm text-warm-muted">
                              {test.sat
                                ? typeof test.overall_score === 'number'
                                  ? `Sat · ${test.overall_score}/25`
                                  : 'Sat · marked'
                                : test.locked
                                  ? total > 0
                                    ? `Locked · ${tried}/${total} writing tasks tried`
                                    : 'Locked · try the unit writing tasks first'
                                  : 'Ready · not started'}
                            </p>
                          </>
                        );
                        if (test.locked) {
                          return (
                            <div
                              key={test.id}
                              className="flex flex-col justify-between rounded-lg border border-warm-border bg-warm-card/70 p-4 opacity-80"
                            >
                              {card}
                            </div>
                          );
                        }
                        return (
                          <Link
                            key={test.id}
                            href={href}
                            className="flex flex-col justify-between rounded-lg border border-warm-border bg-warm-card p-4 transition hover:border-brand hover:shadow-card"
                          >
                            {card}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
              );
            })}

            {bonusPapers ? (
              <section
                data-testid="bonus-exam-papers"
                className="relative overflow-hidden rounded-lg border border-brand-dark p-6 text-white shadow-float"
                style={{
                  background:
                    'linear-gradient(145deg, #1E3F33 0%, #2D5A4A 58%, #4A7A64 100%)',
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(0deg, rgba(255,255,255,0.07) 0 1px, transparent 1px 28px), repeating-linear-gradient(90deg, rgba(196,155,122,0.16) 0 1px, transparent 1px 22px)',
                  }}
                  aria-hidden
                />
                <div className="relative space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F0C9A8]">
                        Bonus exam papers
                      </p>
                      <h3 className="mt-1 text-2xl font-semibold text-white">
                        Exam-style writing, after the course
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm text-white/80">
                        Original TrialSeed papers in the forms used on recent
                        Selective writing tests. One sitting, 30 minutes, no
                        re-attempt. Unlock them by trying every full writing
                        task and every term review at least once.
                      </p>
                    </div>
                    <span className="rounded-full border border-[#E5B993] bg-[#C49B7A] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                      {bonusPapers.access.locked ? 'Locked' : 'Unlocked'}
                    </span>
                  </div>
                  {bonusPapers.access.locked ? (
                    <p className="rounded-lg border border-white/15 bg-brand-dark/45 px-3 py-2 text-sm text-white/90">
                      {bonusPapers.lock_reason ||
                        `${bonusPapers.access.writingTried}/${bonusPapers.access.writingTotal} writing · ${bonusPapers.access.reviewsSat}/${bonusPapers.access.reviewsTotal} reviews`}
                    </p>
                  ) : null}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {(bonusPapers.papers.length
                      ? bonusPapers.papers
                      : Array.from({ length: 6 }).map((_, index) => ({
                          id: `pending-${index}`,
                          title: 'Exam paper',
                          prompt_type: 'narrative',
                          overall_score: null,
                          sat: false,
                          locked: true,
                        }))
                    ).map((paper) => {
                      const href = paper.sat
                        ? `/dashboard/writing/${paper.id}/results`
                        : `/dashboard/writing/${paper.id}`;
                      const card = (
                        <>
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#EEC7A7]">
                            {typeLabel(paper.prompt_type)}
                          </p>
                          <p className="mt-1 font-medium text-white">{paper.title}</p>
                          <p className="mt-3 text-sm text-white/75">
                            {paper.sat
                              ? typeof paper.overall_score === 'number'
                                ? `Sat · ${paper.overall_score}/25`
                                : 'Sat · marked'
                              : paper.locked
                                ? 'Locked until the course is tried'
                                : 'Ready · 30 minutes'}
                          </p>
                        </>
                      );
                      if (paper.locked || paper.id.startsWith('pending-')) {
                        return (
                          <div
                            key={paper.id}
                            className="rounded-lg border border-white/20 bg-brand-dark/25 p-4 opacity-80"
                          >
                            {card}
                          </div>
                        );
                      }
                      return (
                        <Link
                          key={paper.id}
                          href={href}
                          className="rounded-lg border border-[#E5B993]/60 bg-brand-dark/25 p-4 transition hover:border-[#F0C9A8] hover:bg-brand-dark/40"
                        >
                          {card}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </section>
            ) : null}
          </section>
            </>
          ) : (
            <section className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-amber-900">
              <h2 className="font-serif text-xl font-semibold">Writing access needed</h2>
              <p className="mt-1 text-sm">
                {activeStudent?.name ?? 'This child'} has a separate profile, so their
                work stays private and is never mixed with another child’s work. Choose
                a yearly Selective Writing access for this child to start.
              </p>
              <Link
                href="/subscription"
                className="mt-4 inline-flex rounded-full bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-hover"
              >
                Manage this child&apos;s access
              </Link>
            </section>
          )}
        </>
      )}
    </main>
  );
}
