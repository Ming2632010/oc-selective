import type {
  ActivePatchView,
  GardenPlant,
  GardenPlantKind,
  SeedPatchScene,
} from '@/lib/rewards';

type Slot = { left: string; bottom: string; scale: number };

const TREE_SLOTS: Slot[] = [
  { left: '8%', bottom: '54%', scale: 1.2 },
  { left: '92%', bottom: '52%', scale: 1.22 },
  { left: '18%', bottom: '62%', scale: 0.95 },
  { left: '82%', bottom: '61%', scale: 1 },
  { left: '4%', bottom: '46%', scale: 0.88 },
  { left: '96%', bottom: '45%', scale: 0.9 },
  { left: '26%', bottom: '66%', scale: 0.8 },
  { left: '74%', bottom: '66%', scale: 0.82 },
];

const BUSH_SLOTS: Slot[] = [
  { left: '6%', bottom: '34%', scale: 1.05 },
  { left: '94%', bottom: '32%', scale: 1.05 },
  { left: '16%', bottom: '40%', scale: 0.92 },
  { left: '84%', bottom: '39%', scale: 0.95 },
  { left: '10%', bottom: '24%', scale: 0.85 },
  { left: '90%', bottom: '24%', scale: 0.85 },
  { left: '22%', bottom: '46%', scale: 0.78 },
  { left: '78%', bottom: '46%', scale: 0.78 },
  { left: '3%', bottom: '42%', scale: 0.75 },
  { left: '97%', bottom: '41%', scale: 0.75 },
];

const FLOWER_SLOTS: Slot[] = [
  { left: '4%', bottom: '14%', scale: 0.95 },
  { left: '96%', bottom: '15%', scale: 0.95 },
  { left: '12%', bottom: '11%', scale: 1 },
  { left: '88%', bottom: '12%', scale: 1 },
  { left: '20%', bottom: '17%', scale: 0.88 },
  { left: '80%', bottom: '17%', scale: 0.88 },
  { left: '8%', bottom: '22%', scale: 0.8 },
  { left: '92%', bottom: '22%', scale: 0.8 },
  { left: '26%', bottom: '12%', scale: 0.78 },
  { left: '74%', bottom: '12%', scale: 0.78 },
  { left: '3%', bottom: '30%', scale: 0.72 },
  { left: '97%', bottom: '30%', scale: 0.72 },
  { left: '16%', bottom: '27%', scale: 0.7 },
  { left: '84%', bottom: '27%', scale: 0.7 },
  { left: '28%', bottom: '21%', scale: 0.68 },
  { left: '72%', bottom: '21%', scale: 0.68 },
];

const FLOWER_COLOURS = ['#facc15', '#fb7185', '#e879f9', '#ffffff', '#fb923c', '#38bdf8'];

function FlowerSvg({ colour }: { colour: string }) {
  return (
    <svg viewBox="0 0 64 80" className="h-full w-full overflow-visible" aria-hidden>
      <path d="M32 78 V34" stroke="#166534" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="22" cy="52" rx="10" ry="5" fill="#22c55e" transform="rotate(-32 22 52)" />
      <ellipse cx="42" cy="50" rx="10" ry="5" fill="#16a34a" transform="rotate(28 42 50)" />
      <circle cx="32" cy="24" r="7" fill={colour} />
      <circle cx="22" cy="28" r="6" fill={colour} />
      <circle cx="42" cy="28" r="6" fill={colour} />
      <circle cx="26" cy="16" r="6" fill={colour} />
      <circle cx="38" cy="16" r="6" fill={colour} />
      <circle cx="32" cy="24" r="4" fill="#fde68a" />
    </svg>
  );
}

function BushSvg() {
  return (
    <svg viewBox="0 0 80 64" className="h-full w-full overflow-visible" aria-hidden>
      <ellipse cx="40" cy="50" rx="28" ry="14" fill="#15803d" />
      <ellipse cx="24" cy="38" rx="16" ry="14" fill="#16a34a" />
      <ellipse cx="56" cy="36" rx="17" ry="15" fill="#22c55e" />
      <ellipse cx="40" cy="28" rx="18" ry="16" fill="#4ade80" />
      <circle cx="30" cy="34" r="3" fill="#facc15" />
      <circle cx="50" cy="30" r="3" fill="#fb7185" />
    </svg>
  );
}

function TreeSvg() {
  return (
    <svg viewBox="0 0 80 110" className="h-full w-full overflow-visible" aria-hidden>
      <path d="M40 108 V58" stroke="#7c4a1e" strokeWidth="8" strokeLinecap="round" />
      <ellipse cx="40" cy="44" rx="28" ry="22" fill="#166534" />
      <ellipse cx="24" cy="50" rx="16" ry="14" fill="#15803d" />
      <ellipse cx="56" cy="50" rx="16" ry="14" fill="#16a34a" />
      <ellipse cx="40" cy="32" rx="18" ry="14" fill="#22c55e" />
    </svg>
  );
}

