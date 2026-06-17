import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';
import { query } from '@/lib/postgres';

// Lightweight columns for list view (excludes heavy JSONB analysis fields)
const LIST_COLUMNS = `
  id, file_name, image_url, upload_date, analyzed_date,
  status, result, confidence, size, type,
  case_id, case_number, case_name, evidence_name,
  user_id, blockchain_hash, ipfs_hash, report_generated
`;

async function authenticate(request: NextRequest) {
  const sessionCookie = request.cookies.get('evicheck_session');
  if (!sessionCookie || !sessionCookie.value) return null;
  return verifyJwt(sessionCookie.value);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const user = await authenticate(request);
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { caseId } = await params;
    const isAdmin = (user as any).userType === 'admin';

    const rows = isAdmin
      ? await query(
          `SELECT ${LIST_COLUMNS} FROM evidence WHERE case_id = $1 ORDER BY upload_date DESC`,
          [caseId]
        )
      : await query(
          `SELECT ${LIST_COLUMNS} FROM evidence WHERE case_id = $1 AND user_id = $2 ORDER BY upload_date DESC`,
          [caseId, user.id]
        );

    const evidence = rows.map((row: any) => ({
      _id: row.id,
      id: row.id,
      fileName: row.file_name,
      imageData: row.image_url ?? '',
      uploadDate: row.upload_date,
      analyzedDate: row.analyzed_date,
      status: row.status,
      result: row.result,
      confidence: row.confidence,
      size: row.size,
      type: row.type,
      caseId: row.case_id,
      caseNumber: row.case_number,
      caseName: row.case_name,
      evidenceName: row.evidence_name,
      userId: row.user_id,
      blockchainHash: row.blockchain_hash,
      ipfsHash: row.ipfs_hash,
      reportGenerated: row.report_generated,
    }));

    return NextResponse.json({ evidence }, { status: 200 });
  } catch (error: any) {
    console.error('Evidence by case API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
