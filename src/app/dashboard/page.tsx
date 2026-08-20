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

type Student = {
  id: string;
  name: string;
  grade: string;
  is_active: boolean;
};

type Prompt = {
  id: string;
  title: string;
  prompt_type: string;
  module_id: number;
  is_locked: boolean;
};

type ProgressRow = {
  module_id: number;
  prompt_count: number;
  completed_count: number;
  is_completed: boolean;
};

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [moduleId, setModuleId] = useState(1);
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
        setUserName(me.data.user?.full_name || me.data.user?.email || 'User');

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
    async function loadModuleData() {
      if (!selectedStudentId) {
        setPrompts([]);
        setProgress([]);
        return;
      }

      const [promptsRes, attemptsRes] = await Promise.all([
        apiFetch(`/api/prompts?module_id=${moduleId}`),
        apiFetch(`/api/writing/attempt?student_id=${selectedStudentId}`),
      ]);

      if (promptsRes.response.ok) {
        setPrompts((promptsRes.data.prompts as Prompt[]) || []);
      }
      if (attemptsRes.response.ok) {
        setProgress((attemptsRes.data.progress as ProgressRow[]) || []);
      }
    }

    void loadModuleData();
  }, [selectedStudentId, moduleId]);

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
    return <main className="mx-auto max-w-4xl p-6">Loading dashboard…</main>;
  }

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-300 pb-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-stone-500">Dashboard</p>
          <h1 className="text-3xl font-semibold text-stone-900">Hi, {userName}</h1>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        >
          Log out
        </button>
      </header>

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <section className="space-y-4 rounded-lg border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-medium">Students</h2>

        {students.length > 0 ? (
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
                {student.name} · {student.grade}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-600">
            Add a student profile to start writing practice.
          </p>
        )}

        <form onSubmit={onCreateStudent} className="grid gap-3 sm:grid-cols-[1fr_8rem_auto]">
          <input
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Student name"
            className="rounded-md border border-stone-300 px-3 py-2"
          />
          <input
            required
            value={newGrade}
            onChange={(e) => setNewGrade(e.target.value)}
            placeholder="Year 5"
            className="rounded-md border border-stone-300 px-3 py-2"
          />
          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-stone-900 px-4 py-2 text-white disabled:opacity-60"
          >
            {creating ? 'Adding…' : 'Add student'}
          </button>
        </form>
      </section>

      <section className="space-y-4 rounded-lg border border-stone-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium">Writing modules</h2>
          <select
            value={moduleId}
            onChange={(e) => setModuleId(Number(e.target.value))}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm"
          >
            {[1, 2, 3, 4, 5, 6].map((id) => {
              const row = progress.find((p) => p.module_id === id);
              const label = row
                ? `Module ${id} (${row.completed_count}/${row.prompt_count})`
                : `Module ${id}`;
              return (
                <option key={id} value={id}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>

        {!selectedStudentId ? (
          <p className="text-sm text-stone-600">Select or add a student first.</p>
        ) : prompts.length === 0 ? (
          <p className="text-sm text-stone-600">No active prompts in this module.</p>
        ) : (
          <ul className="space-y-3">
            {prompts.map((prompt) => (
              <li
                key={prompt.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-stone-200 px-3 py-3"
              >
                <div>
                  <p className="font-medium text-stone-900">{prompt.title}</p>
                  <p className="text-sm text-stone-600">
                    {prompt.prompt_type}
                    {prompt.is_locked ? ' · locked' : ' · unlocked'}
                  </p>
                </div>
                {prompt.is_locked ? (
                  <span className="text-sm text-stone-500">Locked</span>
                ) : (
                  <Link
                    href={`/dashboard/writing/${prompt.id}`}
                    className="rounded-md bg-stone-900 px-3 py-2 text-sm text-white"
                  >
                    Start writing
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
