'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, getStudentId, getToken } from '@/lib/client-auth';
import { getUnitInfo, typeLabel } from '@/lib/units';
import {
  MINI_ITEM_KIND_LABELS,
  type MiniItemKind,
} from '@/lib/mini-item-kinds';
import { MINI_SKILL_LABELS, type MiniSkill } from '@/lib/seed-mini-drills';

type Prompt = {
  id: string;
  title: string;
  prompt_type: string;
  module_id: number;
  is_locked: boolean;
  kind?: 'practice' | 'test';
  max_draft?: number;
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
  source?: 'seed' | 'ai';
  item_kind?: MiniItemKind;
};

const KIND_BADGE: Record<MiniItemKind, string> = {
  choice: 'bg-indigo-50 text-indigo-700',
  spelling: 'bg-amber-50 text-amber-800',
  rewrite: 'bg-sky-50 text-sky-800',
  order: 'bg-violet-50 text-violet-800',
  short_write: 'bg-teal-50 text-teal-800',
};

type ExtraMeta = {
  can_generate: boolean;
  remaining_today: number;
  remaining_unit: number;
  suggested_skills: MiniSkill[];
  reason: string;
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
  const [extra, setExtra] = useState<ExtraMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateNote, setGenerateNote] = useState<string | null>(null);

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
          apiFetch(`/api/prompts?module_id=${unitId}&kind=practice&student_id=${studentId}`),
          apiFetch(`/api/writing/drills?module_id=${unitId}&student_id=${studentId}`),
        ]);
        if (!promptRes.response.ok) {
          throw new Error(promptRes.data.error || 'Failed to load prompts');
        }
        const list = (promptRes.data.prompts as Prompt[]) || [];
        setDrills((drillRes.data.drills as MiniDrillCard[]) || []);
        setExtra((drillRes.data.extra as ExtraMeta | null) ?? null);
        setPrompts(
          list.map((prompt) => ({
            ...prompt,
            maxDraft: Number(prompt.max_draft) || 0,
          })),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load unit');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [unitId, router]);

  async function generateMore() {
    const studentId = getStudentId();
    if (!studentId || generating) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await apiFetch('/api/writing/drills/generate', {
        method: 'POST',
        body: JSON.stringify({ student_id: studentId, module_id: unitId }),
      });
      if (!res.response.ok) {
        throw new Error(res.data.error || 'Could not make extra questions');
      }
      const drillRes = await apiFetch(
        `/api/writing/drills?module_id=${unitId}&student_id=${studentId}`,
      );
      if (drillRes.response.ok) {
        setDrills((drillRes.data.drills as MiniDrillCard[]) || []);
      } else {
        const fresh = (res.data.drills as MiniDrillCard[]) || [];
        setDrills((prev) => {
          const have = new Set(prev.map((row) => row.slug));
          return [...prev, ...fresh.filter((row) => !have.has(row.slug))];
        });
      }
      setExtra((res.data.extra as ExtraMeta | null) ?? extra);
      setGenerateNote(
        typeof res.data.reason === 'string' ? res.data.reason : 'Extra questions added.',
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not make extra questions',
      );
    } finally {
      setGenerating(false);
    }
  }

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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Mini practice</h2>
            <p className="mt-1 text-sm text-stone-600">
              Multiple-choice plus short writing: spelling, rewrite, sentence
              order, and 1–2 sentence practice — at Selective Year 5–6 level.
              Tried questions keep your answer so you can open them again.{' '}
              {miniDone}/{drills.length} tried.
            </p>
          </div>
          {extra?.can_generate ? (
            <button
              type="button"
              onClick={() => void generateMore()}
              disabled={generating}
              className="shrink-0 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {generating ? 'Adding questions…' : 'More practice for me'}
            </button>
          ) : extra && extra.remaining_unit <= 0 ? (
            <p className="max-w-xs text-right text-xs text-stone-500">
              Enough extra questions for this unit. Try the full writing tasks.
            </p>
          ) : extra ? (
            <p className="max-w-xs text-right text-xs text-stone-500">
              Come back tomorrow for more extra questions.
            </p>
          ) : null}
        </div>
        {generateNote ? (
          <p className="rounded-md border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
            {generateNote}
          </p>
        ) : extra?.reason ? (
          <p className="text-sm text-stone-600">{extra.reason}</p>
        ) : null}
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {drills.map((drill) => (
            <li key={drill.slug}>
              <Link
                href={`/dashboard/unit/${unitId}/practice/${drill.slug}`}
                className="block rounded-lg border border-stone-200 bg-white px-4 py-4 transition hover:border-stone-400 hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                      KIND_BADGE[drill.item_kind ?? 'choice']
                    }`}
                  >
                    {drill.source === 'ai' ? 'Extra · ' : ''}
                    {drill.item_kind && drill.item_kind !== 'choice'
                      ? MINI_ITEM_KIND_LABELS[drill.item_kind]
                      : MINI_SKILL_LABELS[drill.skill] ?? drill.skill}
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
          <h2 className="text-lg font-semibold text-stone-900">Full writing tasks</h2>
          <p className="mt-1 text-sm text-stone-600">
            Three 30-minute Selective-style tasks. Each draft is saved. Open
            Review to see your writing and marks any time. Term review tests sit
            on the dashboard under this group.
          </p>
        </div>
        {prompts.length === 0 && !error ? (
          <p className="text-sm text-stone-600">No writing tasks in this unit yet.</p>
        ) : (
          <ul className="space-y-3">
            {prompts.map((prompt) => (
              <li key={prompt.id}>
                <div className="rounded-lg border border-stone-200 bg-white px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                      href={
                        prompt.maxDraft >= 3
                          ? `/dashboard/writing/${prompt.id}/results`
                          : `/dashboard/writing/${prompt.id}`
                      }
                      className="space-y-1.5 hover:underline"
                    >
                      <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700">
                        {typeLabel(prompt.prompt_type)}
                      </span>
                      <p className="font-medium text-stone-900">{prompt.title}</p>
                    </Link>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClasses(
                        prompt.maxDraft,
                      )}`}
                    >
                      {draftStatusLabel(prompt.maxDraft)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm">
                    {prompt.maxDraft >= 3 ? (
                      <Link
                        href={`/dashboard/writing/${prompt.id}/results`}
                        className="font-medium text-indigo-700 hover:underline"
                      >
                        Review saved drafts
                      </Link>
                    ) : (
                      <>
                        <Link
                          href={`/dashboard/writing/${prompt.id}`}
                          className="font-medium text-indigo-700 hover:underline"
                        >
                          {prompt.maxDraft > 0
                            ? `Continue draft ${prompt.maxDraft + 1}`
                            : 'Start this task'}
                        </Link>
                        {prompt.maxDraft > 0 ? (
                          <Link
                            href={`/dashboard/writing/${prompt.id}/results`}
                            className="text-stone-600 hover:underline"
                          >
                            Review saved drafts
                          </Link>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
