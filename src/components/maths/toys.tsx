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
      return (
        <span
          className="inline-block h-10 w-10 rounded-full shadow-[inset_-2px_-2px_0_rgba(0,0,0,0.12)]"
          style={{ backgroundColor: color ?? '#E15A4A' }}
        />
      );
    case 'triangle':
      return (
        <span
          className="inline-block h-0 w-0 border-x-[20px] border-b-[34px] border-x-transparent"
          style={{ borderBottomColor: color ?? '#4A86B8' }}
        />
      );
    case 'square':
      return (
        <span
          className="inline-block h-10 w-10 rounded-md shadow-[inset_-2px_-2px_0_rgba(0,0,0,0.12)]"
          style={{ backgroundColor: color ?? '#E8B84A' }}
        />
      );
    case 'rectangle':
      return (
        <span
          className="inline-block h-8 w-12 rounded-md shadow-[inset_-2px_-2px_0_rgba(0,0,0,0.12)]"
          style={{ backgroundColor: color ?? '#4A7A64' }}
        />
      );
    case 'shoe':
      return <ShoeIcon fill={color} />;
    case 'hat':
      return <HatIcon fill={color} />;
    case 'bag':
      return <BagIcon fill={color} />;
    case 'ball':
      return <BallIcon fill={color} />;
    case 'book':
      return <BookIcon fill={color} />;
    case 'box':
      return <BoxIcon fill={color} />;
    case 'frame':
      return <FrameIcon fill={color} />;
    case 'feather':
      return <FeatherIcon fill={color} />;
    case 'sun':
      return <SunIcon />;
    case 'moon':
      return <MoonIcon />;
    case 'bed':
      return <BedIcon />;
    case 'peg':
      return <PegIcon fill={color} />;
    case 'sock':
      return <SockIcon fill={color} />;
    case 'clap':
      return <ClapIcon />;
    case 'stamp':
      return <StampIcon />;
    case 'jump':
      return <JumpIcon />;
    case 'stop':
      return <StopIcon />;
    case 'dice':
      return <MiniDiceIcon />;
    case 'pencil':
      return <PencilIcon fill={color} />;
    case 'rain':
      return <RainIcon />;
    case 'cow':
      return <CowIcon />;
    case 'sandwich':
      return <SandwichIcon />;
    case 'cube':
      return <CubeIcon fill={color} />;
    case 'cup':
      return <BowlIcon fill={color} />;
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
    <div className="flex min-h-[6.25rem] flex-wrap items-center justify-center gap-2 [&_svg]:h-10 [&_svg]:w-10">
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
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
      <path d="M16 3c9 4 13 12 13 18-1 6-6 9-13 9S4 27 3 21C3 15 7 7 16 3z" fill={fill ?? '#3E8B6A'} />
      <path d="M16 7v20M16 14c-5 2-8 6-9 10M16 14c5 2 8 6 9 10" fill="none" stroke="#24543C" strokeWidth="1.6" />
    </svg>
  );
}

