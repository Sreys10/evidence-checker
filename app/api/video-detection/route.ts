import { NextRequest, NextResponse } from 'next/server';

// Same credentials as image detection
const API_USER = process.env.IMAGE_DETECTION_API_USER || '';
const API_SECRET = process.env.IMAGE_DETECTION_API_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    if (!API_USER || !API_SECRET) {
      return NextResponse.json(
        { error: 'Verification API credentials not configured.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const frame = formData.get('frame') as File | null;
    const frameIndex = formData.get('frameIndex');

    if (!frame) {
      return NextResponse.json({ error: 'No frame provided' }, { status: 400 });
    }

    // Call Cloud Verification check API with genai model
    const apiForm = new FormData();
    apiForm.append('media', frame, `frame_${frameIndex}.jpg`);
    apiForm.append('models', 'genai');
    apiForm.append('api_user', API_USER);
    apiForm.append('api_secret', API_SECRET);

    const res = await fetch('https://api.sightengine.com/1.0/check.json', {
      method: 'POST',
      body: apiForm,
    });

    const data = await res.json();

    if (!res.ok || data.status !== 'success') {
      return NextResponse.json(
        { error: data.error?.message || 'Verification request failed' },
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