function GrassTuft({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 24" className={className} aria-hidden>
      <path d="M8 24 C10 10, 6 6, 12 2" stroke="#16a34a" strokeWidth="2" fill="none" />
      <path d="M18 24 C18 12, 14 8, 20 4" stroke="#22c55e" strokeWidth="2.2" fill="none" />
      <path d="M28 24 C30 12, 26 8, 32 3" stroke="#15803d" strokeWidth="2" fill="none" />
    </svg>
  );
}

function GrowingPlotPlant({
  percent,
  kind,
}: {
  percent: number;
  kind: GardenPlantKind;
}) {
  if (percent <= 0) {
    return (
      <svg viewBox="0 0 64 28" className="mb-3 h-7 w-16" aria-hidden>
        <ellipse cx="20" cy="16" rx="5" ry="3" fill="#a16207" />
        <ellipse cx="32" cy="18" rx="6" ry="3.5" fill="#854d0e" />
        <ellipse cx="44" cy="16" rx="5" ry="3" fill="#a16207" />
      </svg>
    );
  }
  if (percent < 40) {
    return (
      <svg viewBox="0 0 24 40" className="h-[55%] w-auto drop-shadow" aria-hidden>
        <path d="M12 40 V14" stroke="#4d7c0f" strokeWidth="2.4" strokeLinecap="round" />
        <ellipse cx="12" cy="12" rx="5" ry="7" fill="#86efac" />
      </svg>
    );
  }
  if (kind === 'tree') {
    return (
      <span className="flex h-[82%] w-[70%] items-end">
        <TreeSvg />
      </span>
    );
  }
  if (kind === 'bush') {
    return (
      <span className="flex h-[78%] w-[68%] items-end">
        <BushSvg />
      </span>
    );
  }
  return (
    <span className="flex h-[72%] w-[46%] items-end">
      <FlowerSvg colour="#4ade80" />
    </span>
  );
}

function GardenPlantMark({
  plant,
  slot,
  delay,
  colour,
}: {
  plant: GardenPlant;
  slot: Slot;
  delay: string;
  colour: string;
}) {
  const width =
    plant.kind === 'tree'
      ? 6.4 * slot.scale
      : plant.kind === 'bush'
        ? 5 * slot.scale
        : 3.1 * slot.scale;
  return (
    <span
      title={plant.label}
      className="absolute z-[1] -translate-x-1/2"
      style={{
        left: slot.left,
        bottom: slot.bottom,
        width: `${width}rem`,
      }}
    >
      <span
        className="block origin-bottom animate-sway"
        style={{ animationDelay: delay }}
      >
        {plant.kind === 'tree' ? (
          <TreeSvg />
        ) : plant.kind === 'bush' ? (
          <BushSvg />
        ) : (
          <FlowerSvg colour={colour} />
        )}
      </span>
      <span className="sr-only">{plant.label}</span>
    </span>
  );
}

