/** On-screen figures for Selective Math. Stored as JSON on exam_math_items.stimulus. */

export type ExamMathBar = { label: string; value: number };
export type ExamMathSlice = { label: string; value: number };
export type ExamMathPoint = { x: string; y: number };

export type ExamMathStimulus =
  | { type: 'table'; caption?: string; headers: string[]; rows: string[][] }
  | { type: 'bar'; caption?: string; unit?: string; bars: ExamMathBar[] }
  | { type: 'line'; caption?: string; xLabel?: string; yLabel?: string; points: ExamMathPoint[] }
  | { type: 'pie'; caption?: string; slices: ExamMathSlice[] }
  | { type: 'clock'; hour: number; minute: number }
  | { type: 'scale'; max: number; value: number; unit: string }
  | { type: 'cube'; n: number }
  | { type: 'painted-grid'; columns: number; rows: number; filled: number }
  | {
      type: 'compound-rect';
      outerW: number;
      outerH: number;
      cutW: number;
      cutH: number;
      unit?: string;
    }
  | { type: 'rect-pair'; aW: number; aH: number; bW: number; bH?: number; unit?: string }
  | { type: 'square-cut'; side: number; unit?: string }
  | { type: 'straight-angle'; given: number }
  | { type: 'coord-grid'; startCol: number; startRow: number; steps: number };

const TYPES = new Set([
  'table',
  'bar',
  'line',
  'pie',
  'clock',
  'scale',
  'cube',
  'painted-grid',
  'compound-rect',
  'rect-pair',
  'square-cut',
  'straight-angle',
  'coord-grid',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asFinite(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function asBars(value: unknown): ExamMathBar[] | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const bars: ExamMathBar[] = [];
  for (const row of value) {
    if (!isRecord(row)) return null;
    const label = asString(row.label);
    const amount = asFinite(row.value);
    if (!label || amount === null || amount < 0) return null;
    bars.push({ label, value: amount });
  }
  return bars;
}

function asSlices(value: unknown): ExamMathSlice[] | null {
  return asBars(value);
}

function asPoints(value: unknown): ExamMathPoint[] | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const points: ExamMathPoint[] = [];
  for (const row of value) {
    if (!isRecord(row)) return null;
    const x = asString(row.x);
    const y = asFinite(row.y);
    if (!x || y === null) return null;
    points.push({ x, y });
  }
  return points;
}

function asStringMatrix(value: unknown): string[][] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const rows: string[][] = [];
  for (const row of value) {
    if (!Array.isArray(row) || row.length === 0) return null;
    const cells = row.map((cell) => (cell == null ? '' : String(cell)));
    rows.push(cells);
  }
  return rows;
}

export function parseExamMathStimulus(value: unknown): ExamMathStimulus | undefined {
  if (!isRecord(value)) return undefined;
  const type = asString(value.type);
  if (!type || !TYPES.has(type)) return undefined;

  if (type === 'table') {
    const headers = Array.isArray(value.headers) ? value.headers.map(String) : [];
    const rows = asStringMatrix(value.rows);
    if (headers.length < 1 || !rows) return undefined;
    return {
      type: 'table',
      caption: asString(value.caption) ?? undefined,
      headers,
      rows,
    };
  }
  if (type === 'bar') {
    const bars = asBars(value.bars);
    if (!bars) return undefined;
    return {
      type: 'bar',
      caption: asString(value.caption) ?? undefined,
      unit: asString(value.unit) ?? undefined,
      bars,
    };
  }
  if (type === 'line') {
    const points = asPoints(value.points);
    if (!points) return undefined;
    return {
      type: 'line',
      caption: asString(value.caption) ?? undefined,
      xLabel: asString(value.xLabel) ?? undefined,
      yLabel: asString(value.yLabel) ?? undefined,
      points,
    };
  }
  if (type === 'pie') {
    const slices = asSlices(value.slices);
    if (!slices) return undefined;
    return {
      type: 'pie',
      caption: asString(value.caption) ?? undefined,
      slices,
    };
  }
  if (type === 'clock') {
    const hour = asFinite(value.hour);
    const minute = asFinite(value.minute);
    if (hour === null || minute === null) return undefined;
    return { type: 'clock', hour, minute };
  }
  if (type === 'scale') {
    const max = asFinite(value.max);
    const amount = asFinite(value.value);
    const unit = asString(value.unit);
    if (max === null || amount === null || !unit || max <= 0) return undefined;
    return { type: 'scale', max, value: amount, unit };
  }
  if (type === 'cube') {
    const n = asFinite(value.n);
    if (n === null || n < 2 || n > 8) return undefined;
    return { type: 'cube', n: Math.round(n) };
  }
  if (type === 'painted-grid') {
    const columns = asFinite(value.columns);
    const rows = asFinite(value.rows);
    const filled = asFinite(value.filled);
    if (columns === null || rows === null || filled === null) return undefined;
    return {
      type: 'painted-grid',
      columns: Math.round(columns),
      rows: Math.round(rows),
      filled: Math.round(filled),
    };
  }
  if (type === 'compound-rect') {
    const outerW = asFinite(value.outerW);
    const outerH = asFinite(value.outerH);
    const cutW = asFinite(value.cutW);
    const cutH = asFinite(value.cutH);
    if (outerW === null || outerH === null || cutW === null || cutH === null) return undefined;
    return {
      type: 'compound-rect',
      outerW,
      outerH,
      cutW,
      cutH,
      unit: asString(value.unit) ?? undefined,
    };
  }
  if (type === 'rect-pair') {
    const aW = asFinite(value.aW);
    const aH = asFinite(value.aH);
    const bW = asFinite(value.bW);
    if (aW === null || aH === null || bW === null) return undefined;
    return {
      type: 'rect-pair',
      aW,
      aH,
      bW,
      bH: asFinite(value.bH) ?? undefined,
      unit: asString(value.unit) ?? undefined,
    };
  }
  if (type === 'square-cut') {
    const side = asFinite(value.side);
    if (side === null) return undefined;
    return { type: 'square-cut', side, unit: asString(value.unit) ?? undefined };
  }
  if (type === 'straight-angle') {
    const given = asFinite(value.given);
    if (given === null) return undefined;
    return { type: 'straight-angle', given };
  }
  if (type === 'coord-grid') {
    const startCol = asFinite(value.startCol);
    const startRow = asFinite(value.startRow);
    const steps = asFinite(value.steps);
    if (startCol === null || startRow === null || steps === null) return undefined;
    return {
      type: 'coord-grid',
      startCol: Math.round(startCol),
      startRow: Math.round(startRow),
      steps: Math.round(steps),
    };
  }
  return undefined;
}

export function examMathStimulusKind(stimulus: ExamMathStimulus | undefined): string | null {
  return stimulus?.type ?? null;
}
