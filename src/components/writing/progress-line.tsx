'use client';

export type HistoryPoint = {
  created_at: string | Date;
  overall_score: number | null;
  draft_number: number;
  prompt_title: string;
};

export function WritingProgressLine({ history }: { history: HistoryPoint[] }) {
  const data = history
    .filter((row) => typeof row.overall_score === 'number')
    .map((row, index) => ({
      index: index + 1,
      score: row.overall_score as number,
      label: `${row.prompt_title} · D${row.draft_number}`,
      date: new Date(row.created_at).toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'short',
      }),
    }));

  return (
    <section className="rounded-lg border border-warm-border bg-warm-card p-5 shadow-card">
      <h2 className="text-lg font-semibold text-warm-ink">Writing progress</h2>
      <p className="mt-1 text-sm text-warm-muted">
        Overall score after each draft (out of 25).
      </p>
      {data.length === 0 ? (
        <p className="mt-6 text-sm text-warm-subtle">
          The line appears after the first submitted draft.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <ol className="flex min-w-max items-end gap-4 px-1 pt-4">
            {data.map((point) => (
              <li key={`${point.index}-${point.label}`} className="w-16 text-center">
                <p className="mb-1 text-xs font-medium text-warm-ink">{point.score}/25</p>
                <div className="flex h-40 items-end rounded-t bg-warm-sand px-2">
                  <div
                    className="w-full rounded-t bg-brand transition-[height]"
                    style={{ height: `${Math.max(4, (point.score / 25) * 100)}%` }}
                    title={`${point.label} · ${point.date}: ${point.score}/25`}
                  />
                </div>
                <p className="mt-2 text-xs text-warm-muted">Draft {point.index}</p>
                <p className="text-xs text-warm-subtle">{point.date}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
