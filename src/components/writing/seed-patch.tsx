import { GROWTH_STAGES, buildSeedPatchScene, type SeedPatchScene } from '@/lib/rewards';
import { SeedGardenScene } from '@/components/writing/seed-garden';

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
  completed_tasks?: number;
  weekly_harvests?: number;
  scene?: SeedPatchScene;
  recent: { seeds: number; label: string; source: string }[];
};

function sceneFromPatch(patch: SeedPatchData): SeedPatchScene {
  return (
    patch.scene ??
    buildSeedPatchScene({
      lifetimeSeeds: patch.lifetime_seeds,
      completedTasks: patch.completed_tasks ?? 0,
      weeklyHarvests: patch.weekly_harvests ?? 0,
    })
  );
}

export function SeedPatch({ patch }: { patch: SeedPatchData | null }) {
  if (!patch) {
    return (
      <section className="rounded-xl border border-emerald-200/80 bg-[#f4f1ea] p-5">
        <h2 className="text-lg font-semibold text-stone-900">Seed Patch</h2>
        <p className="mt-1 text-sm text-stone-600">
          Seeds appear after the first mini question or writing task.
        </p>
      </section>
    );
  }

  const scene = sceneFromPatch(patch);
  const weekPct = Math.min(
    100,
    Math.round((patch.week_seeds / Math.max(1, patch.week_goal)) * 100),
  );
  const nextLabel =
    GROWTH_STAGES.find((stage) => stage.min === patch.stage.nextAt)?.label ??
    'the next harvest';
  const gardenCount = scene.garden.length;

  return (
    <section className="rounded-xl border border-emerald-200/80 bg-[#f4f1ea] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
            Seed Patch
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-stone-900">
            {scene.active.label}
          </h2>
          <p className="mt-1 text-sm text-stone-700">{scene.active.blurb}</p>
        </div>
        <div className="rounded-lg border border-emerald-100 bg-white/80 px-3 py-2 text-right">
          <p className="text-xs uppercase tracking-wide text-stone-500">Garden</p>
          <p className="text-lg font-semibold text-stone-900">
            {gardenCount} plant{gardenCount === 1 ? '' : 's'}
          </p>
          <p className="text-xs text-stone-600">
            {patch.plot_days} day{patch.plot_days === 1 ? '' : 's'} on the plot
          </p>
        </div>
      </div>

      <SeedGardenScene
        scene={scene}
        lifetimeSeeds={patch.lifetime_seeds}
        className="mt-4"
      />

      <p className="mt-3 text-sm text-stone-700">
        {scene.active.percent >= 100
          ? patch.stage.nextAt
            ? `This ${scene.active.label} plant is ready. It moves into the garden and the ${nextLabel} patch opens.`
            : 'Harvest stage reached — your garden is in full growth.'
          : `${scene.active.capacity - scene.active.filled} seeds until this ${scene.active.label} plant is harvested into the garden.`}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-white/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            This week’s harvest
          </p>
          <p className="mt-1 text-sm text-stone-800">
            {patch.week_seeds}/{patch.week_goal} seeds
            {patch.harvest_claimed ? ' · Harvest in' : ''}
          </p>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-emerald-100">
            <div
              className="h-full rounded-full"
              style={{
                width: `${weekPct}%`,
                background: 'linear-gradient(90deg, #86efac 0%, #22c55e 55%, #15803d 100%)',
              }}
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
            {patch.rain_cheques} rain cheque{patch.rain_cheques === 1 ? '' : 's'} ·{' '}
            {patch.completed_tasks ?? 0} finished task
            {(patch.completed_tasks ?? 0) === 1 ? '' : 's'} in the garden
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-stone-600">
        Work the patch in front. When it fills, that plant is harvested into the
        garden behind it. Mini questions grow it a little. Full drafts pay more.
        Term reviews pay the most.
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
