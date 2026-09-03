import type { ActivePatchView, GardenPlant, GardenPlantKind, SeedPatchScene } from '@/lib/rewards';

const GARDEN_SLOTS: { left: string; bottom: string; scale: number }[] = [
  { left: '7%', bottom: '56%', scale: 0.92 },
  { left: '18%', bottom: '64%', scale: 0.78 },
  { left: '29%', bottom: '54%', scale: 0.88 },
  { left: '71%', bottom: '55%', scale: 0.9 },
  { left: '82%', bottom: '63%', scale: 0.76 },
  { left: '91%', bottom: '52%', scale: 0.84 },
  { left: '11%', bottom: '46%', scale: 0.7 },
  { left: '22%', bottom: '44%', scale: 0.66 },
  { left: '78%', bottom: '44%', scale: 0.68 },
  { left: '88%', bottom: '46%', scale: 0.64 },
  { left: '5%', bottom: '72%', scale: 0.58 },
  { left: '16%', bottom: '76%', scale: 0.55 },
  { left: '27%', bottom: '73%', scale: 0.6 },
  { left: '73%', bottom: '74%', scale: 0.56 },
  { left: '84%', bottom: '77%', scale: 0.54 },
  { left: '94%', bottom: '70%', scale: 0.58 },
  { left: '38%', bottom: '70%', scale: 0.5 },
  { left: '62%', bottom: '71%', scale: 0.5 },
];

function PlantSvg({
  kind,
  className,
}: {
  kind: GardenPlantKind | 'active';
  className?: string;
}) {
  const stroke = kind === 'week' ? '#15803d' : kind === 'task' ? '#16a34a' : '#166534';
  const fill = kind === 'week' ? '#4ade80' : kind === 'task' ? '#86efac' : '#22c55e';
  return (
    <svg
      viewBox="0 0 64 80"
      className={className}
      aria-hidden
    >
      <path d="M32 78 V28" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" />
      <ellipse cx="20" cy="36" rx="12" ry="8" fill={fill} transform="rotate(-28 20 36)" />
      <ellipse cx="44" cy="34" rx="13" ry="8" fill={fill} transform="rotate(30 44 34)" />
      {kind !== 'task' ? (
        <ellipse cx="32" cy="22" rx="10" ry="7" fill="#bbf7d0" />
      ) : null}
      {kind === 'stage' || kind === 'active' || kind === 'week' ? (
        <circle cx="32" cy="16" r={kind === 'active' ? 6 : 4} fill="#4ade80" />
      ) : null}
    </svg>
  );
}

function ActivePlant({ percent }: { percent: number }) {
  const scale = 0.45 + (Math.max(8, percent) / 100) * 0.7;
  return (
    <div
      className="flex h-32 w-28 items-end justify-center sm:h-40 sm:w-32"
      style={{ transform: `scale(${scale})`, transformOrigin: 'bottom center' }}
    >
      <PlantSvg kind="active" className="h-full w-full drop-shadow-sm" />
    </div>
  );
}

export function SeedGardenScene({
  scene,
  lifetimeSeeds,
  className,
}: {
  scene: SeedPatchScene;
  lifetimeSeeds: number;
  className?: string;
}) {
  const plants = scene.garden.slice(0, GARDEN_SLOTS.length);

  return (
    <figure className={className}>
      <div className="relative isolate overflow-hidden rounded-2xl border border-emerald-200/80 shadow-sm">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, #dbeafe 0%, #ecfdf5 28%, #bbf7d0 52%, #86efac 68%, #4d7c0f 100%)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[46%]"
          style={{
            background:
              'linear-gradient(180deg, rgba(120, 80, 40, 0.15) 0%, #a16207 18%, #78350f 100%)',
          }}
        />
        <div className="relative h-72 sm:h-80">
          {plants.map((plant, index) => {
            const slot = GARDEN_SLOTS[index];
            return (
              <span
                key={plant.id}
                title={plant.label}
                className="absolute -translate-x-1/2"
                style={{
                  left: slot.left,
                  bottom: slot.bottom,
                  width: `${3.4 * slot.scale}rem`,
                  opacity: 0.95,
                }}
              >
                <PlantSvg kind={plant.kind} className="h-auto w-full" />
                <span className="sr-only">{plant.label}</span>
              </span>
            );
          })}

          <div className="absolute bottom-[6%] left-1/2 z-10 w-[min(92%,22rem)] -translate-x-1/2 sm:w-[22rem]">
            <ActivePatchBed
              active={scene.active}
              lifetimeSeeds={lifetimeSeeds}
            />
          </div>
        </div>
      </div>
    </figure>
  );
}

export function ActivePatchBed({
  active,
  lifetimeSeeds,
}: {
  active: ActivePatchView;
  lifetimeSeeds: number;
}) {
  return (
    <div className="rounded-2xl border-2 border-amber-800/40 bg-gradient-to-b from-amber-100 to-amber-200 px-4 pb-4 pt-3 shadow-lg">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
            Current patch
          </p>
          <p className="text-lg font-semibold text-stone-900">{active.label}</p>
          <p className="text-xs text-stone-600">{active.blurb}</p>
        </div>
        <p className="text-right">
          <span className="block text-3xl font-semibold tabular-nums text-emerald-800 sm:text-4xl">
            {lifetimeSeeds}
          </span>
          <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
            seed{lifetimeSeeds === 1 ? '' : 's'}
          </span>
        </p>
      </div>

      <div className="mt-1 flex justify-center">
        <div className="relative flex h-36 w-40 items-end justify-center sm:h-44 sm:w-44">
          <span
            className="absolute bottom-1 left-1/2 h-6 w-28 -translate-x-1/2 rounded-[100%] bg-amber-800/50"
            aria-hidden
          />
          <ActivePlant percent={active.percent} />
        </div>
      </div>

      <div className="mt-2 space-y-1">
        <div className="flex justify-between text-xs text-stone-600">
          <span>
            {active.percent >= 100
              ? 'Ready to harvest'
              : `${active.filled}/${active.capacity} to harvest`}
          </span>
          <span>{active.percent}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-emerald-100">
          <div
            className="h-full rounded-full"
            style={{
              width: `${active.percent}%`,
              background: 'linear-gradient(90deg, #86efac 0%, #22c55e 55%, #15803d 100%)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function SeedGardenPath({
  scene,
  lifetimeSeeds,
}: {
  scene: SeedPatchScene;
  lifetimeSeeds: number;
}) {
  return <SeedGardenScene scene={scene} lifetimeSeeds={lifetimeSeeds} />;
}
