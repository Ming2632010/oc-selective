const STICKER_LABELS: Record<number, string> = {
  1: 'See',
  2: 'Count',
  3: 'Parts',
  4: 'Stories',
  5: 'Tens',
  6: 'Today',
};

export function MathsUnitSticker({
  unitId,
  className,
}: {
  unitId: number;
  className?: string;
}) {
  switch (unitId) {
    case 2:
      return <FingersSticker className={className} />;
    case 3:
      return <TenSticker className={className} />;
    case 4:
      return <BookSticker className={className} />;
    case 5:
      return <BlocksSticker className={className} />;
    case 6:
      return <ClockSticker className={className} />;
    default:
      return <DiceSticker className={className} />;
  }
}

export function stickerLabel(unitId: number) {
  return STICKER_LABELS[unitId] ?? `Unit ${unitId}`;
}

const iconClass = 'h-9 w-9 sm:h-10 sm:w-10';

function DiceSticker({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className ?? iconClass} aria-hidden>
      <rect x="4" y="4" width="32" height="32" rx="8" fill="#C49B7A" />
      <circle cx="13" cy="13" r="3.2" fill="#fff" />
      <circle cx="27" cy="13" r="3.2" fill="#fff" />
      <circle cx="13" cy="27" r="3.2" fill="#fff" />
      <circle cx="27" cy="27" r="3.2" fill="#fff" />
    </svg>
  );
}

function FingersSticker({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className ?? iconClass} aria-hidden>
      {[8, 14, 20, 26, 32].map((x, i) => (
        <rect
          key={x}
          x={x}
          y={i === 0 ? 10 : 6}
          width="5"
          height={i === 0 ? 22 : 26}
          rx="2.5"
          fill="#E8A07A"
        />
      ))}
    </svg>
  );
}

function TenSticker({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className ?? iconClass} aria-hidden>
      <rect x="5" y="8" width="30" height="24" rx="6" fill="#2D5A4A" />
      <text
        x="20"
        y="26"
        textAnchor="middle"
        fill="#fff"
        fontSize="16"
        fontWeight="700"
        fontFamily="Georgia, serif"
      >
        10
      </text>
    </svg>
  );
}

function BookSticker({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className ?? iconClass} aria-hidden>
      <path d="M7 8h11c3 0 5 2 5 5v19H12c-3 0-5-2-5-5V8z" fill="#4A7A64" />
      <path d="M33 8H22c-3 0-5 2-5 5v19h11c3 0 5-2 5-5V8z" fill="#C49B7A" />
      <path d="M20 13v19" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function BlocksSticker({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className ?? iconClass} aria-hidden>
      <rect x="6" y="7" width="10" height="26" rx="2" fill="#2D5A4A" />
      <rect x="18" y="7" width="10" height="26" rx="2" fill="#4A7A64" />
      <rect x="30" y="23" width="6" height="10" rx="1.5" fill="#C49B7A" />
    </svg>
  );
}

function ClockSticker({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className ?? iconClass} aria-hidden>
      <circle cx="20" cy="20" r="14" fill="#F4E4C8" stroke="#C49B7A" strokeWidth="3" />
      <circle cx="20" cy="20" r="2" fill="#3D352E" />
      <path d="M20 20V12" stroke="#3D352E" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M20 20l7 4" stroke="#3D352E" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
