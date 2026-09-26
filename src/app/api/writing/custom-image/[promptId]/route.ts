import { NextResponse } from 'next/server';
import { getAuthUserIdFromRequest } from '@/lib/auth';
import { loadCustomTaskImageForOwner } from '@/lib/custom-task-image';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ promptId: string }> },
) {
  try {
    const userId = await getAuthUserIdFromRequest(request);
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });
    const { promptId } = await context.params;
    if (!promptId) return new NextResponse('Not found', { status: 404 });

    const image = await loadCustomTaskImageForOwner({ promptId, userId });
    if (!image) return new NextResponse('Not found', { status: 404 });

    return new NextResponse(new Uint8Array(image.bytes), {
      status: 200,
      headers: {
        'Content-Type': image.mimeType,
        'Cache-Control': 'private, no-store',
        'Content-Length': String(image.bytes.length),
      },
    });
  } catch (error) {
    console.error('[writing/custom-image GET]', error);
    return new NextResponse('Failed to load photo', { status: 500 });
  }
}
