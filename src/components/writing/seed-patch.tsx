import { GROWTH_STAGES } from '@/lib/rewards';

export type SeedPatchData = {
  lifetime_seeds: number;
  week_seeds: number;
  week_goal: number;
  harvest_claimed: boolean;
  plot_days: number;
  rain_cheques: number;
  focused_minutes_week: number;
  stage: {
    id: string;
    label: string;
    blurb: string;
    min: number;
    nextAt: number | null;
  };
  recent: { seeds: number; label: string; source: string }[];
};

export function SeedPatch({ patch }: { patch: SeedPatchData | null }) {
  if (!patch) {
    return (
      <section className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-5">
        <h2 className="text-lg font-semibold text-stone-900">Seed Patch</h2>
        <p className="mt-1 text-sm text-stone-600">
          Seeds appear after the first mini question or writing task.
        </p>
      </section>
    );
  }

  const next = patch.stage.nextAt;
  const span = next ? next - patch.stage.min : 1;
  const into = next ? Math.min(span, patch.lifetime_seeds - patch.stage.min) : span;
  const stagePct = next ? Math.round((into / span) * 100) : 100;
  const weekPct = Math.min(
    100,
    Math.round((patch.week_seeds / Math.max(1, patch.week_goal)) * 100),
  );

  return (
    <section className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-lime-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
            Seed Patch
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-stone-900">
            {patch.lifetime_seeds} seed{patch.lifetime_seeds === 1 ? '' : 's'}
          </h2>
          <p className="mt-1 text-sm text-stone-700">
            {patch.stage.label} — {patch.stage.blurb}
          </p>
        </div>
        <div className="rounded-lg bg-white/80 px-3 py-2 text-right">
          <p className="text-xs uppercase tracking-wide text-stone-500">On-plot</p>
          <p className="text-lg font-semibold text-emerald-900">
            {patch.plot_days} day{patch.plot_days === 1 ? '' : 's'}
          </p>
          <p className="text-xs text-stone-600">
            {patch.rain_cheques} rain cheque{patch.rain_cheques === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between text-xs text-stone-600">
          <span>
            {next
              ? `${next - patch.lifetime_seeds} seeds to ${
                  GROWTH_STAGES.find((stage) => stage.min === next)?.label ??
                  'the next stage'
                }`
              : 'Harvest stage reached'}
          </span>
          <span>{stagePct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/80">
          <div
            className="h-full rounded-full bg-emerald-700"
            style={{ width: `${stagePct}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-white/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            This week’s harvest
          </p>
          <p className="mt-1 text-sm text-stone-800">
            {patch.week_seeds}/{patch.week_goal} seeds
            {patch.harvest_claimed ? ' · Harvest in' : ''}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-100">
            <div
              className="h-full rounded-full bg-emerald-600"
              style={{ width: `${weekPct}%` }}
            />
          </div>
        </div>
        <div className="rounded-lg bg-white/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Focused writing
          </p>
          <p className="mt-1 text-sm text-stone-800">
            {patch.focused_minutes_week} minute
            {patch.focused_minutes_week === 1 ? '' : 's'} this week
          </p>
          <p className="mt-1 text-xs text-stone-500">
            From full tasks and term reviews, not the timer sitting idle.
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-stone-600">
        Mini questions grow the patch a little (capped each day). Full drafts pay
        more. Term reviews pay the most — sitting, your mark, and a focused
        exam sitting all count. Show up on consecutive Sydney days to keep the
        plot; a rain cheque covers one missed day.
      </p>

      {patch.recent.length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm text-stone-700">
          {patch.recent.slice(0, 4).map((row, index) => (
            <li key={`${row.label}-${index}`} className="flex justify-between gap-3">
              <span>{row.label}</span>
              <span className="shrink-0 font-medium text-emerald-800">
                {row.seeds > 0 ? `+${row.seeds}` : '—'}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function SeedAwardBanner({
  total,
  lines,
}: {
  total: number;
  lines: { seeds: number; label: string }[];
}) {
  if (!lines.length && total <= 0) return null;
  return (
    <section className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
      <p className="text-sm font-semibold text-emerald-950">
        {total > 0 ? `+${total} seeds` : 'Seed Patch'}
      </p>
      <ul className="mt-1 space-y-0.5 text-sm text-emerald-900">
        {lines.map((line) => (
          <li key={line.label}>
            {line.seeds > 0 ? `+${line.seeds} · ` : ''}
            {line.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
