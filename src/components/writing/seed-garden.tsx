import { GROWTH_STAGES } from '@/lib/rewards';

type StageId = (typeof GROWTH_STAGES)[number]['id'];

function Soil({ wide = false }: { wide?: boolean }) {
  const w = wide ? 280 : 72;
  const x = wide ? 20 : 4;
  return (
    <>
      <ellipse cx={wide ? 160 : 40} cy={wide ? 168 : 70} rx={w / 2} ry={wide ? 18 : 9} fill="#a8b89a" />
      <ellipse cx={wide ? 160 : 40} cy={wide ? 174 : 73} rx={w / 2 - 4} ry={wide ? 14 : 7} fill="#6b5344" />
      <ellipse cx={wide ? 160 : 40} cy={wide ? 178 : 75} rx={w / 2 - 10} ry={wide ? 10 : 5} fill="#4a372c" />
      <circle cx={x + 18} cy={wide ? 176 : 74} r={wide ? 2 : 1} fill="#8b7355" />
      <circle cx={x + 36} cy={wide ? 180 : 76} r={wide ? 1.5 : 1} fill="#7a6248" />
    </>
  );
}

function Plant({ stage, large }: { stage: StageId; large?: boolean }) {
  const s = large ? 2.2 : 1;
  const ox = large ? 160 : 40;
  const oy = large ? 168 : 70;

  return (
    <g transform={`translate(${ox} ${oy}) scale(${s})`}>
      {stage === 'sprout' ? (
        <>
          <ellipse cx="-4" cy="2" rx="5" ry="3" fill="#c4a574" transform="rotate(-20)" />
          <ellipse cx="5" cy="3" rx="4.5" ry="2.6" fill="#a9844f" transform="rotate(18)" />
          <path
            d="M0 1 C -1 -10, 6 -16, 3 -22"
            fill="none"
            stroke="#6f9b5c"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <ellipse cx="5" cy="-23" rx="3.2" ry="2" fill="#8fbf6e" transform="rotate(25)" />
        </>
      ) : null}

      {stage === 'first_leaves' ? (
        <>
          <path d="M0 2 V -28" stroke="#4f7d3c" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="-9" cy="-18" rx="8" ry="4.5" fill="#7dae5e" transform="rotate(-28)" />
          <ellipse cx="9" cy="-20" rx="8" ry="4.5" fill="#8fbf6e" transform="rotate(26)" />
        </>
      ) : null}

      {stage === 'seedling' ? (
        <>
          <path d="M0 2 V -36" stroke="#3f6d32" strokeWidth="2.2" strokeLinecap="round" />
          <ellipse cx="-10" cy="-14" rx="8" ry="4" fill="#6fa04e" transform="rotate(-32)" />
          <ellipse cx="10" cy="-16" rx="8" ry="4" fill="#7dae5e" transform="rotate(30)" />
          <ellipse cx="-8" cy="-28" rx="7" ry="3.6" fill="#8fbf6e" transform="rotate(-20)" />
          <ellipse cx="8" cy="-30" rx="7" ry="3.6" fill="#9dca78" transform="rotate(18)" />
        </>
      ) : null}

      {stage === 'branching' ? (
        <>
          <path d="M0 2 V -22" stroke="#3a5f2e" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M0 -18 L -14 -40" stroke="#3a5f2e" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M0 -16 L 15 -38" stroke="#3a5f2e" strokeWidth="1.8" strokeLinecap="round" />
          <ellipse cx="-18" cy="-42" rx="7" ry="3.5" fill="#6fa04e" transform="rotate(-40)" />
          <ellipse cx="-10" cy="-36" rx="6" ry="3" fill="#8fbf6e" transform="rotate(-10)" />
          <ellipse cx="18" cy="-40" rx="7" ry="3.5" fill="#7dae5e" transform="rotate(36)" />
          <ellipse cx="10" cy="-32" rx="6" ry="3" fill="#9dca78" transform="rotate(12)" />
          <ellipse cx="-8" cy="-12" rx="6" ry="3" fill="#6fa04e" transform="rotate(-50)" />
          <ellipse cx="8" cy="-10" rx="6" ry="3" fill="#7dae5e" transform="rotate(48)" />
        </>
      ) : null}

      {stage === 'in_flower' || stage === 'harvest' ? (
        <>
          <path d="M0 2 V -24" stroke="#35582b" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M0 -20 L -16 -42" stroke="#35582b" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M0 -18 L 16 -40" stroke="#35582b" strokeWidth="1.8" strokeLinecap="round" />
          <ellipse cx="-18" cy="-44" rx="7" ry="3.4" fill="#5f9344" transform="rotate(-38)" />
          <ellipse cx="18" cy="-42" rx="7" ry="3.4" fill="#6fa04e" transform="rotate(34)" />
          <ellipse cx="-8" cy="-14" rx="6.5" ry="3" fill="#7dae5e" transform="rotate(-48)" />
          <ellipse cx="9" cy="-12" rx="6.5" ry="3" fill="#8fbf6e" transform="rotate(46)" />
          <circle cx="-16" cy="-48" r="3.4" fill="#f3e2a8" />
          <circle cx="-16" cy="-48" r="1.4" fill="#d4a017" />
          <circle cx="16" cy="-46" r="3.4" fill="#f7e6b4" />
          <circle cx="16" cy="-46" r="1.4" fill="#d4a017" />
          {stage === 'harvest' ? (
            <>
              <circle cx="0" cy="-36" r="3.2" fill="#e8c56b" />
              <circle cx="0" cy="-36" r="1.3" fill="#b8860b" />
              <ellipse cx="22" cy="4" rx="9" ry="5" fill="#c4a574" />
              <ellipse cx="22" cy="2" rx="7" ry="3.2" fill="#e8d5a3" />
              <circle cx="19" cy="1" r="1.3" fill="#d4a017" />
              <circle cx="24" cy="2" r="1.1" fill="#c4941a" />
              <circle cx="22" cy="3.4" r="1" fill="#e8c56b" />
            </>
          ) : null}
        </>
      ) : null}
    </g>
  );
}

