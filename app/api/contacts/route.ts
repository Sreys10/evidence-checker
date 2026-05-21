import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import { sql } from '@/lib/postgres';

// Returns all users except the current user — for building contact lists
// Any authenticated user can call this
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('evicheck_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload?.id) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const result = await sql`
      SELECT
        u.id,
        u.name,
        u.email,
        u.user_type,
        u.profile_image,
        u.last_login,
        (
          SELECT m.message
          FROM messages m
          WHERE (m.from_user_id = u.id AND m.to_user_id = ${payload.id as string})
             OR (m.from_user_id = ${payload.id as string} AND m.to_user_id = u.id)
          ORDER BY m.created_at DESC
          LIMIT 1
        ) AS last_message,
        (
          SELECT m.created_at
          FROM messages m
          WHERE (m.from_user_id = u.id AND m.to_user_id = ${payload.id as string})
             OR (m.from_user_id = ${payload.id as string} AND m.to_user_id = u.id)
          ORDER BY m.created_at DESC
          LIMIT 1
        ) AS last_message_at,
        (
          SELECT COUNT(*)
          FROM messages m
          WHERE m.from_user_id = u.id
            AND m.to_user_id = ${payload.id as string}
            AND m.read = FALSE
        ) AS unread_count
      FROM users u
      WHERE u.id != ${payload.id as string}
      ORDER BY last_message_at DESC NULLS LAST, u.name ASC
    `;

    const contacts = result.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        _id: r.id as string,
        name: r.name as string,
        email: r.email as string,
        userType: r.user_type as string,
        profileImage: r.profile_image as string | null,
        lastLogin: r.last_login as string | null,
        lastMessage: r.last_message as string | null,
        lastMessageAt: r.last_message_at as string | null,
        unreadCount: parseInt(r.unread_count as string, 10) || 0,
      };
    });

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('Contacts GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
