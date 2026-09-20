import type { MathStimulus } from '@/lib/early-math';
import {
  ColorBead,
  Counter,
  PictureTray,
  ToyIcon,
  TrainEngine,
  counterColor,
} from '@/components/maths/toys';

function positions(count: number, seed: number) {
  const spots: { x: number; y: number }[] = [];
  let n = seed;
  for (let i = 0; i < count; i += 1) {
    n = (n * 1103515245 + 12345) & 0x7fffffff;
    spots.push({ x: 10 + (n % 74), y: 12 + ((n / 74) % 64) });
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
    <div className="grid h-32 w-32 grid-cols-3 grid-rows-3 place-items-center rounded-[1.4rem] bg-[#C49B7A] p-3 shadow-[3px_4px_0_rgba(61,53,46,0.18)]">
      {cells.map((cell) => (
        <span key={cell} className={`h-6 w-6 rounded-full bg-white shadow-sm ${slot[cell]}`} />
      ))}
    </div>
  );
}

function TenFrame({ filled, frames = 1 }: { filled: number; frames?: 1 | 2 }) {
  const cells = frames * 10;
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {Array.from({ length: frames }, (_, frame) => (
        <div
          key={frame}
          className="grid grid-cols-5 gap-1.5 rounded-2xl border-[3px] border-[#3D352E] bg-white p-2 shadow-[3px_4px_0_rgba(61,53,46,0.12)]"
        >
          {Array.from({ length: 10 }, (_, i) => {
            const index = frame * 10 + i;
            return (
              <span
                key={i}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E4D8C4] bg-[#FFF8E8] sm:h-11 sm:w-11"
              >
                {index < Math.min(filled, cells) ? <Counter color={counterColor(i)} /> : null}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Fingers({ left, right }: { left: number; right: number }) {
  const hand = (count: number, flip: boolean) => (
    <div className={`flex items-end gap-1 ${flip ? 'flex-row-reverse' : ''}`}>
      {Array.from({ length: 5 }, (_, i) => {
        const up = flip ? i >= 5 - count : i < count;
        const thumb = flip ? i === 4 : i === 0;
        return (
          <span
            key={i}
            className={`rounded-full ${
              up ? 'bg-[#E8A07A]' : 'bg-[#F0D8C6]'
            } ${thumb ? 'h-16 w-5' : 'h-20 w-5'}`}
          />
        );
      })}
    </div>
  );
  return (
    <div className="flex items-end justify-center gap-8">
      {hand(left, false)}
      {hand(right, true)}
    </div>
  );
}

function ClockFace({ hour, minute }: { hour: number; minute: 0 | 30 }) {
  const hourAngle = (hour % 12) * 30 + (minute === 30 ? 15 : 0) - 90;
  const minuteAngle = minute * 6 - 90;
  return (
    <svg viewBox="0 0 100 100" className="mx-auto h-40 w-40" aria-hidden>
      <circle cx="50" cy="50" r="46" fill="#FFF8E8" stroke="#C49B7A" strokeWidth="5" />
      {Array.from({ length: 12 }, (_, i) => {
        const angle = ((i + 1) / 12) * Math.PI * 2 - Math.PI / 2;
        return (
          <text
            key={i}
            x={50 + Math.cos(angle) * 32}
            y={50 + Math.sin(angle) * 32 + 4}
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill="#3D352E"
          >
            {i + 1}
          </text>
        );
      })}
      <line
        x1="50"
        y1="50"
        x2={50 + Math.cos((hourAngle * Math.PI) / 180) * 20}
        y2={50 + Math.sin((hourAngle * Math.PI) / 180) * 20}
        stroke="#2D5A4A"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <line
        x1="50"
        y1="50"
        x2={50 + Math.cos((minuteAngle * Math.PI) / 180) * 30}
        y2={50 + Math.sin((minuteAngle * Math.PI) / 180) * 30}
        stroke="#C45C26"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="50" cy="50" r="3.5" fill="#3D352E" />
    </svg>
  );
}

export function MathsStimulus({ stimulus }: { stimulus?: MathStimulus | Record<string, never> }) {
  if (!stimulus || !('type' in stimulus) || !stimulus.type) return null;

  if (stimulus.type === 'dots') {
    if (stimulus.layout === 'dice') {
      return (
        <div className="flex justify-center gap-4">
          <DiceFace count={Math.min(6, stimulus.count)} />
          {stimulus.second ? <DiceFace count={Math.min(6, stimulus.second)} /> : null}
        </div>
      );
    }
    if (stimulus.layout === 'line') {
      return (
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: stimulus.count }, (_, i) => (
            <Counter key={i} color={counterColor(i)} />
          ))}
        </div>
      );
    }
    if (stimulus.layout === 'pairs') {
      return (
        <div className="flex flex-wrap justify-center gap-5">
          {Array.from({ length: stimulus.count / 2 }, (_, i) => (
            <div key={i} className="flex gap-1.5 rounded-2xl bg-[#FFF1D6] p-2">
              <Counter color="red" />
              <Counter color="gold" />
            </div>
          ))}
        </div>
      );
    }
    if (stimulus.layout === 'domino') {
      const half = stimulus.count / 2;
      return (
        <div className="mx-auto flex overflow-hidden rounded-[1.4rem] border-[3px] border-[#3D352E] bg-white shadow-[3px_4px_0_rgba(61,53,46,0.12)]">
          <div className="grid grid-cols-2 gap-2 p-4">
            {Array.from({ length: half }, (_, i) => (
              <Counter key={i} color="red" />
            ))}
          </div>
          <div className="w-1 bg-[#3D352E]" />
          <div className="grid grid-cols-2 gap-2 p-4">
            {Array.from({ length: half }, (_, i) => (
              <Counter key={`b-${i}`} color="gold" />
            ))}
          </div>
        </div>
      );
    }
    const spots = positions(stimulus.count, stimulus.seed ?? 3);
    return (
      <div className="relative mx-auto h-40 w-full max-w-sm rounded-[1.6rem] border-2 border-[#E8D9B0] bg-[#FFF1D6]">
        {spots.map((spot, i) => (
          <span key={i} className="absolute" style={{ left: `${spot.x}%`, top: `${spot.y}%` }}>
            <Counter color={counterColor(i)} />
          </span>
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
      <div className="flex items-end justify-center gap-4 text-4xl font-semibold tracking-widest text-[#3D352E]">
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
      <div className="-mx-1 flex flex-nowrap items-end justify-center gap-1 overflow-x-auto px-1 pb-1">
        <TrainEngine />
        {nums.map((n, i) => {
          const missing = stimulus.missing?.includes(n);
          const highlight = stimulus.highlight === n;
          return (
            <span
              key={n}
              className={`flex h-12 min-w-12 shrink-0 items-center justify-center rounded-2xl border-[3px] text-lg font-bold ${
                missing
                  ? 'border-dashed border-terracotta bg-white text-terracotta'
                  : highlight
                    ? 'border-[#2D5A4A] bg-[#2D5A4A] text-white'
                    : i % 2 === 0
                      ? 'border-[#E8D9B0] bg-[#FFF1D6] text-warm-ink'
                      : 'border-[#D7E6DA] bg-[#EEF6F0] text-warm-ink'
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
      <div className="relative mx-4 mt-8 mb-6 h-10">
        <div className="absolute top-4 right-0 left-0 h-2 rounded-full bg-[#E8D9B0]" />
        <span className="absolute top-7 left-0 text-sm font-semibold">{stimulus.min}</span>
        <span className="absolute top-7 right-0 text-sm font-semibold">{stimulus.max}</span>
        <span
          className="absolute -top-1 block h-7 w-7 rounded-full bg-terracotta shadow-sm"
          style={{ left: `calc(${pct}% - 14px)` }}
        />
      </div>
    );
  }
  if (stimulus.type === 'partWhole') {
    const cell = (value: number | null, tone: string) => (
      <div
        className={`flex h-20 w-20 items-center justify-center rounded-full border-[3px] text-3xl font-bold ${tone}`}
      >
        {value ?? '?'}
      </div>
    );
    return (
      <div className="flex flex-col items-center gap-3">
        {cell(stimulus.whole, 'border-[#2D5A4A] bg-[#EEF6F0] text-brand-dark')}
        <div className="flex gap-4">
          {cell(stimulus.left, 'border-terracotta bg-[#FFF1D6] text-warm-ink')}
          {cell(stimulus.right, 'border-[#C49B7A] bg-white text-warm-ink')}
        </div>
      </div>
    );
  }
  if (stimulus.type === 'groups') {
    return (
      <div className="flex flex-wrap justify-center gap-6">
        {stimulus.groups.map((group) => (
          <div key={group.label} className="rounded-[1.4rem] bg-[#FFF1D6] px-4 py-3">
            <p className="mb-2 text-center text-sm font-medium text-warm-ink">{group.label}</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {Array.from({ length: group.count }, (_, i) => (
                <ToyIcon key={i} name={group.icon} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (stimulus.type === 'pattern') {
    return (
      <div className="flex flex-wrap items-center justify-center gap-2">
        {stimulus.items.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className={`flex h-14 min-w-14 items-center justify-center rounded-2xl px-3 ${
              i === stimulus.blankIndex
                ? 'border-[3px] border-dashed border-terracotta bg-white text-2xl font-bold text-terracotta'
                : 'bg-[#FFF1D6]'
            }`}
          >
            {i === stimulus.blankIndex ? '?' : <ColorBead name={item} />}
          </span>
        ))}
      </div>
    );
  }
  if (stimulus.type === 'shapes') {
    return (
      <div className="flex flex-wrap items-end justify-center gap-6">
        {stimulus.items.map((item, i) => (
          <div key={i} className="text-center">
            <Shape kind={item.kind} />
            {item.label ? <p className="mt-2 text-sm font-medium text-warm-ink">{item.label}</p> : null}
          </div>
        ))}
      </div>
    );
  }
  if (stimulus.type === 'position') {
    if (stimulus.place === 'bench') {
      return (
        <div className="relative mx-auto h-36 w-64">
          <div className="absolute bottom-12 left-6 right-6 h-5 rounded-lg bg-[#C49B7A]" />
          <div className="absolute bottom-4 left-10">
            <ToyIcon name="bag" />
          </div>
          <p className="absolute right-6 bottom-16 text-xs font-medium text-warm-muted">bench</p>
        </div>
      );
    }
    return (
      <div className="mx-auto flex max-w-xs items-end justify-between gap-4 rounded-[1.6rem] bg-[#EEF6F0] p-5">
        <div className="text-center">
          <ToyIcon name="child" />
          <p className="mt-1 text-sm font-medium">Mia</p>
        </div>
        <div className="h-24 w-12 rounded-t-2xl bg-brand" />
        <div className="text-center">
          <ToyIcon name="child" />
          <p className="mt-1 text-sm font-medium">Sam</p>
        </div>
      </div>
    );
  }
  if (stimulus.type === 'compareBars') {
    const max = Math.max(stimulus.a, stimulus.b, 1);
    return (
      <div className="space-y-4">
        {[
          { n: stimulus.a, label: stimulus.aLabel, color: 'red' as const },
          { n: stimulus.b, label: stimulus.bLabel, color: 'gold' as const },
        ].map((row) => (
          <div key={row.label}>
            <p className="mb-1 text-sm font-medium text-warm-ink">{row.label}</p>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: row.n }, (_, i) => (
                <Counter key={i} color={row.color} />
              ))}
            </div>
          </div>
        ))}
        <p className="sr-only">
          {stimulus.aLabel} {stimulus.a}, {stimulus.bLabel} {stimulus.b}, max {max}
        </p>
      </div>
    );
  }
  if (stimulus.type === 'pictureGraph') {
    return (
      <div>
        <p className="mb-3 text-center text-lg font-semibold text-warm-ink">{stimulus.title}</p>
        <div className="space-y-3">
          {stimulus.rows.map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="w-24 text-sm font-medium">{row.label}</span>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: row.count }, (_, i) => (
                  <ToyIcon key={i} name={row.icon} />
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
      <div className="flex flex-wrap items-end justify-center gap-6">
        <div className="text-center">
          <p className="mb-2 text-sm font-medium text-warm-ink">Tens</p>
          <div className="flex gap-1.5">
            {Array.from({ length: stimulus.tens }, (_, i) => (
              <span key={i} className="h-24 w-6 rounded-md bg-[#2D5A4A] shadow-sm" />
            ))}
          </div>
        </div>
        <div className="text-center">
          <p className="mb-2 text-sm font-medium text-warm-ink">Ones</p>
          <div className="flex max-w-52 flex-wrap justify-center gap-1.5">
            {Array.from({ length: stimulus.ones }, (_, i) => (
              <span key={i} className="h-6 w-6 rounded-md bg-terracotta shadow-sm" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (stimulus.type === 'sharing') {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: stimulus.total }, (_, i) => (
            <Counter key={i} color={counterColor(i % 10)} />
          ))}
        </div>
        <div className="flex justify-center gap-4">
          {Array.from({ length: stimulus.people }, (_, i) => (
            <span
              key={i}
              className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-dashed border-[#C49B7A] bg-white"
            >
              <ToyIcon name="child" />
            </span>
          ))}
        </div>
      </div>
    );
  }
  if (stimulus.type === 'matchNumber') {
    return (
      <div className="flex justify-center">
        <span className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-[#2D5A4A] text-6xl font-bold text-white shadow-[3px_4px_0_rgba(61,53,46,0.16)]">
          {stimulus.target}
        </span>
      </div>
    );
  }
  if (stimulus.type === 'howManyMore') {
    return (
      <div className="space-y-4">
        {[stimulus.left, stimulus.right].map((row) => (
          <div key={row.label} className="rounded-[1.4rem] bg-[#FFF1D6] px-4 py-3">
            <p className="mb-2 text-center text-sm font-medium text-warm-ink">{row.label}</p>
            <PictureTray icon={row.icon} count={row.count} color={row.color} />
          </div>
        ))}
      </div>
    );
  }
  if (stimulus.type === 'oddOneOut' || stimulus.type === 'tapPictures') {
    return (
      <div className="flex flex-wrap justify-center gap-3">
        {stimulus.items.map((item, i) => (
          <div key={i} className="rounded-[1.4rem] bg-[#FFF1D6] px-4 py-3">
            <PictureTray icon={item.icon} count={item.count ?? 1} color={item.color} />
          </div>
        ))}
      </div>
    );
  }
  if (stimulus.type === 'giantNumber') {
    return (
      <div className="flex justify-center">
        <span className="flex min-h-28 min-w-28 items-center justify-center rounded-[2rem] bg-[#2D5A4A] px-5 text-5xl font-bold text-white shadow-[3px_4px_0_rgba(61,53,46,0.16)] sm:text-6xl">
          {stimulus.value}
        </span>
      </div>
    );
  }
  if (stimulus.type === 'lineup') {
    return (
      <div className="flex flex-wrap items-end justify-center gap-4">
        {stimulus.names.map((name, i) => (
          <div key={name} className="text-center">
            <ToyIcon name="child" />
            <p className="mt-1 text-sm font-bold text-warm-ink">{name}</p>
            <p className="text-xs text-warm-muted">{i + 1}</p>
          </div>
        ))}
      </div>
    );
  }
  if (stimulus.type === 'balance') {
    const leftDown = stimulus.down === 'left';
    return (
      <div className="mx-auto max-w-sm">
        <div className="flex items-end justify-between gap-6">
          <div className={`flex-1 rounded-[1.4rem] px-3 py-4 text-center ${leftDown ? 'bg-[#FFF1D6] pt-10' : 'bg-[#EEF6F0]'}`}>
            <ToyIcon name={stimulus.left} />
          </div>
          <div className={`flex-1 rounded-[1.4rem] px-3 py-4 text-center ${leftDown ? 'bg-[#EEF6F0]' : 'bg-[#FFF1D6] pt-10'}`}>
            <ToyIcon name={stimulus.right} />
          </div>
        </div>
        <div className="mx-auto mt-2 h-2 w-40 rounded-full bg-[#C49B7A]" />
        <div className="mx-auto h-8 w-2 bg-[#C49B7A]" />
      </div>
    );
  }
  if (stimulus.type === 'jugs') {
    return (
      <div className="flex items-end justify-center gap-10">
        <div className="text-center">
          <div className="mx-auto h-32 w-10 rounded-b-2xl border-[3px] border-[#4A86B8] bg-[#D7E6DA]" />
          <p className="mt-2 text-sm font-medium">Tall · {stimulus.tallCups} cups</p>
        </div>
        <div className="text-center">
          <div className="mx-auto h-20 w-24 rounded-b-2xl border-[3px] border-terracotta bg-[#FFF1D6]" />
          <p className="mt-2 text-sm font-medium">Wide · {stimulus.wideCups} cups</p>
        </div>
      </div>
    );
  }
  if (stimulus.type === 'dayStrip') {
    const days = stimulus.days ?? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return (
      <div className="flex flex-wrap justify-center gap-1.5">
        {days.map((day) => (
          <span
            key={day}
            className={`flex h-12 min-w-12 items-center justify-center rounded-2xl border-[3px] px-2 text-sm font-bold ${
              day === stimulus.highlight
                ? 'border-[#2D5A4A] bg-[#2D5A4A] text-white'
                : 'border-[#E8D9B0] bg-[#FFF1D6] text-warm-ink'
            }`}
          >
            {day}
          </span>
        ))}
      </div>
    );
  }
  if (stimulus.type === 'coins') {
    return (
      <div className="flex flex-wrap justify-center gap-3">
        {stimulus.coins.flatMap((coin) =>
          Array.from({ length: coin.count }, (_, i) => (
            <span
              key={`${coin.value}-${i}`}
              className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-amber-700 bg-gradient-to-b from-amber-200 to-amber-400 text-sm font-bold text-amber-950 shadow-sm"
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
    return <span className="block h-20 w-20 rounded-full bg-[#E15A4A] shadow-sm" />;
  }
  if (kind === 'square') {
    return <span className="block h-20 w-20 rounded-lg bg-[#E8B84A] shadow-sm" />;
  }
  if (kind === 'rectangle') {
    return <span className="block h-14 w-24 rounded-lg bg-[#4A7A64] shadow-sm" />;
  }
  return (
    <span
      className="block h-0 w-0 border-x-[40px] border-b-[72px] border-x-transparent border-b-[#4A86B8]"
      aria-hidden
    />
  );
}
