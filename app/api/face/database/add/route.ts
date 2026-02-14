import { NextRequest, NextResponse } from 'next/server';
import FormData from 'form-data';
import axios from 'axios';

const BACKEND_SERVICE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_SERVICE_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    const requestFormData = await request.formData();
    const file = requestFormData.get('image');

    console.log('Received file:', file);
    console.log('File type:', typeof file);
    console.log('Is File instance:', file instanceof File);
    
    if (!file) {
      console.error('No file found in form data');
      console.log('Form data keys:', Array.from(requestFormData.keys()));
      return NextResponse.json(
        { error: 'No image file provided', success: false },
        { status: 400 }
      );
    }

    // Check if it's a File or Blob
    if (!(file instanceof File) && !(file instanceof Blob)) {
      console.error('File is not a File or Blob instance:', file);
      return NextResponse.json(
        { error: 'Invalid file type', success: false },
        { status: 400 }
      );
    }

    // Convert file to buffer for forwarding to backend
    let buffer: Buffer;
    if (file instanceof File || file instanceof Blob) {
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
    } else {
      return NextResponse.json(
        { error: 'Invalid file format', success: false },
        { status: 400 }
      );
    }
    
    console.log('File buffer size:', buffer.length);

    try {
      const backendUrl = `${BACKEND_SERVICE_URL}/face/database/add`;
      
      // Create multipart/form-data using form-data package
      const formData = new FormData();
      
      // Append file as buffer
      const fileName = file instanceof File ? file.name : 'image.jpg';
      const fileType = file instanceof File ? file.type : 'image/jpeg';
      
      formData.append('image', buffer, {
        filename: fileName,
        contentType: fileType,
      });
      
      console.log('Sending to backend:', {
        url: backendUrl,
        fileName,
        fileType,
        bufferSize: buffer.length
      });
      
      // Append form fields
      formData.append('person_name', requestFormData.get('person_name')?.toString() || '');
      formData.append('name', requestFormData.get('name')?.toString() || '');
      formData.append('age', requestFormData.get('age')?.toString() || '');
      formData.append('email', requestFormData.get('email')?.toString() || '');
      formData.append('phone', requestFormData.get('phone')?.toString() || '');
      formData.append('notes', requestFormData.get('notes')?.toString() || '');
      formData.append('added_by_name', requestFormData.get('added_by_name')?.toString() || '');
      formData.append('added_by_email', requestFormData.get('added_by_email')?.toString() || '');

      // Use axios to properly handle form-data streaming
      const response = await axios.post(backendUrl, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
      
      console.log('Backend response status:', response.status);
      console.log('Backend response data:', response.data);

      return NextResponse.json(response.data, { status: 200 });
    } catch (backendError: any) {
      console.error('Backend service error:', backendError);
      
      // Handle axios errors
      if (backendError.response) {
        console.error('Backend error response:', backendError.response.data);
        return NextResponse.json(
          { 
            error: backendError.response.data?.error || 'Backend service error',
            success: false,
            details: backendError.response.data
          },
          { status: backendError.response.status || 500 }
        );
      }
      
      const errorMessage = backendError instanceof Error 
        ? backendError.message 
        : 'Failed to connect to backend service';
      
      return NextResponse.json(
        { 
          error: errorMessage,
          success: false,
          details: 'Make sure the backend service is running and accessible'
        },
        { status: 503 }
      );
    }
  } catch (error: unknown) {
    console.error('Add to database API error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred';
    
    return NextResponse.json(
      { error: errorMessage, success: false },
      { status: 500 }
    );
  }
}



