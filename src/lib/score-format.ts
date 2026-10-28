/** Dimension marks are 0–5 and may use half points. */
export function formatDimensionScore(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const half = Math.max(0, Math.min(5, Math.round(value * 2) / 2));
  return Number.isInteger(half) ? String(half) : half.toFixed(1);
}
