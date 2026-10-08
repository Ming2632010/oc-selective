import Link from 'next/link';
import type { Program } from '@/lib/programs';

export function ProgramComingSoon({ program }: { program: Program }) {
  return (
    <section className="space-y-4 rounded-lg border border-warm-border bg-warm-card p-6 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">{program.eyebrow}</p>
      <h2 className="text-xl font-semibold text-warm-ink">{program.headline} is on the way</h2>
      <p className="text-sm leading-relaxed text-warm-muted">{program.summary}</p>
      <ul className="flex flex-wrap gap-2">
        {program.subjects.map((subject) => (
          <li
            key={subject.name}
            className="rounded-full bg-[#F0EBE3] px-3 py-1 text-xs font-medium text-warm-muted"
          >
            {subject.name} · Coming soon
          </li>
        ))}
      </ul>
      <p className="text-sm text-warm-muted">
        Each subject will be ${program.priceAud} AUD for one year. Selective Writing stays on
        Year 4–7 profiles, so this child’s work is never mixed with exam-year tasks.
      </p>
      {program.hasPage ? (
        <Link
          href={program.href}
          className="inline-flex rounded-full bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-hover"
        >
          Learn about {program.navLabel}
        </Link>
      ) : null}
    </section>
  );
}
