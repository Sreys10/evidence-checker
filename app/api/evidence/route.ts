import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import { createEvidence, getEvidenceByUser, getAllEvidenceAdmin } from '@/lib/models/Evidence';

// Limit the max JSON body to 14 MB (accommodates a 10 MB image base64-encoded at ~133% size)
export const config = {
  api: { bodyParser: { sizeLimit: '14mb' } },
};

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

    const isAdmin = (user as any).userType === 'admin';
    const evidenceList = isAdmin 
      ? await getAllEvidenceAdmin()
      : await getEvidenceByUser(user.id as string);

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

    // ── Payload size guard ───────────────────────────────────────────────────
    // Reject requests whose Content-Length exceeds 14 MB before parsing the body.
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    const MAX_BYTES = 14 * 1024 * 1024; // 14 MB
    if (contentLength > MAX_BYTES) {
      return NextResponse.json(
        { error: 'Payload too large. Maximum allowed size is 14 MB (10 MB image + encoding overhead).' },
        { status: 413 }
      );
    }
    // ────────────────────────────────────────────────────────────────────────

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

