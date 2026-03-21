import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import { createEvidence, getEvidenceByUser } from '@/lib/models/Evidence';

async function authenticate(request: NextRequest) {
  const sessionCookie = request.cookies.get('evicheck_session');
  if (!sessionCookie || !sessionCookie.value) return null;
  return verifyJwt(sessionCookie.value);
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const evidenceList = await getEvidenceByUser(user.id as string);
    return NextResponse.json({ evidence: evidenceList }, { status: 200 });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request);
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.fileName || !body.imageData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newEvidence = await createEvidence({
      ...body,
      userId: user.id as string,
      uploadDate: new Date().toISOString(),
      status: body.status || 'pending',
    });

    return NextResponse.json({ evidence: newEvidence }, { status: 201 });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
