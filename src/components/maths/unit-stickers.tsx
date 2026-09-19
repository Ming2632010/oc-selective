const STICKER_LABELS: Record<number, string> = {
  1: 'See',
  2: 'Count',
  3: 'Parts',
  4: 'Stories',
  5: 'Tens',
  6: 'Today',
};

const STAMP_TILT: Record<number, string> = {
  1: '-rotate-2',
  2: 'rotate-2',
  3: '-rotate-1',
  4: 'rotate-3',
  5: '-rotate-3',
  6: 'rotate-1',
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

export function stampTilt(unitId: number) {
  return STAMP_TILT[unitId] ?? '';
}

const iconClass = 'h-10 w-10 sm:h-12 sm:w-12';

function DiceSticker({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className ?? iconClass} aria-hidden>
      <rect x="3" y="3" width="34" height="34" rx="8" fill="#C49B7A" />
      <circle cx="13" cy="13" r="3.6" fill="#fff" />
      <circle cx="27" cy="13" r="3.6" fill="#fff" />
      <circle cx="20" cy="20" r="3.6" fill="#fff" />
      <circle cx="13" cy="27" r="3.6" fill="#fff" />
      <circle cx="27" cy="27" r="3.6" fill="#fff" />
    </svg>
  );
}

function FingersSticker({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className ?? iconClass} aria-hidden>
      <path
        d="M12 34c-3 0-5-2-5-5V20c0-1.4 1.2-2.6 2.6-2.6S12 18.6 12 20v1.2V10.2c0-1.6 1.3-2.8 2.9-2.8S18 8.6 18 10.2V8.6c0-1.7 1.4-3.1 3.1-3.1S24 6.9 24 8.6v2.2c0-1.5 1.3-2.7 2.8-2.7s2.8 1.2 2.8 2.7v7.4c1.4-.4 3.1.4 3.6 1.8.4 1.2 0 2.5-1 3.2V29c0 3-2.2 5-5.2 5H12z"
        fill="#E8A07A"
      />
      <path d="M11 22.5h18" stroke="#F6D2BB" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function TenSticker({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className ?? iconClass} aria-hidden>
      <rect x="3" y="6" width="34" height="28" rx="8" fill="#2D5A4A" />
      <text
        x="20"
        y="27"
        textAnchor="middle"
        fill="#fff"
        fontSize="17"
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
      <path d="M5 7h13c3.4 0 5.6 2.2 5.6 5.4V34H11.2C7.8 34 5 31.6 5 28.2V7z" fill="#4A7A64" />
      <path d="M35 7H22c-3.4 0-5.6 2.2-5.6 5.4V34h12.4c3.4 0 6.2-2.4 6.2-5.8V7z" fill="#C49B7A" />
      <path d="M20 12.2V34" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BlocksSticker({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className ?? iconClass} aria-hidden>
      <rect x="4" y="6" width="12" height="28" rx="2.5" fill="#2D5A4A" />
      <path d="M4 13.5h12M4 20.5h12M4 27.5h12" stroke="#EEF6F0" strokeWidth="1.4" />
      <rect x="20" y="22" width="8" height="12" rx="1.8" fill="#4A7A64" />
      <rect x="29.5" y="22" width="8" height="12" rx="1.8" fill="#C49B7A" />
    </svg>
  );
}

function ClockSticker({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className ?? iconClass} aria-hidden>
      <circle cx="20" cy="20" r="16" fill="#F4E4C8" />
      <circle cx="20" cy="20" r="16" fill="none" stroke="#C49B7A" strokeWidth="4" />
      <circle cx="20" cy="20" r="2.2" fill="#3D352E" />
      <path d="M20 20V10" stroke="#3D352E" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M20 20l8 4.5" stroke="#3D352E" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}
