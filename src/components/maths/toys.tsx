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

export function ToyIcon({
  name,
  color,
}: {
  name: string;
  color?: string;
}) {
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
    case 'apple':
      return <AppleIcon fill={color} />;
    case 'leaf':
      return <LeafIcon fill={color} />;
    case 'shell':
      return <ShellIcon fill={color} />;
    case 'star':
      return <StarIcon fill={color} />;
    case 'bowl':
      return <BowlIcon fill={color} />;
    case 'button':
      return <ButtonIcon fill={color} />;
    case 'pear':
      return <PearIcon fill={color} />;
    case 'bead':
      return <Counter color={color ?? 'red'} />;
    case 'circle':
      return <span className="inline-block h-8 w-8 rounded-full" style={{ backgroundColor: color ?? '#E15A4A' }} />;
    case 'triangle':
      return (
        <span
          className="inline-block h-0 w-0 border-x-[16px] border-b-[28px] border-x-transparent"
          style={{ borderBottomColor: color ?? '#4A86B8' }}
        />
      );
    case 'square':
      return <span className="inline-block h-8 w-8 rounded-md" style={{ backgroundColor: color ?? '#E8B84A' }} />;
    default:
      return <Counter color={color ?? 'terracotta'} />;
  }
}

export function PictureTray({
  icon,
  count,
  color,
}: {
  icon: string;
  count: number;
  color?: string;
}) {
  return (
    <div className="flex min-h-[5.5rem] flex-wrap items-center justify-center gap-1.5">
      {Array.from({ length: Math.max(1, count) }, (_, i) => (
        <ToyIcon key={i} name={icon} color={color} />
      ))}
    </div>
  );
}

export function TrainEngine() {
  return (
    <svg viewBox="0 0 56 40" className="h-14 w-[4.5rem]" aria-hidden>
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

function AppleIcon({ fill }: { fill?: string }) {
  return (
    <svg viewBox="0 0 28 30" className="h-8 w-8" aria-hidden>
      <path d="M14 7c3-5 8-5 8-1-3 1-6 1-8 1z" fill="#3E8B6A" />
      <path d="M14 10c-6 0-10 6-10 11 0 5 4 8 10 8s10-3 10-8c0-5-4-11-10-11z" fill={fill ?? '#E15A4A'} />
    </svg>
  );
}

function LeafIcon({ fill }: { fill?: string }) {
  return (
    <svg viewBox="0 0 28 32" className="h-8 w-7" aria-hidden>
      <path d="M6 26c8-2 14-10 16-20C12 8 6 16 6 26z" fill={fill ?? '#3E8B6A'} />
      <path d="M8 24c6-4 10-10 12-16" fill="none" stroke="#2D5A4A" strokeWidth="1.4" />
    </svg>
  );
}

function ShellIcon({ fill }: { fill?: string }) {
  return (
    <svg viewBox="0 0 30 24" className="h-7 w-8" aria-hidden>
      <path d="M15 3c8 4 12 10 12 16H3C3 13 7 7 15 3z" fill={fill ?? '#E8A07A'} />
      <path d="M15 5v14M8 10l7 9M22 10l-7 9" stroke="#fff" strokeWidth="1.2" opacity="0.5" />
    </svg>
  );
}

function StarIcon({ fill }: { fill?: string }) {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
      <path
        d="M16 3l3.4 8.2L28 12l-6.4 5.6L23.5 27 16 22.2 8.5 27l1.9-9.4L4 12l8.6-.8z"
        fill={fill ?? '#E8B84A'}
      />
    </svg>
  );
}

function BowlIcon({ fill }: { fill?: string }) {
  return (
    <svg viewBox="0 0 32 22" className="h-7 w-9" aria-hidden>
      <path d="M4 6h24c-1 10-6 14-12 14S5 16 4 6z" fill={fill ?? '#4A86B8'} />
    </svg>
  );
}

function ButtonIcon({ fill }: { fill?: string }) {
  return (
    <svg viewBox="0 0 28 28" className="h-8 w-8" aria-hidden>
      <circle cx="14" cy="14" r="11" fill={fill ?? '#4A7A64'} />
      <circle cx="11" cy="12" r="1.6" fill="#fff" />
      <circle cx="17" cy="12" r="1.6" fill="#fff" />
      <circle cx="11" cy="17" r="1.6" fill="#fff" />
      <circle cx="17" cy="17" r="1.6" fill="#fff" />
    </svg>
  );
}

function PearIcon({ fill }: { fill?: string }) {
  return (
    <svg viewBox="0 0 28 34" className="h-9 w-7" aria-hidden>
      <path d="M14 6c2-3 5-3 5 0-2 .6-4 .6-5 0z" fill="#3E8B6A" />
      <path d="M14 8c-5 3-8 9-6 16 2 6 10 8 12 2 2-7-1-14-6-18z" fill={fill ?? '#8FBF4A'} />
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
