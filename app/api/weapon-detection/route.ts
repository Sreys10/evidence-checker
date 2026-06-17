import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_SERVICE_URL || 'http://localhost:5001';
    const apiKey = process.env.EVI_CHECK_API_KEY || '';
    
    const formData = await request.formData();
    
    const backendRes = await fetch(`${backendUrl}/weapon/detect`, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey },
      body: formData,
    });
    
    const data = await backendRes.json();
    
    if (!backendRes.ok) {
      return NextResponse.json({ error: data.error || 'Detection failed' }, { status: backendRes.status });
    }
    
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
