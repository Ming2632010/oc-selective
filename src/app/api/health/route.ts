import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    await query('SELECT NOW()');

    return NextResponse.json({
      status: 'ok',
      timestamp,
      openai_configured: Boolean(process.env.OPENAI_API_KEY?.trim()),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';

    return NextResponse.json(
      {
        status: 'error',
        message,
        timestamp,
        openai_configured: Boolean(process.env.OPENAI_API_KEY?.trim()),
      },
      { status: 500 },
    );
  }
}
