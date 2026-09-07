type Entry = { count: number; resetsAt: number };

const entries = new Map<string, Entry>();

/** Best-effort per-instance rate limit; use a shared store before horizontal scaling. */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = entries.get(key);
  if (!entry || entry.resetsAt <= now) {
    entries.set(key, { count: 1, resetsAt: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}
