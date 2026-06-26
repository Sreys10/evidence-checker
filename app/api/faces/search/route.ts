import { NextRequest, NextResponse } from 'next/server';
import FormData from 'form-data';
import axios from 'axios';

const FACE_BACKEND_URL = process.env.FACE_BACKEND_URL || process.env.BACKEND_SERVICE_URL || 'http://localhost:5001';

export async function POST(request: NextRequest) {
  try {
    const requestFormData = await request.formData();
    const file = requestFormData.get('image');
    const threshold = requestFormData.get('threshold')?.toString() || '0.60';
    
    if (!file) {
      return NextResponse.json({ error: 'No image file provided', success: false }, { status: 400 });
    }

    const isFile = typeof file === 'object' && file !== null && 'arrayBuffer' in file;
    if (!isFile) {
      return NextResponse.json({ error: 'Invalid file type', success: false }, { status: 400 });
    }

    const bytes = await (file as unknown as Blob).arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = (file as any).name || 'search.jpg';
    const fileType = (file as any).type || 'image/jpeg';

    const formData = new FormData();
    formData.append('image', buffer, { filename: fileName, contentType: fileType });
    formData.append('threshold', threshold);

    const backendUrl = `${FACE_BACKEND_URL}/api/faces/search`;
    console.log(`[Faces Proxy] Proxying face search to FastAPI: ${backendUrl}`);

    const response = await axios.post(backendUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        'X-API-Key': process.env.EVI_CHECK_API_KEY || 'default-api-key-replace-me',
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return NextResponse.json(response.data, { status: response.status || 200 });
  } catch (error: any) {
    console.error('[Faces API Proxy] Search error:', error);
    
    if (error.response) {
      return NextResponse.json(
        { error: error.response.data?.detail || error.response.data?.error || 'FastAPI service error', success: false },
        { status: error.response.status || 500 }
      );
    }
    
    const errMsg = error instanceof Error ? error.message : 'Failed to connect to FastAPI face recognition service';
    return NextResponse.json(
      { error: errMsg, success: false, details: 'Ensure the FastAPI service is running on port 8000' },
      { status: 503 }
    );
  }
}
