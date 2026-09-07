import Link from 'next/link';
import type { TrialSubject } from '@/lib/trials';

const ACCENT = 'text-brand';
const ACCENT_BG = 'bg-terracotta hover:bg-terracotta-hover';

export function SubjectBlocks({ subjects }: { subjects: TrialSubject[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {subjects.map(({ name, blurb, icon: Icon, available }) => (
        <article
          key={name}
          className="flex flex-col rounded-lg border border-warm-border bg-warm-card p-6 shadow-card"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="inline-flex rounded-lg bg-[#F5EEE6] p-2.5">
              <Icon className={`h-5 w-5 ${ACCENT}`} aria-hidden />
            </div>
            {available ? (
              <span className="rounded-full bg-[#E3EFE6] px-2.5 py-0.5 text-xs font-medium text-brand-dark">
                Available
              </span>
            ) : (
              <span className="rounded-full bg-[#F0EBE3] px-2.5 py-0.5 text-xs font-medium text-warm-muted">
                Coming soon
              </span>
            )}
          </div>
          <h2 className="mt-4 text-xl font-semibold text-warm-ink">{name}</h2>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-warm-muted">{blurb}</p>
          {available ? (
            <Link
              href="/register"
              className={`mt-6 rounded-full px-4 py-2.5 text-center text-sm font-medium text-white ${ACCENT_BG}`}
            >
              Start {name}
            </Link>
          ) : (
            <p className="mt-6 text-sm text-warm-subtle">Opens at the same $99 yearly price.</p>
          )}
        </article>
      ))}
    </div>
  );
}
