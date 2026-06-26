import { NextRequest, NextResponse } from 'next/server';
import FormData from 'form-data';
import axios from 'axios';

const FACE_BACKEND_URL = process.env.FACE_BACKEND_URL || process.env.BACKEND_SERVICE_URL || 'http://localhost:5001';

export async function POST(request: NextRequest) {
  try {
    const requestFormData = await request.formData();
    const images = requestFormData.getAll('images');
    
    if (!images || images.length === 0) {
      return NextResponse.json({ error: 'No image files provided', success: false }, { status: 400 });
    }

    const formData = new FormData();
    
    // Add all form fields
    formData.append('full_name', requestFormData.get('full_name')?.toString() || '');
    formData.append('gender', requestFormData.get('gender')?.toString() || '');
    formData.append('age', requestFormData.get('age')?.toString() || '');
    formData.append('case_number', requestFormData.get('case_number')?.toString() || '');
    formData.append('notes', requestFormData.get('notes')?.toString() || '');

    // Add all images to form data
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const isFile = typeof file === 'object' && file !== null && 'arrayBuffer' in file;
      if (isFile) {
        const bytes = await (file as unknown as Blob).arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileName = (file as any).name || `image_${i}.jpg`;
        const fileType = (file as any).type || 'image/jpeg';
        formData.append('images', buffer, { filename: fileName, contentType: fileType });
      }
    }

    const backendUrl = `${FACE_BACKEND_URL}/api/faces/register`;
    logger_log(`Proxying face registration to FastAPI: ${backendUrl}`);

    const response = await axios.post(backendUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        'X-API-Key': process.env.EVI_CHECK_API_KEY || 'default-api-key-replace-me',
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return NextResponse.json(response.data, { status: response.status || 201 });
  } catch (error: any) {
    console.error('[Faces API Proxy] Registration error:', error);
    
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

function logger_log(msg: string) {
  console.log(`[Faces Proxy] ${msg}`);
}
