import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/postgres';

// Public endpoint — returns the admin's public profile info
// Any logged-in user can call this to find out who the admin is
export async function GET(req: NextRequest) {
  try {
    const result = await sql`
      SELECT id, name, email, profile_image
      FROM users
      WHERE user_type = 'admin'
      ORDER BY created_at ASC
      LIMIT 1
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'No admin found' }, { status: 404 });
    }

    const row = result[0] as Record<string, unknown>;
    return NextResponse.json({
      admin: {
        _id: row.id as string,
        name: row.name as string,
        email: row.email as string,
        profileImage: row.profile_image as string | null,
      },
    });
  } catch (error) {
    console.error('Admin info error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
