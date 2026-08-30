'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

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
    <section className="rounded-xl border border-stone-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-stone-900">Writing progress</h2>
      <p className="mt-1 text-sm text-stone-600">
        Overall score after each draft (out of 25).
      </p>
      {data.length === 0 ? (
        <p className="mt-6 text-sm text-stone-500">
          The line appears after the first submitted draft.
        </p>
      ) : (
        <div className="mt-4 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="index" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 25]} tick={{ fontSize: 12 }} width={32} />
              <Tooltip
                formatter={(value) => [`${value}/25`, 'Overall']}
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.label
                    ? `${payload[0].payload.label} · ${payload[0].payload.date}`
                    : ''
                }
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#4f46e5"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
