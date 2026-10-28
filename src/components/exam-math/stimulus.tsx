'use client';

import type { ReactNode } from 'react';
import type { ExamMathStimulus } from '@/lib/exam-math-stimulus';

const INK = '#3D352E';
const RULE = '#C49B7A';
const PAPER = '#FFF8E8';
const FILL = '#2F5D50';
const FILL_2 = '#C45C26';
const FILL_3 = '#6B8F71';
const FILL_4 = '#8A3A28';
const FILLS = [FILL, FILL_2, FILL_3, FILL_4, RULE];

function Caption({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="mb-2 text-center text-sm font-medium text-warm-ink">{children}</p>;
}

function Frame({
  label,
  children,
  wide,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <figure
      className={`rounded-lg border border-warm-border bg-[#FBF7F0] p-3 ${wide ? 'w-full' : 'max-w-xl'}`}
      aria-label={label}
    >
      {children}
    </figure>
  );
}

function BarChart({ stimulus }: { stimulus: Extract<ExamMathStimulus, { type: 'bar' }> }) {
  const max = Math.max(...stimulus.bars.map((bar) => bar.value), 1);
  const width = 360;
  const height = 200;
  const padL = 36;
  const padB = 36;
  const padT = 16;
  const padR = 12;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const gap = 12;
  const barW = (innerW - gap * (stimulus.bars.length + 1)) / stimulus.bars.length;
  return (
    <Frame label={stimulus.caption || 'Bar graph'}>
      <Caption>{stimulus.caption}</Caption>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img">
        <line x1={padL} y1={padT} x2={padL} y2={height - padB} stroke={INK} strokeWidth="1.5" />
        <line
          x1={padL}
          y1={height - padB}
          x2={width - padR}
          y2={height - padB}
          stroke={INK}
          strokeWidth="1.5"
        />
        {stimulus.bars.map((bar, index) => {
          const h = (bar.value / max) * innerH;
          const x = padL + gap + index * (barW + gap);
          const y = height - padB - h;
          return (
            <g key={bar.label}>
              <rect x={x} y={y} width={barW} height={h} fill={FILLS[index % FILLS.length]} />
              <text
                x={x + barW / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize="11"
                fill={INK}
                fontWeight="600"
              >
                {bar.value}
                {stimulus.unit ? ` ${stimulus.unit}` : ''}
              </text>
              <text
                x={x + barW / 2}
                y={height - padB + 16}
                textAnchor="middle"
                fontSize="11"
                fill={INK}
              >
                {bar.label}
              </text>
            </g>
          );
        })}
      </svg>
    </Frame>
  );
}

function LineChart({ stimulus }: { stimulus: Extract<ExamMathStimulus, { type: 'line' }> }) {
  const max = Math.max(...stimulus.points.map((point) => point.y), 1);
  const min = Math.min(...stimulus.points.map((point) => point.y), 0);
  const span = Math.max(max - min, 1);
  const width = 380;
  const height = 200;
  const padL = 40;
  const padB = 40;
  const padT = 16;
  const padR = 16;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const coords = stimulus.points.map((point, index) => {
    const x = padL + (index / Math.max(stimulus.points.length - 1, 1)) * innerW;
    const y = padT + ((max - point.y) / span) * innerH;
    return { ...point, xPos: x, yPos: y };
  });
  const d = coords.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.xPos} ${point.yPos}`).join(' ');
  return (
    <Frame label={stimulus.caption || 'Line graph'}>
      <Caption>{stimulus.caption}</Caption>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img">
        <line x1={padL} y1={padT} x2={padL} y2={height - padB} stroke={INK} strokeWidth="1.5" />
        <line
          x1={padL}
          y1={height - padB}
          x2={width - padR}
          y2={height - padB}
          stroke={INK}
          strokeWidth="1.5"
        />
        <path d={d} fill="none" stroke={FILL} strokeWidth="2.5" />
        {coords.map((point) => (
          <g key={point.x}>
            <circle cx={point.xPos} cy={point.yPos} r="4" fill={FILL_2} />
            <text x={point.xPos} y={point.yPos - 8} textAnchor="middle" fontSize="10" fill={INK}>
              {point.y}
            </text>
            <text
              x={point.xPos}
              y={height - padB + 16}
              textAnchor="middle"
              fontSize="11"
              fill={INK}
            >
              {point.x}
            </text>
          </g>
        ))}
        {stimulus.yLabel ? (
          <text x={14} y={height / 2} fontSize="10" fill={INK} transform={`rotate(-90 14 ${height / 2})`}>
            {stimulus.yLabel}
          </text>
        ) : null}
        {stimulus.xLabel ? (
          <text x={width / 2} y={height - 6} textAnchor="middle" fontSize="10" fill={INK}>
            {stimulus.xLabel}
          </text>
        ) : null}
      </svg>
    </Frame>
  );
}

function polar(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function PieChart({ stimulus }: { stimulus: Extract<ExamMathStimulus, { type: 'pie' }> }) {
  const total = stimulus.slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  const cx = 90;
  const cy = 90;
  const r = 70;
  let angle = -Math.PI / 2;
  const slices = stimulus.slices.map((slice, index) => {
    const sweep = (slice.value / total) * Math.PI * 2;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    const large = sweep > Math.PI ? 1 : 0;
    const a = polar(cx, cy, r, start);
    const b = polar(cx, cy, r, end);
    const mid = polar(cx, cy, r * 0.55, start + sweep / 2);
    return {
      ...slice,
      d: `M ${cx} ${cy} L ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y} Z`,
      color: FILLS[index % FILLS.length]!,
      mid,
    };
  });
  return (
    <Frame label={stimulus.caption || 'Pie chart'} wide>
      <Caption>{stimulus.caption}</Caption>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <svg viewBox="0 0 180 180" className="h-44 w-44" role="img">
          {slices.map((slice) => (
            <path key={slice.label} d={slice.d} fill={slice.color} stroke={PAPER} strokeWidth="1.5" />
          ))}
        </svg>
        <ul className="space-y-1 text-sm text-warm-ink">
          {slices.map((slice) => (
            <li key={slice.label} className="flex items-center gap-2">
              <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: slice.color }} />
              {slice.label}: {slice.value}
            </li>
          ))}
        </ul>
      </div>
    </Frame>
  );
}

function DataTable({ stimulus }: { stimulus: Extract<ExamMathStimulus, { type: 'table' }> }) {
  return (
    <Frame label={stimulus.caption || 'Table'} wide>
      <Caption>{stimulus.caption}</Caption>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm text-warm-ink">
          <thead>
            <tr>
              {stimulus.headers.map((header) => (
                <th
                  key={header}
                  className="border border-[#C9B79A] bg-[#F3E6D4] px-3 py-2 text-left font-semibold"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stimulus.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={`${rowIndex}-${cellIndex}`} className="border border-[#C9B79A] bg-white px-3 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Frame>
  );
}

function ClockFace({ stimulus }: { stimulus: Extract<ExamMathStimulus, { type: 'clock' }> }) {
  const hour = ((stimulus.hour % 12) + 12) % 12;
  const minute = ((stimulus.minute % 60) + 60) % 60;
  const minuteAngle = minute * 6 - 90;
  const hourAngle = hour * 30 + minute * 0.5 - 90;
  const hand = (angle: number, length: number, width: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x2: 50 + Math.cos(rad) * length,
      y2: 50 + Math.sin(rad) * length,
      width,
    };
  };
  const hourHand = hand(hourAngle, 22, 3);
  const minuteHand = hand(minuteAngle, 32, 2);
  return (
    <Frame label={`Clock showing ${hour || 12}:${String(minute).padStart(2, '0')}`}>
      <svg viewBox="0 0 100 100" className="mx-auto h-44 w-44" role="img">
        <circle cx="50" cy="50" r="46" fill={PAPER} stroke={RULE} strokeWidth="4" />
        {Array.from({ length: 12 }, (_, i) => {
          const angle = ((i + 1) / 12) * Math.PI * 2 - Math.PI / 2;
          return (
            <text
              key={i}
              x={50 + Math.cos(angle) * 34}
              y={50 + Math.sin(angle) * 34 + 3.5}
              textAnchor="middle"
              fontSize="8"
              fontWeight="700"
              fill={INK}
            >
              {i + 1}
            </text>
          );
        })}
        <line x1="50" y1="50" x2={hourHand.x2} y2={hourHand.y2} stroke={INK} strokeWidth={hourHand.width} strokeLinecap="round" />
        <line
          x1="50"
          y1="50"
          x2={minuteHand.x2}
          y2={minuteHand.y2}
          stroke={FILL_2}
          strokeWidth={minuteHand.width}
          strokeLinecap="round"
        />
        <circle cx="50" cy="50" r="2.5" fill={INK} />
      </svg>
    </Frame>
  );
}

function KitchenScale({ stimulus }: { stimulus: Extract<ExamMathStimulus, { type: 'scale' }> }) {
  const ratio = Math.min(1, Math.max(0, stimulus.value / stimulus.max));
  const angle = -120 + ratio * 240;
  const rad = (angle * Math.PI) / 180;
  const x2 = 80 + Math.cos(rad) * 48;
  const y2 = 78 + Math.sin(rad) * 48;
  const ticks = 8;
  return (
    <Frame label={`Scale showing ${stimulus.value} ${stimulus.unit}`}>
      <svg viewBox="0 0 160 110" className="mx-auto h-40 w-56" role="img">
        <path d="M20 78 A60 60 0 0 1 140 78" fill={PAPER} stroke={RULE} strokeWidth="4" />
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const t = -120 + (i / ticks) * 240;
          const inner = polar(80, 78, 40, (t * Math.PI) / 180);
          const outer = polar(80, 78, 52, (t * Math.PI) / 180);
          const label = ((stimulus.max * i) / ticks).toFixed(i === 0 || i === ticks ? 0 : 1);
          return (
            <g key={i}>
              <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={INK} strokeWidth="1.5" />
              <text x={outer.x} y={outer.y - 2} textAnchor="middle" fontSize="8" fill={INK}>
                {label}
              </text>
            </g>
          );
        })}
        <line x1="80" y1="78" x2={x2} y2={y2} stroke={FILL_2} strokeWidth="3" strokeLinecap="round" />
        <circle cx="80" cy="78" r="4" fill={INK} />
        <text x="80" y="102" textAnchor="middle" fontSize="11" fill={INK}>
          {stimulus.unit}
        </text>
      </svg>
    </Frame>
  );
}

function CubeStack({ stimulus }: { stimulus: Extract<ExamMathStimulus, { type: 'cube' }> }) {
  const n = stimulus.n;
  const size = 14;
  const cubes: Array<{ x: number; y: number; z: number }> = [];
  for (let y = 0; y < n; y += 1) {
    for (let z = 0; z < n; z += 1) {
      for (let x = 0; x < n; x += 1) {
        cubes.push({ x, y, z });
      }
    }
  }
  cubes.sort((a, b) => a.y - b.y || a.z + a.x - (b.z + b.x));
  const project = (x: number, y: number, z: number) => {
    const px = 90 + (x - z) * size;
    const py = 140 - y * size * 1.15 - (x + z) * size * 0.5;
    return { px, py };
  };
  function face(x: number, y: number, z: number) {
    const p = project(x, y, z);
    const top = [
      p,
      project(x + 1, y, z),
      project(x + 1, y, z + 1),
      project(x, y, z + 1),
    ];
    const right = [
      project(x + 1, y, z),
      project(x + 1, y, z + 1),
      project(x + 1, y + 1, z + 1),
      project(x + 1, y + 1, z),
    ];
    const left = [
      project(x, y, z + 1),
      project(x + 1, y, z + 1),
      project(x + 1, y + 1, z + 1),
      project(x, y + 1, z + 1),
    ];
    const poly = (pts: Array<{ px: number; py: number }>) =>
      pts.map((pt) => `${pt.px},${pt.py}`).join(' ');
    return { top: poly(top), right: poly(right), left: poly(left) };
  }
  return (
    <Frame label={`${n} by ${n} by ${n} cube`}>
      <svg viewBox="0 0 200 160" className="mx-auto h-48 w-56" role="img">
        {cubes.map((cube) => {
          const faces = face(cube.x, cube.y, cube.z);
          const key = `${cube.x}-${cube.y}-${cube.z}`;
          return (
            <g key={key}>
              <polygon points={faces.left} fill="#6B8F71" stroke={INK} strokeWidth="0.6" />
              <polygon points={faces.right} fill="#2F5D50" stroke={INK} strokeWidth="0.6" />
              <polygon points={faces.top} fill="#DCEEE3" stroke={INK} strokeWidth="0.6" />
            </g>
          );
        })}
      </svg>
      <p className="text-center text-xs text-warm-muted">
        {n} × {n} × {n} small cubes
      </p>
    </Frame>
  );
}

function PaintedGrid({ stimulus }: { stimulus: Extract<ExamMathStimulus, { type: 'painted-grid' }> }) {
  const total = stimulus.columns * stimulus.rows;
  const filled = Math.min(total, Math.max(0, stimulus.filled));
  const cell = 22;
  const width = stimulus.columns * cell + 2;
  const height = stimulus.rows * cell + 2;
  return (
    <Frame label={`Grid of ${total} equal sections, ${filled} painted`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="mx-auto h-40 w-auto max-w-full" role="img">
        {Array.from({ length: total }, (_, i) => {
          const col = i % stimulus.columns;
          const row = Math.floor(i / stimulus.columns);
          return (
            <rect
              key={i}
              x={1 + col * cell}
              y={1 + row * cell}
              width={cell}
              height={cell}
              fill={i < filled ? FILL : PAPER}
              stroke={INK}
              strokeWidth="1"
            />
          );
        })}
      </svg>
    </Frame>
  );
}

function dim(value: number, unit?: string) {
  return unit ? `${value} ${unit}` : String(value);
}

function CompoundRect({ stimulus }: { stimulus: Extract<ExamMathStimulus, { type: 'compound-rect' }> }) {
  const scale = 8;
  const W = stimulus.outerW * scale;
  const H = stimulus.outerH * scale;
  const w = stimulus.cutW * scale;
  const h = stimulus.cutH * scale;
  return (
    <Frame label="Compound rectangle">
      <svg viewBox={`-8 -16 ${W + 24} ${H + 36}`} className="mx-auto h-44 w-auto max-w-full" role="img">
        <path
          d={`M0 0 H${W} V${H} H${w} V${h} H0 Z`}
          fill="#DCEEE3"
          stroke={INK}
          strokeWidth="1.8"
        />
        <path d={`M${W - w} ${H - h} H${W} V${H} H${W - w} Z`} fill="#F4F1EA" stroke={INK} strokeWidth="1.2" strokeDasharray="4 3" />
        <text x={W / 2} y={-4} textAnchor="middle" fontSize="11" fill={INK}>
          {dim(stimulus.outerW, stimulus.unit)}
        </text>
        <text x={W + 6} y={H / 2} fontSize="11" fill={INK}>
          {dim(stimulus.outerH, stimulus.unit)}
        </text>
        <text x={W - w / 2} y={H - h - 4} textAnchor="middle" fontSize="10" fill={INK}>
          {dim(stimulus.cutW, stimulus.unit)}
        </text>
        <text x={W + 6} y={H - h / 2} fontSize="10" fill={INK}>
          {dim(stimulus.cutH, stimulus.unit)}
        </text>
      </svg>
    </Frame>
  );
}

function RectPair({ stimulus }: { stimulus: Extract<ExamMathStimulus, { type: 'rect-pair' }> }) {
  const scale = 6;
  const bH = stimulus.bH ?? 10;
  return (
    <Frame label="Two rectangles">
      <svg viewBox="0 0 280 120" className="mx-auto h-36 w-full" role="img">
        <rect x="10" y="20" width={stimulus.aW * scale} height={stimulus.aH * scale} fill="#DCEEE3" stroke={INK} />
        <text x={10 + (stimulus.aW * scale) / 2} y="16" textAnchor="middle" fontSize="11" fill={INK}>
          P {dim(stimulus.aW, stimulus.unit)} × {dim(stimulus.aH, stimulus.unit)}
        </text>
        <rect
          x="160"
          y="20"
          width={stimulus.bW * scale}
          height={Math.min(80, bH * scale)}
          fill="#F3E6D4"
          stroke={INK}
        />
        <text x={160 + (stimulus.bW * scale) / 2} y="16" textAnchor="middle" fontSize="11" fill={INK}>
          Q {dim(stimulus.bW, stimulus.unit)} × ?
        </text>
      </svg>
    </Frame>
  );
}

function SquareCut({ stimulus }: { stimulus: Extract<ExamMathStimulus, { type: 'square-cut' }> }) {
  const s = 80;
  return (
    <Frame label="Square cut into four smaller squares">
      <svg viewBox="0 0 100 100" className="mx-auto h-40 w-40" role="img">
        <rect x="10" y="10" width={s} height={s} fill="#DCEEE3" stroke={INK} />
        <line x1="50" y1="10" x2="50" y2="90" stroke={INK} />
        <line x1="10" y1="50" x2="90" y2="50" stroke={INK} />
        <text x="50" y="8" textAnchor="middle" fontSize="10" fill={INK}>
          {dim(stimulus.side, stimulus.unit)}
        </text>
      </svg>
    </Frame>
  );
}

function StraightAngle({ stimulus }: { stimulus: Extract<ExamMathStimulus, { type: 'straight-angle' }> }) {
  const given = stimulus.given;
  const sweep = Math.min(given, 160);
  const end = polar(90, 70, 36, (Math.PI * (180 - sweep)) / 180);
  return (
    <Frame label="Angles on a straight line">
      <svg viewBox="0 0 180 100" className="mx-auto h-36 w-56" role="img">
        <line x1="16" y1="70" x2="164" y2="70" stroke={INK} strokeWidth="2.5" />
        <line x1="90" y1="70" x2={end.x} y2={end.y} stroke={FILL_2} strokeWidth="2.5" />
        <text x="58" y="64" fontSize="12" fill={INK}>
          {given}°
        </text>
        <text x="118" y="64" fontSize="12" fill={INK}>
          ?
        </text>
      </svg>
    </Frame>
  );
}

function CoordGrid({ stimulus }: { stimulus: Extract<ExamMathStimulus, { type: 'coord-grid' }> }) {
  const cols = 8;
  const rows = 8;
  const cell = 18;
  const originX = 28;
  const originY = 8 + rows * cell;
  const boxes = Array.from({ length: stimulus.steps }, (_, i) => ({
    c: stimulus.startCol + i,
    r: stimulus.startRow + i,
  })).filter((box) => box.c >= 1 && box.c <= cols && box.r >= 1 && box.r <= rows);
  return (
    <Frame label="Numbered grid">
      <svg viewBox="0 0 190 180" className="mx-auto h-52 w-52" role="img">
        {Array.from({ length: cols }, (_, c) =>
          Array.from({ length: rows }, (_, r) => (
            <rect
              key={`${c}-${r}`}
              x={originX + c * cell}
              y={originY - (r + 1) * cell}
              width={cell}
              height={cell}
              fill={PAPER}
              stroke={RULE}
            />
          )),
        )}
        {boxes.map((box, index) => (
          <g key={`${box.c}-${box.r}`}>
            <rect
              x={originX + (box.c - 1) * cell}
              y={originY - box.r * cell}
              width={cell}
              height={cell}
              fill={index === boxes.length - 1 ? FILL_2 : FILL}
              opacity="0.85"
            />
            <text
              x={originX + (box.c - 1) * cell + cell / 2}
              y={originY - box.r * cell + 13}
              textAnchor="middle"
              fontSize="9"
              fill="white"
              fontWeight="700"
            >
              {index + 1}
            </text>
          </g>
        ))}
        {Array.from({ length: cols }, (_, c) => (
          <text
            key={`c${c}`}
            x={originX + c * cell + cell / 2}
            y={originY + 14}
            textAnchor="middle"
            fontSize="9"
            fill={INK}
          >
            {String.fromCharCode(65 + c)}
          </text>
        ))}
        {Array.from({ length: rows }, (_, r) => (
          <text
            key={`r${r}`}
            x={originX - 8}
            y={originY - r * cell - 6}
            textAnchor="end"
            fontSize="9"
            fill={INK}
          >
            {r + 1}
          </text>
        ))}
      </svg>
    </Frame>
  );
}

export function ExamMathStimulusView({ stimulus }: { stimulus?: ExamMathStimulus }) {
  if (!stimulus) return null;
  if (stimulus.type === 'bar') return <BarChart stimulus={stimulus} />;
  if (stimulus.type === 'line') return <LineChart stimulus={stimulus} />;
  if (stimulus.type === 'pie') return <PieChart stimulus={stimulus} />;
  if (stimulus.type === 'table') return <DataTable stimulus={stimulus} />;
  if (stimulus.type === 'clock') return <ClockFace stimulus={stimulus} />;
  if (stimulus.type === 'scale') return <KitchenScale stimulus={stimulus} />;
  if (stimulus.type === 'cube') return <CubeStack stimulus={stimulus} />;
  if (stimulus.type === 'painted-grid') return <PaintedGrid stimulus={stimulus} />;
  if (stimulus.type === 'compound-rect') return <CompoundRect stimulus={stimulus} />;
  if (stimulus.type === 'rect-pair') return <RectPair stimulus={stimulus} />;
  if (stimulus.type === 'square-cut') return <SquareCut stimulus={stimulus} />;
  if (stimulus.type === 'straight-angle') return <StraightAngle stimulus={stimulus} />;
  if (stimulus.type === 'coord-grid') return <CoordGrid stimulus={stimulus} />;
  return null;
}
