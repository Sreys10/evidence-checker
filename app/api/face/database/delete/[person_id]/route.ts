import { NextRequest, NextResponse } from 'next/server';

const BACKEND_SERVICE_URL = process.env.BACKEND_SERVICE_URL || 'http://localhost:5000';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { person_id: string } }
) {
  try {
    const personId = params.person_id;

    const response = await fetch(`${BACKEND_SERVICE_URL}/face/database/delete/${personId}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Backend service error' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error('Delete person API error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}





