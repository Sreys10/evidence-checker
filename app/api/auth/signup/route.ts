import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    // Check MongoDB connection before processing
    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        { error: 'Database configuration error. Please check your environment variables.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { name, email, password, userType } = body;

    // Validate input
    if (!name || !email || !password || !userType) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate user type
    const validUserTypes = ['admin', 'analyst', 'verifier', 'guest'];
    if (!validUserTypes.includes(userType)) {
      return NextResponse.json(
        { error: 'Invalid user type' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Create user
    const user = await createUser({
      name,
      email,
      password,
      userType,
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    
    if (error.message === 'User with this email already exists') {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

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

