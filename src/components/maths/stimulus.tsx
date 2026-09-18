import type { MathStimulus } from '@/lib/early-math';

const DOT = 'h-4 w-4 rounded-full bg-terracotta shadow-sm';

function positions(count: number, seed: number) {
  const spots: { x: number; y: number }[] = [];
  let n = seed;
  for (let i = 0; i < count; i += 1) {
    n = (n * 1103515245 + 12345) & 0x7fffffff;
    spots.push({ x: 12 + (n % 76), y: 12 + ((n / 76) % 66) });
  }
  return spots;
}

function DiceFace({ count }: { count: number }) {
  const map: Record<number, string[]> = {
    1: ['center'],
    2: ['tl', 'br'],
    3: ['tl', 'center', 'br'],
    4: ['tl', 'tr', 'bl', 'br'],
    5: ['tl', 'tr', 'center', 'bl', 'br'],
    6: ['tl', 'tr', 'ml', 'mr', 'bl', 'br'],
  };
  const cells = map[count] ?? map[1];
  const slot: Record<string, string> = {
    tl: 'col-start-1 row-start-1',
    tr: 'col-start-3 row-start-1',
    ml: 'col-start-1 row-start-2',
    mr: 'col-start-3 row-start-2',
    bl: 'col-start-1 row-start-3',
    br: 'col-start-3 row-start-3',
    center: 'col-start-2 row-start-2',
  };
  return (
    <div className="grid h-28 w-28 grid-cols-3 grid-rows-3 place-items-center rounded-2xl border-2 border-warm-ink bg-warm-card p-2 shadow-card">
      {cells.map((cell) => (
        <span key={cell} className={`${DOT} ${slot[cell]}`} />
      ))}
    </div>
  );
}

