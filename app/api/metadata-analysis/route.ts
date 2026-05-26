import { NextRequest, NextResponse } from 'next/server';

const BACKEND_SERVICE_URL = process.env.BACKEND_SERVICE_URL || 'http://localhost:5001';
const API_KEY = process.env.EVI_CHECK_API_KEY || 'default-api-key-replace-me';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('image') as File | null;
        const imageBase64 = formData.get('imageBase64') as string | null;

        if (!file && !imageBase64) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        // Guard: reject excessively large base64 strings (>50 MB)
        if (imageBase64 && imageBase64.length > 50 * 1024 * 1024 * 1.37) {
            return NextResponse.json({ error: 'Image too large. Maximum size is 50 MB.' }, { status: 413 });
        }

        const backendHeaders: HeadersInit = { 'X-API-Key': API_KEY };
        let response: Response;

        if (file) {
            // Guard: reject large files
            if (file.size > 50 * 1024 * 1024) {
                return NextResponse.json({ error: 'Image too large. Maximum size is 50 MB.' }, { status: 413 });
            }
            // Forward file to backend as multipart
            const backendFormData = new FormData();
            backendFormData.append('image', file);
            response = await fetch(`${BACKEND_SERVICE_URL}/metadata/analyze`, {
                method: 'POST',
                headers: backendHeaders,
                body: backendFormData,
            });
        } else {
            // Send base64 as JSON
            response = await fetch(`${BACKEND_SERVICE_URL}/metadata/analyze`, {
                method: 'POST',
                headers: { ...backendHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageBase64 }),
            });
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: errorData?.error || 'Backend service error' },
                { status: response.status || 500 }
            );
        }

        const result = await response.json();
        return NextResponse.json(result);
    } catch (error) {
        console.error('Metadata analysis error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze metadata. Make sure the backend service is running.' },
            { status: 500 }
        );
    }
}