export function SeedGardenScene({
  stageId,
  className,
}: {
  stageId: string;
  className?: string;
}) {
  const stage = (GROWTH_STAGES.some((row) => row.id === stageId)
    ? stageId
    : 'sprout') as StageId;

  return (
    <svg
      viewBox="0 0 320 200"
      className={className}
      role="img"
      aria-label={`${GROWTH_STAGES.find((row) => row.id === stage)?.label ?? 'Sprout'} garden`}
    >
      <defs>
        <linearGradient id="patchSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8f6ef" />
          <stop offset="55%" stopColor="#e7f3dc" />
          <stop offset="100%" stopColor="#d5e8c4" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" rx="16" fill="url(#patchSky)" />
      <ellipse cx="54" cy="46" rx="28" ry="10" fill="#f4ecd0" opacity="0.7" />
      <Soil wide />
      <Plant stage={stage} large />
    </svg>
  );
}

export function SeedGardenPath({ currentId }: { currentId: string }) {
  const reached = GROWTH_STAGES.findIndex((row) => row.id === currentId);

  return (
    <ol className="grid grid-cols-6 gap-1.5 sm:gap-2">
      {GROWTH_STAGES.map((stage, index) => {
        const state =
          index < reached ? 'done' : index === reached ? 'now' : 'later';
        return (
          <li key={stage.id}>
            <div
              className={`overflow-hidden rounded-lg border ${
                state === 'now'
                  ? 'border-emerald-700 bg-white shadow-sm'
                  : state === 'done'
                    ? 'border-emerald-200 bg-white/90'
                    : 'border-stone-200 bg-stone-50 opacity-60'
              }`}
            >
              <svg viewBox="0 0 80 84" className="h-auto w-full" aria-hidden>
                <rect width="80" height="84" fill={state === 'later' ? '#f5f5f4' : '#eef6e6'} />
                <Soil />
                {state !== 'later' ? <Plant stage={stage.id as StageId} /> : null}
              </svg>
            </div>
            <p
              className={`mt-1 text-center text-[10px] leading-tight sm:text-xs ${
                state === 'now'
                  ? 'font-semibold text-emerald-900'
                  : 'text-stone-500'
              }`}
            >
              {stage.label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
