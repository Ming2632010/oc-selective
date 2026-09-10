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
        <div className="mt-4">
          <svg
            viewBox="0 0 100 60"
            role="img"
            aria-label="Line chart of overall writing scores out of 25"
            className="h-52 w-full"
            preserveAspectRatio="none"
          >
            {[0, 5, 10, 15, 20, 25].map((score) => {
              const y = 54 - (score / 25) * 48;
              return (
                <g key={score}>
                  <line x1="5" x2="98" y1={y} y2={y} stroke="#F0EBE3" strokeWidth="0.4" />
                  <text x="0" y={y + 1.5} fill="#9A8E82" fontSize="4">{score}</text>
                </g>
              );
            })}
            <polyline
              points={data
                .map((point, index) => {
                  const x = data.length === 1 ? 51 : 5 + (index / (data.length - 1)) * 93;
                  const y = 54 - (point.score / 25) * 48;
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="#C49B7A"
              strokeWidth="1.5"
            />
            {data.map((point, index) => {
              const x = data.length === 1 ? 51 : 5 + (index / (data.length - 1)) * 93;
              const y = 54 - (point.score / 25) * 48;
              return (
                <g key={`${point.index}-${point.label}`}>
                  <title>{`${point.label} · ${point.date}: ${point.score}/25`}</title>
                  <circle cx={x} cy={y} r="2" fill="#2D5A4A" stroke="#FFFFFF" strokeWidth="0.8" />
                  <text x={x} y="59" textAnchor="middle" fill="#6B5F55" fontSize="3.5">
                    D{point.index}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </section>
  );
}
