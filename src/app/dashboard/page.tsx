'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  apiFetch,
  clearSession,
  getStudentId,
  getToken,
  setStudentId,
} from '@/lib/client-auth';
import { MODULES } from '@/lib/modules';

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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState('');
  const [newGrade, setNewGrade] = useState('Year 5');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function boot() {
      if (!getToken()) {
        router.replace('/login');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const me = await apiFetch('/api/auth/me');
        if (!me.response.ok) {
          clearSession();
          router.replace('/login');
          return;
        }
        setUserName(me.data.user?.full_name || me.data.user?.email || 'there');

        const studentsRes = await apiFetch('/api/students');
        if (!studentsRes.response.ok) {
          throw new Error(studentsRes.data.error || 'Failed to load students');
        }

        const list = (studentsRes.data.students as Student[]) || [];
        setStudents(list);

        const saved = getStudentId();
        const initial =
          (saved && list.find((s) => s.id === saved)?.id) || list[0]?.id || null;
        if (initial) {
          setStudentId(initial);
          setSelectedStudentId(initial);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    void boot();
  }, [router]);

  useEffect(() => {
    async function loadProgress() {
      if (!selectedStudentId) {
        setProgress([]);
        return;
      }
      const res = await apiFetch(
        `/api/writing/attempt?student_id=${selectedStudentId}`,
      );
      if (res.response.ok) {
        setProgress((res.data.progress as ProgressRow[]) || []);
      }
    }
    void loadProgress();
  }, [selectedStudentId]);

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
      setSelectedStudentId(student.id);
      setNewName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create student');
    } finally {
      setCreating(false);
    }
  }

  function onSelectStudent(id: string) {
    setStudentId(id);
    setSelectedStudentId(id);
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

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-300 pb-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-stone-500">Dashboard</p>
          <h1 className="text-3xl font-semibold text-stone-900">Hi, {userName}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/subscription"
            className="rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-800"
          >
            Subscription
          </Link>
          <button
            type="button"
            onClick={logout}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm"
          >
            Log out
          </button>
        </div>
      </header>

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {students.length === 0 ? (
        <section className="space-y-4 rounded-lg border border-stone-200 bg-white p-6">
          <div>
            <h2 className="text-xl font-semibold text-stone-900">
              Let&apos;s set up a student profile
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Add the student who will be practising so we can track their
              progress across all six modules.
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
              className="rounded-md border border-stone-300 px-3 py-2"
            />
            <select
              value={newGrade}
              onChange={(e) => setNewGrade(e.target.value)}
              className="rounded-md border border-stone-300 px-3 py-2"
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
              className="rounded-md bg-stone-900 px-4 py-2 text-white disabled:opacity-60"
            >
              {creating ? 'Creating…' : 'Create profile'}
            </button>
          </form>
        </section>
      ) : (
        <>
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white p-4">
            <div>
              <p className="text-sm text-stone-500">Student</p>
              <p className="text-lg font-medium text-stone-900">
                {activeStudent?.name}{' '}
                <span className="text-stone-500">· {activeStudent?.grade}</span>
              </p>
            </div>
            {students.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {students.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => onSelectStudent(student.id)}
                    className={`rounded-md px-3 py-2 text-sm ${
                      selectedStudentId === student.id
                        ? 'bg-stone-900 text-white'
                        : 'border border-stone-300 text-stone-800'
                    }`}
                  >
                    {student.name}
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-stone-900">Writing modules</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MODULES.map((mod) => {
                const row = progress.find((p) => p.module_id === mod.id);
                const status = moduleStatus(row);
                const total = row?.prompt_count ?? 0;
                const done = row?.completed_count ?? 0;
                const pct =
                  total > 0 ? Math.round((done / total) * 100) : 0;

                return (
                  <Link
                    key={mod.id}
                    href={`/dashboard/module/${mod.id}`}
                    className="group flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-5 transition hover:border-stone-400 hover:shadow-sm"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold uppercase tracking-wide text-stone-400">
                          Module {mod.id}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClasses(
                            status,
                          )}`}
                        >
                          {status}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-stone-900">
                        {mod.title}
                      </h3>
                      <p className="text-sm text-stone-600">{mod.blurb}</p>
                    </div>

                    <div className="mt-5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-stone-500">
                        <span>
                          {done}/{total || '—'} prompts
                        </span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                        <div
                          className="h-full rounded-full bg-stone-900 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
