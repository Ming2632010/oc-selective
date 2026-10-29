import { readFile } from 'node:fs/promises';
import path from 'node:path';

function mimeForStimulusPath(imagePath: string): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (/\.jpe?g$/i.test(imagePath)) return 'image/jpeg';
  if (/\.png$/i.test(imagePath)) return 'image/png';
  if (/\.webp$/i.test(imagePath)) return 'image/webp';
  return null;
}

/** Load a seeded /stimuli/... file from public/. Returns null if the file is not on disk. */
export async function loadSeededStimulusImage(
  imagePath?: string | null,
): Promise<{ mimeType: 'image/jpeg' | 'image/png' | 'image/webp'; bytes: Buffer } | null> {
  if (!imagePath || !imagePath.startsWith('/stimuli/')) return null;
  const mimeType = mimeForStimulusPath(imagePath);
  if (!mimeType) return null;
  const relative = imagePath.replace(/^\//, '');
  const filePath = path.join(process.cwd(), 'public', relative);
  try {
    const bytes = await readFile(filePath);
    if (bytes.length < 24 || bytes.length > 5 * 1024 * 1024) return null;
    return { mimeType, bytes };
  } catch {
    return null;
  }
}
