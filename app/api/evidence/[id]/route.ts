import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import { getEvidenceById, updateEvidence, deleteEvidence } from '@/lib/models/Evidence';

async function authenticate(request: NextRequest) {
  const sessionCookie = request.cookies.get('evicheck_session');
  if (!sessionCookie || !sessionCookie.value) return null;
  return verifyJwt(sessionCookie.value);
}

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticate(request);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { id } = await params;
    const evidence = await getEvidenceById(id, user.id as string);
    if (!evidence) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    return NextResponse.json({ evidence }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticate(request);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { id } = await params;
    const body = await request.json();
    const updated = await updateEvidence(id, user.id as string, body);
    
    if (updated) return NextResponse.json({ success: true }, { status: 200 });
    return NextResponse.json({ error: 'Not found or unchanged' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticate(request);
    if (!user || !user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { id } = await params;
    const deleted = await deleteEvidence(id, user.id as string);
    if (deleted) return NextResponse.json({ success: true }, { status: 200 });
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
