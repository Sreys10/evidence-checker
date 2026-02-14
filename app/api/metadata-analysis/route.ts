import { NextRequest, NextResponse } from 'next/server';

const BACKEND_SERVICE_URL = process.env.BACKEND_SERVICE_URL || 'http://localhost:5001';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('image') as File | null;
        const imageBase64 = formData.get('imageBase64') as string | null;

        if (!file && !imageBase64) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        let response;

        if (file) {
            // Forward file to backend
            const backendFormData = new FormData();
            backendFormData.append('image', file);
            response = await fetch(`${BACKEND_SERVICE_URL}/metadata/analyze`, {
                method: 'POST',
                body: backendFormData,
            });
        } else if (imageBase64) {
            // Send base64 to backend
            response = await fetch(`${BACKEND_SERVICE_URL}/metadata/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageBase64 }),
            });
        }

        if (!response || !response.ok) {
            const errorData = await response?.json().catch(() => ({}));
            return NextResponse.json(
                { error: errorData?.error || 'Backend service error' },
                { status: response?.status || 500 }
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
