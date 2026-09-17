import { appendFileSync } from 'node:fs';

type DebugLatencyData = Record<string, boolean | number | string | null>;

export function debugLatency(
  hypothesisId: string,
  location: string,
  message: string,
  data: DebugLatencyData,
) {
  try {
    appendFileSync(
      '/opt/cursor/logs/debug.log',
      `${JSON.stringify({ hypothesisId, location, message, data, timestamp: Date.now() })}\n`,
    );
  } catch {
    // Debug logging must not affect request handling when the local log path is unavailable.
  }
}
