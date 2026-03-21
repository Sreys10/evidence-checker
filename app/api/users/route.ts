import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/models/User';
import { verifyJwt } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('evicheck_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || payload.userType !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const users = await getAllUsers();
    
    return NextResponse.json({ users }, { status: 200 });
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


