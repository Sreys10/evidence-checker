import { NextRequest, NextResponse } from 'next/server';

// Same SightEngine credentials as image detection — image API is free
const API_USER = process.env.IMAGE_DETECTION_API_USER || process.env.SIGHTENGINE_API_USER || '';
const API_SECRET = process.env.IMAGE_DETECTION_API_SECRET || process.env.SIGHTENGINE_API_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    if (!API_USER || !API_SECRET) {
      return NextResponse.json(
        { error: 'SightEngine API credentials not configured.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const frame = formData.get('frame') as File | null;
    const frameIndex = formData.get('frameIndex');

    if (!frame) {
      return NextResponse.json({ error: 'No frame provided' }, { status: 400 });
    }

    // Call SightEngine image check API with genai model (free tier)
    const seForm = new FormData();
    seForm.append('media', frame, `frame_${frameIndex}.jpg`);
    seForm.append('models', 'genai');
    seForm.append('api_user', API_USER);
    seForm.append('api_secret', API_SECRET);

    const res = await fetch('https://api.sightengine.com/1.0/check.json', {
      method: 'POST',
      body: seForm,
    });

    const data = await res.json();

    if (!res.ok || data.status !== 'success') {
      return NextResponse.json(
        { error: data.error?.message || 'SightEngine request failed' },
        { status: res.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      frameIndex: Number(frameIndex),
      aiGeneratedScore: data.type?.ai_generated ?? 0,
    });
  } catch (error) {
    console.error('Frame analysis error:', error);
    return NextResponse.json(
      { error: 'Frame analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
