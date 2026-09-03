import { buildSeedPatchScene, type SeedPatchScene } from '@/lib/rewards';
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
      <section className="overflow-hidden rounded-2xl">
        <h2 className="sr-only">Seed Patch</h2>
        <SeedGardenScene
          scene={buildSeedPatchScene({ lifetimeSeeds: 0 })}
          lifetimeSeeds={0}
        />
      </section>
    );
  }

  const scene = sceneFromPatch(patch);

  return (
    <section className="overflow-hidden rounded-2xl">
      <h2 className="sr-only">
        Seed Patch · {patch.lifetime_seeds} seeds · {scene.active.label}
      </h2>
      <SeedGardenScene scene={scene} lifetimeSeeds={patch.lifetime_seeds} />
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
