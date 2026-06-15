import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    // Verify database is configured
    if (!process.env.DATABASE_URL) {
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

    // Block self-registration as admin — all public signups are analyst.
    // Admin accounts must be elevated by an existing admin after account creation.
    if (userType === 'admin') {
      return NextResponse.json(
        { error: 'Admin accounts cannot be created via public signup.' },
        { status: 403 }
      );
    }

    // Validate user type
    const validUserTypes = ['analyst', 'verifier', 'guest'];
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
    const user = await createUser({ name, email, password, userType });

    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { message: 'User created successfully', user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Signup error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage === 'User with this email already exists') {
      return NextResponse.json({ error: errorMessage }, { status: 409 });
    }

    return NextResponse.json(
      { error: errorMessage || 'Internal server error' },
      { status: 500 }
    );
  }
}
