import { NextRequest, NextResponse } from 'next/server';
import FormData from 'form-data';
import axios from 'axios';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

const BACKEND_SERVICE_URL =
  process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_SERVICE_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    const requestFormData = await request.formData();
    const file = requestFormData.get('image');

    if (!file) {
      return NextResponse.json({ error: 'No image file provided', success: false }, { status: 400 });
    }

    const isFile = typeof file === 'object' && file !== null && 'arrayBuffer' in file;
    if (!isFile) {
      return NextResponse.json({ error: 'Invalid file type', success: false }, { status: 400 });
    }

    // Convert file to buffer
    let buffer: Buffer;
    try {
      const bytes = await (file as unknown as Blob).arrayBuffer();
      buffer = Buffer.from(bytes);
    } catch {
      return NextResponse.json({ error: 'Failed to read file buffer', success: false }, { status: 400 });
    }

    // ── Upload to Cloudinary FIRST so future list reads use a CDN URL (no base64 through Vercel) ──
    let cloudinaryUrl: string | null = null;
    try {
      const mimeType = file instanceof File ? file.type : 'image/jpeg';
      const base64DataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
      cloudinaryUrl = await uploadImageToCloudinary(base64DataUrl);
      console.log('[Face DB] Cloudinary upload success:', cloudinaryUrl);
    } catch (cdnErr) {
      console.warn('[Face DB] Cloudinary upload failed — will store base64 fallback:', cdnErr);
    }

    try {
      const backendUrl = `${BACKEND_SERVICE_URL}/face/database/add`;

      const formData = new FormData();
      const fileName = file instanceof File ? file.name : 'image.jpg';
      const fileType = file instanceof File ? file.type : 'image/jpeg';

      formData.append('image', buffer, { filename: fileName, contentType: fileType });
      formData.append('person_name', requestFormData.get('person_name')?.toString() || '');
      formData.append('name', requestFormData.get('name')?.toString() || '');
      formData.append('age', requestFormData.get('age')?.toString() || '');
      formData.append('email', requestFormData.get('email')?.toString() || '');
      formData.append('phone', requestFormData.get('phone')?.toString() || '');
      formData.append('notes', requestFormData.get('notes')?.toString() || '');
      formData.append('added_by_name', requestFormData.get('added_by_name')?.toString() || '');
      formData.append('added_by_email', requestFormData.get('added_by_email')?.toString() || '');
      if (cloudinaryUrl) {
        formData.append('image_url', cloudinaryUrl);
      }

      const response = await axios.post(backendUrl, formData, {
        headers: {
          ...formData.getHeaders(),
          'X-API-Key': process.env.EVI_CHECK_API_KEY || 'default-api-key-replace-me',
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      return NextResponse.json(response.data, { status: 200 });
    } catch (backendError: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = backendError as any;
      console.error('Backend service error:', error);

      if (error.response) {
        return NextResponse.json(
          { error: error.response.data?.error || 'Backend service error', success: false, details: error.response.data },
          { status: error.response.status || 500 }
        );
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to backend service';
      return NextResponse.json(
        { error: errorMessage, success: false, details: 'Make sure the backend service is running and accessible' },
        { status: 503 }
      );
    }
  } catch (error: unknown) {
    console.error('Add to database API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage, success: false }, { status: 500 });
  }
}
