const MAX_EDGE = 2000;
const KEEP_ORIGINAL_BYTES = 1_500_000;
const TARGET_BYTES = 2_000_000;

export const CUSTOM_TASK_IMAGE_ACCEPT =
  'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif';

function sourceSize(source: ImageBitmap | HTMLImageElement): { width: number; height: number } {
  return { width: source.width, height: source.height };
}

function scaledSize(width: number, height: number, maxEdge: number): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function decodeImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      // Safari/iOS can still decode some camera photos through HTMLImageElement.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not read that photo.'));
      el.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasJpeg(
  source: ImageBitmap | HTMLImageElement,
  width: number,
  height: number,
  quality: number,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not prepare that photo. Try JPEG or PNG.');
  }
  ctx.drawImage(source, 0, 0, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not prepare that photo. Try JPEG or PNG.'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      quality,
    );
  });
}

export async function prepareCustomTaskImage(file: File): Promise<File> {
  if (!file || file.size === 0) {
    throw new Error('Choose a photo of the question.');
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('That photo is too large. Try a closer shot of the question.');
  }

  let source: ImageBitmap | HTMLImageElement;
  try {
    source = await decodeImage(file);
  } catch {
    throw new Error('Use a photo of the question. JPEG, PNG, or a phone photo is fine.');
  }

  const { width, height } = sourceSize(source);
  if (width < 8 || height < 8) {
    if ('close' in source) source.close();
    throw new Error('Use a photo of the question. JPEG, PNG, or a phone photo is fine.');
  }

  const originalType = file.type.toLowerCase();
  const knownStill =
    originalType === 'image/jpeg' || originalType === 'image/png' || originalType === 'image/webp';
  if (knownStill && file.size <= KEEP_ORIGINAL_BYTES && Math.max(width, height) <= MAX_EDGE) {
    if ('close' in source) source.close();
    return file;
  }

  const first = scaledSize(width, height, MAX_EDGE);
  let blob = await canvasJpeg(source, first.width, first.height, 0.82);
  if (blob.size > TARGET_BYTES) {
    blob = await canvasJpeg(source, first.width, first.height, 0.7);
  }
  if (blob.size > TARGET_BYTES) {
    const second = scaledSize(width, height, 1600);
    blob = await canvasJpeg(source, second.width, second.height, 0.7);
  }
  if ('close' in source) source.close();
  if (blob.size > 5 * 1024 * 1024) {
    throw new Error('That photo is still too large. Try a closer shot of the question.');
  }

  return new File([blob], 'question.jpg', { type: 'image/jpeg', lastModified: Date.now() });
}
