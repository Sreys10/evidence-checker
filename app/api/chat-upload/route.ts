import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

export const config = {
  api: { bodyParser: { sizeLimit: '14mb' } },
};

async function authenticate(request: NextRequest) {
  const sessionCookie = request.cookies.get('evicheck_session');
  if (!sessionCookie || !sessionCookie.value) return null;
  return verifyJwt(sessionCookie.value);
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request);
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileData } = await request.json();
    if (!fileData) {
      return NextResponse.json({ error: 'Missing fileData field' }, { status: 400 });
    }

    // Upload base64 to Cloudinary
    const url = await uploadImageToCloudinary(fileData);

    return NextResponse.json({ url }, { status: 201 });
  } catch (error: any) {
    console.error('Chat upload API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
