import { NextRequest, NextResponse } from 'next/server';

const BACKEND_SERVICE_URL =
  process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_SERVICE_URL || 'http://localhost:5000';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const response = await fetch(`${BACKEND_SERVICE_URL}/face/database/person/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: {
        'X-API-Key': process.env.EVI_CHECK_API_KEY || 'default-api-key-replace-me',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Backend service error' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error('Person detail API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
