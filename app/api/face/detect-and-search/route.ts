import { NextRequest, NextResponse } from 'next/server';

// Backend service URL - set via environment variable
const BACKEND_SERVICE_URL = process.env.BACKEND_SERVICE_URL || 'http://localhost:5000';

// Log backend URL in development (not in production for security)
if (process.env.NODE_ENV === 'development') {
  console.log('Backend Service URL:', BACKEND_SERVICE_URL);
}

export async function POST(request: NextRequest) {
  try {
    const requestFormData = await request.formData();
    const file = requestFormData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Get optional parameters
    const detector = requestFormData.get('detector')?.toString() || 'retinaface';
    const model = requestFormData.get('model')?.toString() || 'ArcFace';
    const threshold = requestFormData.get('threshold')?.toString() || '0.5';
    const database_path = requestFormData.get('database_path')?.toString() || 'database/';

    // Convert file to buffer for forwarding to backend
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    try {
      const backendUrl = `${BACKEND_SERVICE_URL}/face/detect-and-search`;
      
      // Create FormData for backend request
      const formData = new FormData();
      const blob = new Blob([buffer], { type: file.type });
      formData.append('image', blob, file.name);
      formData.append('detector', detector);
      formData.append('model', model);
      formData.append('threshold', threshold);
      formData.append('database_path', database_path);

      // Forward request to backend service
      const backendResponse = await fetch(backendUrl, {
        method: 'POST',
        body: formData,
      });

      const data = await backendResponse.json();

      if (!backendResponse.ok) {
        return NextResponse.json(
          { error: data.error || 'Backend service error' },
          { status: backendResponse.status }
        );
      }

      return NextResponse.json(data, { status: 200 });
    } catch (backendError) {
      console.error('Backend service error:', backendError);
      
      const errorMessage = backendError instanceof Error 
        ? backendError.message 
        : 'Failed to connect to backend service';
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: 'Make sure the backend service is running and accessible'
        },
        { status: 503 }
      );
    }
  } catch (error: unknown) {
    console.error('Face detection API error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

