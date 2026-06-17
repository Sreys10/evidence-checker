import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import { sql } from '@/lib/postgres';

async function authenticate(request: NextRequest) {
  const sessionCookie = request.cookies.get('evicheck_session');
  if (!sessionCookie || !sessionCookie.value) return null;
  return verifyJwt(sessionCookie.value);
}

/**
 * GET /api/stats
 * Returns aggregated evidence/case stats using a single SQL query.
 * Much cheaper than fetching all rows and counting on the client.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id as string;
    const isAdmin = (user as any).userType === 'admin';

    const [evidenceStats, caseCount] = await Promise.all([
      // Single aggregate query — no row data transferred, just counts
      isAdmin
        ? sql`
            SELECT
              COUNT(*)::int                                                    AS total_evidence,
              COUNT(*) FILTER (WHERE status = 'complete' AND result = 'authentic')::int AS verified,
              COUNT(*) FILTER (WHERE status = 'complete' AND result = 'tampered')::int  AS tampered,
              COUNT(*) FILTER (WHERE report_generated = true)::int            AS reports_generated,
              COUNT(*) FILTER (WHERE blockchain_hash IS NOT NULL)::int        AS on_blockchain
            FROM evidence
          `
        : sql`
            SELECT
              COUNT(*)::int                                                    AS total_evidence,
              COUNT(*) FILTER (WHERE status = 'complete' AND result = 'authentic')::int AS verified,
              COUNT(*) FILTER (WHERE status = 'complete' AND result = 'tampered')::int  AS tampered,
              COUNT(*) FILTER (WHERE report_generated = true)::int            AS reports_generated,
              COUNT(*) FILTER (WHERE blockchain_hash IS NOT NULL)::int        AS on_blockchain
            FROM evidence
            WHERE user_id = ${userId}
          `,
      isAdmin
        ? sql`SELECT COUNT(*)::int AS total_cases FROM cases`
        : sql`SELECT COUNT(*)::int AS total_cases FROM cases WHERE user_id = ${userId}`,
    ]);

    const ev = evidenceStats[0] as Record<string, number>;
    const cs = caseCount[0] as Record<string, number>;

    return NextResponse.json({
      totalEvidence: ev?.total_evidence ?? 0,
      totalCases: cs?.total_cases ?? 0,
      verified: ev?.verified ?? 0,
      tampered: ev?.tampered ?? 0,
      reportsGenerated: ev?.reports_generated ?? 0,
      onBlockchain: ev?.on_blockchain ?? 0,
    });
  } catch (error: any) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
