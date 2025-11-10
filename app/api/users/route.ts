import { NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/models/User';

export async function GET() {
  try {
    // In a real app, you should verify the user is an admin here
    // For now, we'll allow any authenticated request
    
    const users = await getAllUsers();
    
    return NextResponse.json(
      { users },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Get users error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check for MongoDB connection errors
    if (errorMessage.includes('Mongo') || errorMessage.includes('connection')) {
      return NextResponse.json(
        { error: 'Database connection error. Please check your MongoDB connection string.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: errorMessage || 'Internal server error' },
      { status: 500 }
    );
  }
}


