import { createHash, randomBytes } from 'crypto';
import { query } from './db';

export const RESET_TTL_MS = 60 * 60 * 1000;
export const GENERIC_FORGOT_MESSAGE =
  'If that email is registered, we have sent a reset link. Check your inbox and spam folder. The link expires in 1 hour.';

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}

export function isResetExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}

export async function ensurePasswordResetTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id
      ON password_reset_tokens (user_id)
  `);
}

export async function createPasswordResetToken(
  userId: string,
): Promise<{ token: string; expiresAt: Date }> {
  await ensurePasswordResetTable();
  await query(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL`,
    [userId],
  );

  const token = generateResetToken();
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);

  await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt.toISOString()],
  );

  return { token, expiresAt };
}

export async function consumePasswordResetToken(
  token: string,
): Promise<string | null> {
  await ensurePasswordResetTable();
  const tokenHash = hashResetToken(token);
  const result = await query<{ user_id: string }>(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE token_hash = $1
       AND used_at IS NULL
       AND expires_at > NOW()
     RETURNING user_id`,
    [tokenHash],
  );

  return result.rows[0]?.user_id ?? null;
}

export async function invalidateUserResetTokens(userId: string): Promise<void> {
  await query(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL`,
    [userId],
  );
}

export function buildResetUrl(token: string): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const base = (configured || 'https://trialseed.com.au').replace(/\/$/, '');
  return `${base}/reset-password?token=${encodeURIComponent(token)}`;
}

export function shouldExposeDevResetUrl(): boolean {
  return process.env.NODE_ENV !== 'production';
}