function ShellIcon({ fill }: { fill?: string }) {
  return (
    <svg viewBox="0 0 32 28" className="h-8 w-9" aria-hidden>
      <path
        d="M4 20c1-9 6-16 12-18 6 2 11 9 12 18-3 5-8 7-12 7s-9-2-12-7z"
        fill={fill ?? '#E8A07A'}
      />
      <path
        d="M16 4v21M8 10c3 5 6 11 8 15M24 10c-3 5-6 11-8 15M6 18h20"
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
        opacity="0.5"
      />
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

function PencilIcon({ fill }: { fill?: string }) {
  return (
    <svg viewBox="0 0 28 32" className="h-9 w-7" aria-hidden>
      <path d="M10 2h8l2 20H8z" fill={fill ?? '#E8B84A'} />
      <path d="M8 22h12l-6 8z" fill="#E8A07A" />
    </svg>
  );
}

function ShoeIcon({ fill }: { fill?: string }) {
  return (
    <svg viewBox="0 0 32 20" className="h-7 w-10" aria-hidden>
      <path d="M4 12h14c6 0 10 2 12 6H6c-3 0-4-3-2-6z" fill={fill ?? '#C45C26'} />
      <path d="M6 8c4-4 10-4 12 0" fill="none" stroke="#3D352E" strokeWidth="1.8" />
    </svg>
  );
}

function HatIcon({ fill }: { fill?: string }) {
  return (
    <svg viewBox="0 0 32 22" className="h-8 w-9" aria-hidden>
      <path d="M6 14c2-8 18-8 20 0H6z" fill={fill ?? '#4A86B8'} />
      <ellipse cx="16" cy="15" rx="13" ry="4" fill={fill ?? '#4A86B8'} />
    </svg>
  );
}

function BagIcon({ fill }: { fill?: string }) {
  return (
    <svg viewBox="0 0 28 30" className="h-9 w-8" aria-hidden>
      <path d="M6 10h16l-1 16H7z" fill={fill ?? '#C45C26'} />
      <path d="M10 10c0-6 8-6 8 0" fill="none" stroke="#3D352E" strokeWidth="2.2" />
    </svg>
  );
}

function BallIcon({ fill }: { fill?: string }) {
  return (
    <svg viewBox="0 0 28 28" className="h-9 w-9" aria-hidden>
      <circle cx="14" cy="14" r="12" fill={fill ?? '#E15A4A'} />
      <path d="M14 2c4 4 4 20 0 24M2 14h24" fill="none" stroke="#fff" strokeWidth="1.6" opacity="0.5" />
    </svg>
  );
}

function BookIcon({ fill }: { fill?: string }) {
  return (
    <svg viewBox="0 0 28 30" className="h-9 w-8" aria-hidden>
      <path d="M5 4h16v22H5z" fill={fill ?? '#4A7A64'} />
      <path d="M9 4v22" stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

function BoxIcon({ fill }: { fill?: string }) {
  return (
    <svg viewBox="0 0 30 26" className="h-8 w-9" aria-hidden>
      <path d="M4 8h22v14H4z" fill={fill ?? '#C49B7A'} />
      <path d="M4 8l11-6 11 6" fill={fill ?? '#E8B84A'} />
    </svg>
  );
}

function FrameIcon({ fill }: { fill?: string }) {
  return (
    <svg viewBox="0 0 28 28" className="h-9 w-9" aria-hidden>
      <rect x="3" y="3" width="22" height="22" rx="2" fill="none" stroke={fill ?? '#3D352E'} strokeWidth="4" />
      <rect x="8" y="8" width="12" height="12" fill="#8FBF4A" />
    </svg>
  );
}

function FeatherIcon({ fill }: { fill?: string }) {
  return (
    <svg viewBox="0 0 28 32" className="h-9 w-7" aria-hidden>
      <path d="M14 2c8 8 10 18 4 28-8-6-12-16-4-28z" fill={fill ?? '#F0D8C6'} />
      <path d="M14 6v22" stroke="#C49B7A" strokeWidth="1.6" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-9 w-9" aria-hidden>
      <circle cx="16" cy="16" r="7" fill="#E8B84A" />
      <path d="M16 2v4M16 26v4M2 16h4M26 16h4M6 6l3 3M23 23l3 3M6 26l3-3M23 9l3-3" stroke="#E8B84A" strokeWidth="2.2" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 28 28" className="h-9 w-9" aria-hidden>
      <path d="M20 4c-8 2-14 10-12 18 6 2 16-2 16-10-4-2-6-6-4-8z" fill="#4A86B8" />
    </svg>
  );
}

function BedIcon() {
  return (
    <svg viewBox="0 0 32 22" className="h-8 w-10" aria-hidden>
      <path d="M2 14h28v6H2z" fill="#4A7A64" />
      <path d="M8 8h16v6H8z" fill="#C45C26" />
      <circle cx="10" cy="7" r="3" fill="#E8A07A" />
    </svg>
  );
}

function PegIcon({ fill }: { fill?: string }) {
  return (
    <svg viewBox="0 0 18 28" className="h-9 w-6" aria-hidden>
      <path d="M5 2h8v10H5z" fill={fill ?? '#E8B84A'} />
      <path d="M7 12h4v14H7z" fill={fill ?? '#C45C26'} />
    </svg>
  );
}

function SockIcon({ fill }: { fill?: string }) {
  return (
    <svg viewBox="0 0 24 32" className="h-9 w-7" aria-hidden>
      <path d="M8 2h8v16c6 2 8 8 4 10s-12 0-10-6V2z" fill={fill ?? '#4A86B8'} />
    </svg>
  );
}

function ClapIcon() {
  return (
    <svg viewBox="0 0 32 28" className="h-8 w-9" aria-hidden>
      <path d="M6 16c0-6 4-10 8-10l2 12c-6 2-10 2-10-2z" fill="#E8A07A" />
      <path d="M18 6c4 0 8 4 8 10 0 4-4 4-10 2l2-12z" fill="#C45C26" />
    </svg>
  );
}

function StampIcon() {
  return (
    <svg viewBox="0 0 28 32" className="h-9 w-8" aria-hidden>
      <ellipse cx="14" cy="26" rx="10" ry="4" fill="#3D352E" />
      <path d="M10 4h8v18H10z" fill="#C45C26" />
    </svg>
  );
}

function JumpIcon() {
  return (
    <svg viewBox="0 0 28 32" className="h-9 w-8" aria-hidden>
      <circle cx="14" cy="6" r="4" fill="#E8A07A" />
      <path d="M14 11l-6 8h4l2 9 2-9h4z" fill="#4A7A64" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 28 28" className="h-8 w-8" aria-hidden>
      <rect x="4" y="4" width="20" height="20" rx="4" fill="#E15A4A" />
    </svg>
  );
}

function MiniDiceIcon() {
  return (
    <svg viewBox="0 0 28 28" className="h-8 w-8" aria-hidden>
      <rect x="3" y="3" width="22" height="22" rx="5" fill="#C49B7A" />
      <circle cx="10" cy="10" r="2" fill="#fff" />
      <circle cx="18" cy="18" r="2" fill="#fff" />
    </svg>
  );
}

function RainIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-9 w-9" aria-hidden>
      <path d="M8 14h16a6 6 0 0 0-1-8 7 7 0 0 0-13 2 5 5 0 0 0-2 6z" fill="#8AA4B8" />
      <path d="M10 20l-2 6M16 21l-2 6M22 20l-2 6" stroke="#4A86B8" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function CowIcon() {
  return (
    <svg viewBox="0 0 36 28" className="h-8 w-10" aria-hidden>
      <ellipse cx="18" cy="16" rx="12" ry="8" fill="#F4E4C8" />
      <circle cx="10" cy="10" r="4" fill="#F4E4C8" />
      <circle cx="26" cy="10" r="4" fill="#F4E4C8" />
      <circle cx="16" cy="15" r="1.4" fill="#3D352E" />
      <circle cx="21" cy="15" r="1.4" fill="#3D352E" />
      <ellipse cx="18" cy="20" rx="3" ry="2" fill="#E8A07A" />
    </svg>
  );
}

function SandwichIcon() {
  return (
    <svg viewBox="0 0 32 24" className="h-8 w-10" aria-hidden>
      <path d="M4 10 16 4l12 6-12 6z" fill="#E8B84A" />
      <path d="M4 14 16 8l12 6-12 6z" fill="#4A7A64" />
    </svg>
  );
}

function CubeIcon({ fill }: { fill?: string }) {
  return (
    <svg viewBox="0 0 28 28" className="h-8 w-8" aria-hidden>
      <path d="M4 10 14 4l10 6v12L14 28 4 22z" fill={fill ?? '#4A86B8'} />
      <path d="M14 4v24M4 10l10 6 10-6" stroke="#fff" strokeWidth="1.4" />
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
  if (fill) {
    return <span className="inline-block h-10 w-10 rounded-full shadow-sm" style={{ backgroundColor: fill }} />;
  }
  if (['clap', 'stamp', 'jump', 'stop'].includes(name)) {
    return <ToyIcon name={name} />;
  }
  if (/^\d+$/.test(name)) {
    return <span className="text-2xl font-bold text-warm-ink">{name}</span>;
  }
  return <span className="text-lg font-semibold text-warm-ink">{name}</span>;
}
