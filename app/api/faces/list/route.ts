import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const FACE_BACKEND_URL = process.env.FACE_BACKEND_URL || process.env.BACKEND_SERVICE_URL || 'http://localhost:5001';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = `${FACE_BACKEND_URL}/api/faces/list`;
    console.log(`[Faces Proxy] Proxying face database list to FastAPI: ${backendUrl}`);

    const response = await axios.get(backendUrl, {
      headers: {
        'X-API-Key': process.env.EVI_CHECK_API_KEY || 'default-api-key-replace-me',
      }
    });

    return NextResponse.json(response.data, { status: 200 });
  } catch (error: any) {
    console.error('[Faces API Proxy] List database error:', error);
    
    if (error.response) {
      return NextResponse.json(
        { error: error.response.data?.detail || error.response.data?.error || 'FastAPI service error', success: false },
        { status: error.response.status || 500 }
      );
    }
    
    const errMsg = error instanceof Error ? error.message : 'Failed to connect to FastAPI face recognition service';
    return NextResponse.json(
      { error: errMsg, success: false, details: 'Ensure the FastAPI service is running on port 5001' },
      { status: 503 }
    );
  }
}
