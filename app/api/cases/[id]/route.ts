import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import { deleteCase } from '@/lib/models/Case';

async function authenticate(request: NextRequest) {
  const sessionCookie = request.cookies.get('evicheck_session');
  if (!sessionCookie || !sessionCookie.value) return null;
  return verifyJwt(sessionCookie.value);
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticate(request);
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteCase(id, user.id as string);
    
    if (deleted) {
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Case not found or unauthorized' }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
