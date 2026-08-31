'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, getStudentId, getToken } from '@/lib/client-auth';
import { getUnitInfo, typeLabel } from '@/lib/units';
import { MINI_SKILL_LABELS, type MiniSkill } from '@/lib/seed-mini-drills';

type Prompt = {
  id: string;
  title: string;
  prompt_type: string;
  module_id: number;
  is_locked: boolean;
};

type PromptWithStatus = Prompt & {
  maxDraft: number;
};

type MiniDrillCard = {
  id: string;
  slug: string;
  skill: MiniSkill;
  title: string;
  attempted: boolean;
};

function draftStatusLabel(maxDraft: number): string {
  switch (maxDraft) {
    case 0:
      return 'Not Started';
    case 1:
      return 'Draft 1 Done';
    case 2:
      return 'Draft 2 Done';
    default:
      return 'Completed';
  }
}

function statusBadgeClasses(maxDraft: number): string {
  if (maxDraft >= 3) return 'bg-emerald-100 text-emerald-800';
  if (maxDraft > 0) return 'bg-amber-100 text-amber-800';
  return 'bg-stone-100 text-stone-600';
}

export default function UnitPage() {
  const params = useParams<{ unitId: string }>();
  const router = useRouter();
  const unitId = Number(params.unitId);
  const unitInfo = getUnitInfo(unitId);

  const [prompts, setPrompts] = useState<PromptWithStatus[]>([]);
  const [drills, setDrills] = useState<MiniDrillCard[]>([]);
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
      if (!Number.isInteger(unitId) || unitId < 1 || unitId > 11) {
        setError('Invalid unit');
        setLoading(false);
        return;
      }

      try {
        const [promptRes, drillRes] = await Promise.all([
          apiFetch(`/api/prompts?module_id=${unitId}&student_id=${studentId}`),
          apiFetch(`/api/writing/drills?module_id=${unitId}&student_id=${studentId}`),
        ]);
        if (!promptRes.response.ok) {
          throw new Error(promptRes.data.error || 'Failed to load prompts');
        }
        const list = (promptRes.data.prompts as Prompt[]) || [];
        setDrills((drillRes.data.drills as MiniDrillCard[]) || []);

        const withStatus = await Promise.all(
          list.map(async (prompt) => {
            const attemptsRes = await apiFetch(
              `/api/writing/attempt?student_id=${studentId}&prompt_id=${prompt.id}`,
            );
            const attempts =
              (attemptsRes.data.attempts as { draft_number: number }[]) || [];
            const maxDraft = attempts.reduce(
              (max, a) => Math.max(max, a.draft_number),
              0,
            );
            return { ...prompt, maxDraft };
          }),
        );

        setPrompts(withStatus);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load unit');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [unitId, router]);

  if (loading) {
    return <main className="mx-auto max-w-4xl p-6">Loading unit…</main>;
  }

  const miniDone = drills.filter((d) => d.attempted).length;

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <header className="border-b border-stone-300 pb-4">
        <Link href="/dashboard" className="text-sm text-stone-500 hover:underline">
          ← Back to dashboard
        </Link>
        <p className="mt-2 text-sm uppercase tracking-wide text-stone-500">
          Unit {unitId} · {unitInfo.group}
        </p>
        <h1 className="text-3xl font-semibold text-stone-900">{unitInfo.title}</h1>
        <p className="mt-1 text-stone-600">{unitInfo.blurb}</p>
      </header>

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Mini practice</h2>
          <p className="mt-1 text-sm text-stone-600">
            Short questions on format, audience, word choice, punctuation, and
            structure — at Selective Year 5–6 level. {miniDone}/{drills.length}{' '}
            tried.
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {drills.map((drill) => (
            <li key={drill.slug}>
              <Link
                href={`/dashboard/unit/${unitId}/practice/${drill.slug}`}
                className="block rounded-lg border border-stone-200 bg-white px-4 py-4 transition hover:border-stone-400 hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                    {MINI_SKILL_LABELS[drill.skill] ?? drill.skill}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      drill.attempted ? 'text-emerald-700' : 'text-stone-500'
                    }`}
                  >
                    {drill.attempted ? 'Tried' : 'New'}
                  </span>
                </div>
                <p className="mt-2 font-medium text-stone-900">{drill.title}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Full writing task</h2>
          <p className="mt-1 text-sm text-stone-600">
            30-minute Selective-style task, up to three drafts.
          </p>
        </div>
        {prompts.length === 0 && !error ? (
          <p className="text-sm text-stone-600">No writing tasks in this unit yet.</p>
        ) : (
          <ul className="space-y-3">
            {prompts.map((prompt) => (
              <li key={prompt.id}>
                <Link
                  href={`/dashboard/writing/${prompt.id}`}
                  className="block rounded-lg border border-stone-200 bg-white px-4 py-4 transition hover:border-stone-400 hover:shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700">
                        {typeLabel(prompt.prompt_type)}
                      </span>
                      <p className="font-medium text-stone-900">{prompt.title}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClasses(
                        prompt.maxDraft,
                      )}`}
                    >
                      {draftStatusLabel(prompt.maxDraft)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
