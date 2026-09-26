import { query, runSql } from '@/lib/db';

export const CUSTOM_TASK_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const CUSTOM_TASK_IMAGE_PATH = (promptId: string) =>
  `/api/writing/custom-image/${promptId}`;

export type InspectedCustomImage = {
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  bytes: Buffer;
};

export function inspectCustomTaskImage(bytes: Buffer): InspectedCustomImage | null {
  if (bytes.length < 12 || bytes.length > CUSTOM_TASK_IMAGE_MAX_BYTES) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mimeType: 'image/jpeg', bytes };
  }
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { mimeType: 'image/png', bytes };
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { mimeType: 'image/webp', bytes };
  }
  return null;
}

export async function ensureCustomTaskImagesTable(): Promise<void> {
  await runSql(`
    CREATE TABLE IF NOT EXISTS custom_task_images (
      prompt_id UUID PRIMARY KEY REFERENCES prompts (id) ON DELETE CASCADE,
      student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
      mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
      bytes BYTEA NOT NULL,
      byte_length INTEGER NOT NULL CHECK (byte_length > 0 AND byte_length <= 5242880),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await runSql(`
    CREATE INDEX IF NOT EXISTS idx_custom_task_images_student
      ON custom_task_images (student_id)
  `);
}

export async function saveCustomTaskImage(input: {
  promptId: string;
  studentId: string;
  image: InspectedCustomImage;
}): Promise<void> {
  await ensureCustomTaskImagesTable();
  await query(
    `INSERT INTO custom_task_images (prompt_id, student_id, mime_type, bytes, byte_length)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (prompt_id) DO UPDATE SET
       mime_type = EXCLUDED.mime_type,
       bytes = EXCLUDED.bytes,
       byte_length = EXCLUDED.byte_length`,
    [
      input.promptId,
      input.studentId,
      input.image.mimeType,
      input.image.bytes,
      input.image.bytes.length,
    ],
  );
}

export async function loadCustomTaskImageForOwner(input: {
  promptId: string;
  userId: string;
}): Promise<{ mimeType: string; bytes: Buffer } | null> {
  await ensureCustomTaskImagesTable();
  const result = await query<{ mime_type: string; bytes: Buffer }>(
    `SELECT i.mime_type, i.bytes
     FROM custom_task_images i
     JOIN prompts p ON p.id = i.prompt_id
     JOIN students s ON s.id = i.student_id
     WHERE i.prompt_id = $1
       AND s.user_id = $2
       AND p.kind = 'custom'
       AND p.is_active = TRUE
     LIMIT 1`,
    [input.promptId, input.userId],
  );
  const row = result.rows[0];
  if (!row) return null;
  return { mimeType: row.mime_type, bytes: row.bytes };
}

export async function loadCustomTaskImageForStudent(input: {
  promptId: string;
  studentId: string;
}): Promise<{ mimeType: string; bytes: Buffer } | null> {
  await ensureCustomTaskImagesTable();
  const result = await query<{ mime_type: string; bytes: Buffer }>(
    `SELECT mime_type, bytes
     FROM custom_task_images
     WHERE prompt_id = $1 AND student_id = $2
     LIMIT 1`,
    [input.promptId, input.studentId],
  );
  const row = result.rows[0];
  if (!row) return null;
  return { mimeType: row.mime_type, bytes: row.bytes };
}
