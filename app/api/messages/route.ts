import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import { sendMessage, getConversation, markMessagesRead, getUnreadCount, getConversationPartners } from '@/lib/models/Message';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('evicheck_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload?.id) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const withUserId = searchParams.get('with');
    const action = searchParams.get('action');

    // Get unread count
    if (action === 'unread') {
      const count = await getUnreadCount(payload.id as string);
      return NextResponse.json({ count });
    }

    // Get conversation partners (admin view)
    if (action === 'partners') {
      const partners = await getConversationPartners(payload.id as string);
      return NextResponse.json({ partners });
    }

    // Get full conversation with a specific user
    if (withUserId) {
      const messages = await getConversation(payload.id as string, withUserId);
      // Mark messages from the other user as read
      await markMessagesRead(withUserId, payload.id as string);
      return NextResponse.json({ messages });
    }

    return NextResponse.json({ error: 'Missing query param: with or action' }, { status: 400 });
  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('evicheck_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload?.id) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const { toUserId, message } = await req.json();

    if (!toUserId || !message?.trim()) {
      return NextResponse.json({ error: 'toUserId and message are required' }, { status: 400 });
    }

    const sent = await sendMessage(payload.id as string, toUserId, message.trim());
    return NextResponse.json({ message: sent }, { status: 201 });
  } catch (error) {
    console.error('Messages POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
