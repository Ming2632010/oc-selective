import Link from 'next/link';
import type { TrialSubject } from '@/lib/trials';

const ACCENT = 'text-indigo-600';
const ACCENT_BG = 'bg-indigo-600 hover:bg-indigo-700';

export function SubjectBlocks({ subjects }: { subjects: TrialSubject[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {subjects.map(({ name, blurb, icon: Icon, available }) => (
        <article
          key={name}
          className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="inline-flex rounded-lg bg-indigo-50 p-2.5">
              <Icon className={`h-5 w-5 ${ACCENT}`} aria-hidden />
            </div>
            {available ? (
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                Available
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                Coming soon
              </span>
            )}
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-900">{name}</h2>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{blurb}</p>
          {available ? (
            <Link
              href="/register"
              className={`mt-6 rounded-md px-4 py-2.5 text-center text-sm font-medium text-white ${ACCENT_BG}`}
            >
              Start {name}
            </Link>
          ) : (
            <p className="mt-6 text-sm text-slate-400">Opens at the same $99 yearly price.</p>
          )}
        </article>
      ))}
    </div>
  );
}
