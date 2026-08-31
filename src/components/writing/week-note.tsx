import type { WeekNoteData } from '@/lib/week-note';

export function WeekNote({ note }: { note: WeekNoteData | null }) {
  if (!note) return null;

  const lastTest =
    note.last_test_title && typeof note.last_test_score === 'number'
      ? `${note.last_test_title} · ${note.last_test_score}/25`
      : note.last_test_title
        ? note.last_test_title
        : 'No term review sat yet';

  const nextForm = note.next_form_label
    ? note.next_title
      ? `${note.next_form_label} — ${note.next_title}`
      : note.next_form_label
    : 'Any unit you want to practise';

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
        This week
      </p>
      <h2 className="mt-1 text-lg font-semibold text-stone-900">Parent note</h2>
      <ul className="mt-3 grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
        <li>
          <span className="text-stone-500">On-plot days · </span>
          {note.plot_days}
        </li>
        <li>
          <span className="text-stone-500">Focused minutes · </span>
          {note.focused_minutes}
        </li>
        <li className="sm:col-span-2">
          <span className="text-stone-500">Last term review · </span>
          {lastTest}
        </li>
        <li className="sm:col-span-2">
          <span className="text-stone-500">Next form to practise · </span>
          {nextForm}
        </li>
      </ul>
    </section>
  );
}
