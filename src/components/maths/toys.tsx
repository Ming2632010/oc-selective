const COUNTER_FILL: Record<string, string> = {
  red: '#E15A4A',
  gold: '#E8B84A',
  green: '#3E8B6A',
  blue: '#4A86B8',
  terracotta: '#C45C26',
};

export function Counter({
  color = 'red',
  className,
}: {
  color?: keyof typeof COUNTER_FILL | string;
  className?: string;
}) {
  return (
    <span
      className={`inline-block h-7 w-7 rounded-full shadow-[inset_-2px_-2px_0_rgba(0,0,0,0.12),inset_2px_2px_0_rgba(255,255,255,0.35)] sm:h-8 sm:w-8 ${className ?? ''}`}
      style={{ backgroundColor: COUNTER_FILL[color] ?? color }}
      aria-hidden
    />
  );
}

export function counterColor(index: number) {
  return index < 5 ? 'red' : 'gold';
}

export function ToyIcon({ name }: { name: string }) {
  switch (name) {
    case 'child':
      return <KidIcon />;
    case 'cone':
      return <IceConeIcon />;
    case 'sand':
      return <BucketIcon />;
    case 'block':
      return <BlockIcon />;
    case 'bike':
      return <BikeIcon />;
    default:
      return <Counter color="terracotta" />;
  }
}

export function TrainEngine() {
  return (
    <svg viewBox="0 0 56 40" className="h-12 w-16" aria-hidden>
      <rect x="18" y="8" width="28" height="22" rx="4" fill="#C45C26" />
      <rect x="4" y="18" width="18" height="12" rx="3" fill="#2D5A4A" />
      <circle cx="16" cy="33" r="5" fill="#3D352E" />
      <circle cx="38" cy="33" r="5" fill="#3D352E" />
      <rect x="38" y="4" width="8" height="8" rx="2" fill="#E8B84A" />
    </svg>
  );
}

function KidIcon() {
  return (
    <svg viewBox="0 0 32 36" className="h-9 w-8" aria-hidden>
      <circle cx="16" cy="8" r="6" fill="#E8A07A" />
      <path d="M8 34c0-8 4-12 8-12s8 4 8 12" fill="#4A7A64" />
    </svg>
  );
}

function IceConeIcon() {
  return (
    <svg viewBox="0 0 28 36" className="h-9 w-7" aria-hidden>
      <circle cx="14" cy="10" r="8" fill="#E15A4A" />
      <path d="M6 14h16L14 34z" fill="#E8B84A" />
    </svg>
  );
}

function BucketIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
      <path d="M8 10h16l-2 16H10z" fill="#4A86B8" />
      <path d="M8 10c4-6 12-6 16 0" fill="none" stroke="#C49B7A" strokeWidth="2.4" />
    </svg>
  );
}

function BlockIcon() {
  return (
    <svg viewBox="0 0 28 28" className="h-8 w-8" aria-hidden>
      <rect x="3" y="3" width="22" height="22" rx="3" fill="#E8B84A" />
      <path d="M3 11h22M11 3v22" stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

function BikeIcon() {
  return (
    <svg viewBox="0 0 40 28" className="h-8 w-10" aria-hidden>
      <circle cx="8" cy="20" r="6" fill="none" stroke="#2D5A4A" strokeWidth="2.4" />
      <circle cx="30" cy="20" r="6" fill="none" stroke="#2D5A4A" strokeWidth="2.4" />
      <path d="M8 20h10l6-10h6M18 20l4-10" stroke="#C45C26" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function ColorBead({ name }: { name: string }) {
  const fill =
    name === 'red'
      ? '#E15A4A'
      : name === 'blue'
        ? '#4A86B8'
        : name === 'yellow'
          ? '#E8B84A'
          : name === 'green'
            ? '#3E8B6A'
            : null;
  if (!fill) return <span className="text-lg font-semibold text-warm-ink">{name}</span>;
  return <span className="inline-block h-10 w-10 rounded-full shadow-sm" style={{ backgroundColor: fill }} />;
}