function TenFrame({ filled, frames = 1 }: { filled: number; frames?: 1 | 2 }) {
  const cells = frames * 10;
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: frames }, (_, frame) => (
        <div
          key={frame}
          className="grid grid-cols-5 gap-1 rounded-lg border-2 border-warm-ink bg-warm-card p-2"
        >
          {Array.from({ length: 10 }, (_, i) => {
            const index = frame * 10 + i;
            return (
              <span
                key={i}
                className={`flex h-8 w-8 items-center justify-center rounded border border-warm-border ${
                  index < Math.min(filled, cells) ? 'bg-[#F5EEE6]' : 'bg-white'
                }`}
              >
                {index < filled ? <span className={DOT} /> : null}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Fingers({ left, right }: { left: number; right: number }) {
  const hand = (count: number, label: string) => (
    <div className="text-center">
      <div className="flex gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={`h-16 w-4 rounded-full ${i < count ? 'bg-terracotta' : 'bg-[#E8DFD4]'}`}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-warm-subtle">{label}</p>
    </div>
  );
  return (
    <div className="flex items-end gap-6">
      {hand(left, 'Left')}
      {hand(right, 'Right')}
    </div>
  );
}

function ClockFace({ hour, minute }: { hour: number; minute: 0 | 30 }) {
  const hourAngle = (hour % 12) * 30 + (minute === 30 ? 15 : 0) - 90;
  const minuteAngle = minute * 6 - 90;
  return (
    <svg viewBox="0 0 100 100" className="h-36 w-36">
      <circle cx="50" cy="50" r="46" fill="#fff" stroke="#2D5A4A" strokeWidth="3" />
      {Array.from({ length: 12 }, (_, i) => {
        const angle = ((i + 1) / 12) * Math.PI * 2 - Math.PI / 2;
        return (
          <text
            key={i}
            x={50 + Math.cos(angle) * 34}
            y={50 + Math.sin(angle) * 34 + 4}
            textAnchor="middle"
            fontSize="8"
            fill="#1E3F33"
          >
            {i + 1}
          </text>
        );
      })}
      <line
        x1="50"
        y1="50"
        x2={50 + Math.cos((hourAngle * Math.PI) / 180) * 22}
        y2={50 + Math.sin((hourAngle * Math.PI) / 180) * 22}
        stroke="#1E3F33"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="50"
        y1="50"
        x2={50 + Math.cos((minuteAngle * Math.PI) / 180) * 32}
        y2={50 + Math.sin((minuteAngle * Math.PI) / 180) * 32}
        stroke="#C45C26"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="50" cy="50" r="3" fill="#1E3F33" />
    </svg>
  );
}

function iconFor(name: string) {
  const map: Record<string, string> = {
    child: '🙂',
    cone: '▲',
    sand: '🪣',
    block: '🟧',
    bike: '🚲',
  };
  return map[name] ?? '●';
}

export function MathsStimulus({ stimulus }: { stimulus?: MathStimulus | Record<string, never> }) {
  if (!stimulus || !('type' in stimulus) || !stimulus.type) return null;

  if (stimulus.type === 'dots') {
    if (stimulus.layout === 'dice') {
      return (
        <div className="flex gap-3">
          <DiceFace count={Math.min(6, stimulus.count)} />
          {stimulus.second ? <DiceFace count={Math.min(6, stimulus.second)} /> : null}
        </div>
      );
    }
    if (stimulus.layout === 'line') {
      return (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: stimulus.count }, (_, i) => (
            <span key={i} className={DOT} />
          ))}
        </div>
      );
    }
    if (stimulus.layout === 'pairs') {
      return (
        <div className="flex gap-6">
          {Array.from({ length: stimulus.count / 2 }, (_, i) => (
            <div key={i} className="flex gap-1">
              <span className={DOT} />
              <span className={DOT} />
            </div>
          ))}
        </div>
      );
    }
    if (stimulus.layout === 'domino') {
      const half = stimulus.count / 2;
      return (
        <div className="flex overflow-hidden rounded-xl border-2 border-warm-ink bg-warm-card">
          <div className="grid grid-cols-2 gap-2 p-3">
            {Array.from({ length: half }, (_, i) => (
              <span key={i} className={DOT} />
            ))}
          </div>
          <div className="w-0.5 bg-warm-ink" />
          <div className="grid grid-cols-2 gap-2 p-3">
            {Array.from({ length: half }, (_, i) => (
              <span key={`b-${i}`} className={DOT} />
            ))}
          </div>
        </div>
      );
    }
    const spots = positions(stimulus.count, stimulus.seed ?? 3);
    return (
      <div className="relative h-36 w-56 rounded-xl border border-warm-border bg-[#F5EEE6]">
        {spots.map((spot, i) => (
          <span
            key={i}
            className={`absolute ${DOT}`}
            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
          />
        ))}
      </div>
    );
  }

  if (stimulus.type === 'tenFrame') {
    return <TenFrame filled={stimulus.filled} frames={stimulus.frames ?? 1} />;
  }
  if (stimulus.type === 'fingers') {
    return <Fingers left={stimulus.left} right={stimulus.right} />;
  }
  if (stimulus.type === 'tally') {
    const fives = Math.floor(stimulus.count / 5);
    const rest = stimulus.count % 5;
    return (
      <div className="flex items-end gap-4 text-3xl font-semibold tracking-widest text-warm-ink">
        {Array.from({ length: fives }, (_, i) => (
          <span key={i} className="relative px-1">
            <span>||||</span>
            <span className="absolute inset-0 flex items-center justify-center text-terracotta">/</span>
          </span>
        ))}
        {rest ? <span>{'|'.repeat(rest)}</span> : null}
      </div>
    );
  }
  if (stimulus.type === 'numberTrack') {
    const nums = [];
    for (let n = stimulus.min; n <= stimulus.max; n += 1) nums.push(n);
    return (
      <div className="flex flex-wrap gap-1">
        {nums.map((n) => {
          const missing = stimulus.missing?.includes(n);
          const highlight = stimulus.highlight === n;
          return (
            <span
              key={n}
              className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-semibold ${
                missing
                  ? 'border-dashed border-terracotta bg-white text-terracotta'
                  : highlight
                    ? 'border-brand bg-brand text-white'
                    : 'border-warm-border bg-warm-card text-warm-ink'
              }`}
            >
              {missing ? '?' : n}
            </span>
          );
        })}
      </div>
    );
  }
  if (stimulus.type === 'numberLine') {
    const pct = ((stimulus.target - stimulus.min) / (stimulus.max - stimulus.min)) * 100;
    return (
      <div className="relative mx-2 mt-6 mb-4 h-8">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-warm-ink" />
        <span className="absolute top-6 left-0 text-xs">{stimulus.min}</span>
        <span className="absolute top-6 right-0 text-xs">{stimulus.max}</span>
        <span
          className="absolute -top-1 h-0 w-0 border-x-8 border-t-[14px] border-x-transparent border-t-terracotta"
          style={{ left: `calc(${pct}% - 8px)` }}
        />
      </div>
    );
  }
  if (stimulus.type === 'partWhole') {
    const cell = (value: number | null, label: string) => (
      <div className="flex h-16 w-24 flex-col items-center justify-center rounded-lg border border-warm-border bg-warm-card">
        <span className="text-xl font-semibold">{value ?? '?'}</span>
        <span className="text-[10px] uppercase tracking-wide text-warm-subtle">{label}</span>
      </div>
    );
    return (
      <div className="flex flex-col items-center gap-2">
        {cell(stimulus.whole, 'whole')}
        <div className="flex gap-3">
          {cell(stimulus.left, 'part')}
          {cell(stimulus.right, 'part')}
        </div>
      </div>
    );
  }
  if (stimulus.type === 'groups') {
    return (
      <div className="flex flex-wrap gap-6">
        {stimulus.groups.map((group) => (
          <div key={group.label}>
            <p className="mb-1 text-xs text-warm-subtle">{group.label}</p>
            <div className="flex flex-wrap gap-1 text-lg">
              {Array.from({ length: group.count }, (_, i) => (
                <span key={i}>{iconFor(group.icon)}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (stimulus.type === 'pattern') {
    return (
      <div className="flex flex-wrap gap-2">
        {stimulus.items.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className={`rounded-full px-3 py-2 text-sm font-medium ${
              i === stimulus.blankIndex
                ? 'border border-dashed border-terracotta text-terracotta'
                : 'bg-[#F5EEE6] text-warm-ink'
            }`}
          >
            {item}
          </span>
        ))}
      </div>
    );
  }
  if (stimulus.type === 'shapes') {
    return (
      <div className="flex flex-wrap items-end gap-6">
        {stimulus.items.map((item, i) => (
          <div key={i} className="text-center">
            <Shape kind={item.kind} />
            {item.label ? <p className="mt-1 text-xs text-warm-subtle">{item.label}</p> : null}
          </div>
        ))}
      </div>
    );
  }
  if (stimulus.type === 'position') {
    if (stimulus.place === 'bench') {
      return (
        <div className="relative h-32 w-56">
          <div className="absolute bottom-10 left-6 right-6 h-4 rounded bg-[#8B6914]" />
          <div className="absolute bottom-2 left-10 h-10 w-8 rounded bg-terracotta" />
          <p className="absolute bottom-12 right-4 text-xs text-warm-subtle">bench</p>
          <p className="absolute bottom-0 left-8 text-xs text-warm-subtle">bag</p>
        </div>
      );
    }
    return (
      <div className="flex items-end justify-between gap-4 rounded-xl bg-[#EEF6F0] p-4">
        <div className="text-center">
          <p className="text-2xl">🙂</p>
          <p className="text-xs">Mia</p>
        </div>
        <div className="h-20 w-10 rounded-t-lg bg-brand" />
        <div className="text-center">
          <p className="text-2xl">🙂</p>
          <p className="text-xs">Sam</p>
        </div>
      </div>
    );
  }
  if (stimulus.type === 'compareBars') {
    const max = Math.max(stimulus.a, stimulus.b, 1);
    return (
      <div className="space-y-3">
        {[
          { n: stimulus.a, label: stimulus.aLabel },
          { n: stimulus.b, label: stimulus.bLabel },
        ].map((row) => (
          <div key={row.label}>
            <p className="text-xs text-warm-subtle">{row.label}</p>
            <div
              className="h-7 rounded bg-terracotta"
              style={{ width: `${Math.max(12, (row.n / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
    );
  }
  if (stimulus.type === 'pictureGraph') {
    return (
      <div>
        <p className="mb-2 text-sm font-medium">{stimulus.title}</p>
        <div className="space-y-2">
          {stimulus.rows.map((row) => (
            <div key={row.label} className="flex items-center gap-2">
              <span className="w-20 text-sm">{row.label}</span>
              <div className="flex gap-1 text-lg">
                {Array.from({ length: row.count }, (_, i) => (
                  <span key={i}>{iconFor(row.icon)}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (stimulus.type === 'clock') {
    return <ClockFace hour={stimulus.hour} minute={stimulus.minute} />;
  }
  if (stimulus.type === 'baseTen') {
    return (
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <p className="mb-1 text-xs text-warm-subtle">Tens</p>
          <div className="flex gap-1">
            {Array.from({ length: stimulus.tens }, (_, i) => (
              <span key={i} className="h-20 w-4 rounded bg-brand" />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs text-warm-subtle">Ones</p>
          <div className="flex max-w-48 flex-wrap gap-1">
            {Array.from({ length: stimulus.ones }, (_, i) => (
              <span key={i} className="h-4 w-4 rounded bg-terracotta" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (stimulus.type === 'sharing') {
    return (
      <div>
        <p className="mb-2 text-sm text-warm-muted">
          {stimulus.total} to share among {stimulus.people}
        </p>
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: stimulus.total }, (_, i) => (
            <span key={i} className={DOT} />
          ))}
        </div>
      </div>
    );
  }
  if (stimulus.type === 'coins') {
    return (
      <div className="flex flex-wrap gap-3">
        {stimulus.coins.flatMap((coin) =>
          Array.from({ length: coin.count }, (_, i) => (
            <span
              key={`${coin.value}-${i}`}
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-700 bg-amber-200 text-sm font-semibold"
            >
              ${coin.value}
            </span>
          )),
        )}
      </div>
    );
  }
  return null;
}

function Shape({ kind }: { kind: string }) {
  if (kind === 'circle') {
    return <span className="block h-16 w-16 rounded-full bg-brand" />;
  }
  if (kind === 'square') {
    return <span className="block h-16 w-16 bg-terracotta" />;
  }
  if (kind === 'rectangle') {
    return <span className="block h-12 w-20 bg-[#4A7A64]" />;
  }
  return (
    <span
      className="block h-0 w-0 border-x-[32px] border-b-[56px] border-x-transparent border-b-brand"
      aria-hidden
    />
  );
}
