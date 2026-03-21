import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import { createCase, getCasesByUser } from '@/lib/models/Case';

// Helper to authenticate API requests
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

    const cases = await getCasesByUser(user.id as string);
    return NextResponse.json({ cases }, { status: 200 });
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
    if (!body.caseNumber || !body.caseName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newCase = await createCase({
      caseNumber: body.caseNumber,
      caseName: body.caseName,
      createdDate: new Date().toISOString(),
      userId: user.id as string,
    });

    return NextResponse.json({ case: newCase }, { status: 201 });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
