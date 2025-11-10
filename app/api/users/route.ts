import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    // In a real app, you should verify the user is an admin here
    // For now, we'll allow any authenticated request
    
    const users = await getAllUsers();
    
    return NextResponse.json(
      { users },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get users error:', error);
    
    // Check for MongoDB connection errors
    if (error.message?.includes('Mongo') || error.message?.includes('connection')) {
      return NextResponse.json(
        { error: 'Database connection error. Please check your MongoDB connection string.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

