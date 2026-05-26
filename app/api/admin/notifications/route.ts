import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import { query } from '@/lib/postgres';

async function authenticate(request: NextRequest) {
  const sessionCookie = request.cookies.get('evicheck_session');
  if (!sessionCookie?.value) return null;
  return verifyJwt(sessionCookie.value);
}

// Ensure table exists (idempotent)
async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS admin_notifications (
      id TEXT PRIMARY KEY,
      report_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      read BOOLEAN DEFAULT FALSE,
      archived BOOLEAN DEFAULT FALSE,
      report_data JSONB,
      full_report TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

// GET /api/admin/notifications — list all notifications
export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    if (!user || (user as any).userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await ensureTable();
    const rows = await query(
      `SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT 200`
    );
    const notifications = rows.map((r: any) => ({
      id: r.id,
      reportId: r.report_id,
      title: r.title,
      message: r.message,
      type: r.type,
      read: r.read,
      archived: r.archived,
      reportData: r.report_data,
      fullReport: r.full_report,
      createdAt: r.created_at,
    }));
    return NextResponse.json({ notifications }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/admin/notifications error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/notifications — create a new notification
export async function POST(request: NextRequest) {
  try {
    // Notifications can be created by any authenticated user (e.g. analyst sending report)
    const sessionCookie = request.cookies.get('evicheck_session');
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await verifyJwt(sessionCookie.value);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await ensureTable();
    const body = await request.json();
    const {
      id, reportId, title, message, type = 'info',
      reportData, fullReport
    } = body;

    if (!id || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields: id, title, message' }, { status: 400 });
    }

    await query(
      `INSERT INTO admin_notifications (id, report_id, title, message, type, report_data, full_report)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [id, reportId ?? null, title, message, type, reportData ? JSON.stringify(reportData) : null, fullReport ?? null]
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/admin/notifications error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/notifications — bulk update (mark read / archive)
export async function PATCH(request: NextRequest) {
  try {
    const user = await authenticate(request);
    if (!user || (user as any).userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await ensureTable();
    const body = await request.json();
    const { action, id } = body;

    if (action === 'mark_all_read') {
      await query(`UPDATE admin_notifications SET read = TRUE WHERE archived = FALSE`);
    } else if (action === 'mark_read' && id) {
      await query(`UPDATE admin_notifications SET read = TRUE WHERE id = $1`, [id]);
    } else if (action === 'archive' && id) {
      await query(`UPDATE admin_notifications SET read = TRUE, archived = TRUE WHERE id = $1`, [id]);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('PATCH /api/admin/notifications error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