function slotsFor(kind: GardenPlantKind, count: number): Slot[] {
  const source =
    kind === 'tree' ? TREE_SLOTS : kind === 'bush' ? BUSH_SLOTS : FLOWER_SLOTS;
  const slots: Slot[] = [];
  for (let index = 0; index < count; index += 1) {
    const base = source[index % source.length];
    const wrap = Math.floor(index / source.length);
    const left = Math.min(97, Math.max(3, parseFloat(base.left) + wrap * 3));
    const bottom = Math.min(68, Math.max(10, parseFloat(base.bottom) + wrap * 2));
    slots.push({
      left: `${left}%`,
      bottom: `${bottom}%`,
      scale: base.scale * (wrap ? 0.85 : 1),
    });
  }
  return slots;
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
  const trees = scene.garden.filter((plant) => plant.kind === 'tree');
  const bushes = scene.garden.filter((plant) => plant.kind === 'bush');
  const flowers = scene.garden.filter((plant) => plant.kind === 'flower');

  return (
    <figure className={className}>
      <div
        data-testid="seed-garden"
        className="relative h-[32rem] overflow-hidden rounded-2xl sm:h-[40rem]"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, #7dd3fc 0%, #bae6fd 22%, #fef9c3 38%, #bbf7d0 48%, #4ade80 68%, #15803d 100%)',
          }}
        />

        <span
          className="absolute right-[10%] top-[7%] h-14 w-14 rounded-full bg-amber-200 shadow-[0_0_46px_16px_rgba(253,224,71,0.55)] sm:h-[4.5rem] sm:w-[4.5rem]"
          aria-hidden
        />
        <span
          className="absolute left-[8%] top-[10%] h-8 w-16 rounded-full bg-white/80 animate-cloud-drift"
          aria-hidden
        />
        <span
          className="absolute left-[14%] top-[12%] h-6 w-12 rounded-full bg-white/70 animate-cloud-drift"
          aria-hidden
        />
        <span
          className="absolute right-[28%] top-[14%] h-7 w-20 rounded-full bg-white/75 animate-cloud-drift"
          style={{ animationDelay: '2s' }}
          aria-hidden
        />

        <svg
          className="absolute inset-x-0 top-[26%] h-[34%] w-full"
          viewBox="0 0 400 140"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M0 88 Q 70 36 140 78 T 280 70 T 400 86 V140 H0 Z"
            fill="#3f6212"
          />
          <path
            d="M0 102 Q 90 54 170 96 T 400 100 V140 H0 Z"
            fill="#4d7c0f"
          />
          <path
            d="M0 116 Q 110 78 200 112 T 400 114 V140 H0 Z"
            fill="#166534"
          />
        </svg>

        <div
          className="absolute inset-x-0 bottom-0 h-[52%]"
          style={{
            background:
              'linear-gradient(180deg, rgba(74,222,128,0.15) 0%, #4ade80 10%, #22c55e 36%, #15803d 100%)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[28%]"
          style={{
            background:
              'repeating-linear-gradient(90deg, rgba(21,128,61,0.16) 0 9px, rgba(134,239,172,0.12) 9px 18px)',
          }}
        />

        <GrassTuft className="absolute bottom-[20%] left-[7%] h-7 w-11 opacity-80" />
        <GrassTuft className="absolute bottom-[14%] left-[22%] h-6 w-9 opacity-70" />
        <GrassTuft className="absolute bottom-[18%] left-[34%] h-5 w-8 opacity-60" />
        <GrassTuft className="absolute bottom-[16%] right-[10%] h-7 w-11 opacity-80" />
        <GrassTuft className="absolute bottom-[12%] right-[24%] h-6 w-9 opacity-70" />
        <GrassTuft className="absolute bottom-[20%] right-[36%] h-5 w-8 opacity-60" />

        {slotsFor('tree', trees.length).map((slot, index) => (
          <GardenPlantMark
            key={trees[index].id}
            plant={trees[index]}
            slot={slot}
            delay={`${index * 0.35}s`}
            colour={FLOWER_COLOURS[index % FLOWER_COLOURS.length]}
          />
        ))}
        {slotsFor('bush', bushes.length).map((slot, index) => (
          <GardenPlantMark
            key={bushes[index].id}
            plant={bushes[index]}
            slot={slot}
            delay={`${index * 0.28}s`}
            colour={FLOWER_COLOURS[index % FLOWER_COLOURS.length]}
          />
        ))}
        {slotsFor('flower', flowers.length).map((slot, index) => (
          <GardenPlantMark
            key={flowers[index].id}
            plant={flowers[index]}
            slot={slot}
            delay={`${index * 0.18}s`}
            colour={FLOWER_COLOURS[index % FLOWER_COLOURS.length]}
          />
        ))}

        <div className="absolute left-1/2 top-[56%] z-20 -translate-x-1/2 -translate-y-1/2">
          <ActivePlot active={scene.active} lifetimeSeeds={lifetimeSeeds} />
        </div>

        <p className="absolute left-3 top-3 z-20 rounded-md border border-amber-800/40 bg-amber-100/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-950 shadow-sm">
          Seed Patch
        </p>
      </div>
    </figure>
  );
}

export function ActivePlot({
  active,
  lifetimeSeeds,
}: {
  active: ActivePatchView;
  lifetimeSeeds: number;
}) {
  const ring = `conic-gradient(#22c55e ${active.percent}%, #d6d3d1 ${active.percent}% 100%)`;
  const nextKind = (['flower', 'bush', 'tree'].includes(active.id)
    ? active.id
    : 'flower') as GardenPlantKind;
  const remaining = Math.max(0, active.capacity - active.filled);

  return (
    <div className="flex flex-col items-center">
      <div className="mb-2 flex flex-col items-center">
        <div className="rounded-md border-2 border-amber-800 bg-amber-100 px-4 py-1 text-center shadow-md">
          <span className="block text-3xl font-semibold tabular-nums leading-none text-amber-950 sm:text-4xl">
            {lifetimeSeeds}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-900/80">
            seeds
          </span>
        </div>
        <span className="h-5 w-1.5 bg-amber-900" aria-hidden />
      </div>
      <div className="relative h-52 w-52 sm:h-64 sm:w-64">
        <div
          className="absolute inset-0 rounded-full shadow-[0_16px_36px_rgba(28,25,23,0.32)]"
          style={{ background: ring }}
        />
        <div
          className="absolute inset-[11px] flex flex-col items-center justify-end overflow-hidden rounded-full pb-7 sm:inset-[13px] sm:pb-9"
          style={{
            background:
              'radial-gradient(circle at 50% 38%, #d6b07c 0%, #a16207 48%, #78350f 100%)',
          }}
        >
          <GrowingPlotPlant percent={active.percent} kind={nextKind} />
        </div>
      </div>
      <p className="mt-2 max-w-[16rem] text-center text-xs font-medium text-emerald-950/90">
        {active.percent >= 100
          ? 'Ready to harvest into the garden'
          : remaining === 10
            ? 'Sow seeds to grow this plot'
            : `${remaining} more to harvest`}
      </p>
    </div>
  );
}

export function ActivePatchBed({
  active,
  lifetimeSeeds,
}: {
  active: ActivePatchView;
  lifetimeSeeds: number;
}) {
  return <ActivePlot active={active} lifetimeSeeds={lifetimeSeeds} />;
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
