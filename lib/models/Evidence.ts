import { sql, query } from '../postgres';
import { uploadImageToCloudinary } from '../cloudinary';

export interface Evidence {
  _id?: string;
  fileName: string;
  /**
   * On CREATE: accepts a base64 data URL — it is uploaded to Cloudinary and the URL is stored.
   * On READ: contains the Cloudinary HTTPS URL (usable directly as <img src>).
   * The field name stays "imageData" throughout for full backward compatibility with the frontend.
   */
  imageData: string;
  uploadDate: string;
  analyzedDate?: string;
  status: 'pending' | 'analyzing' | 'complete' | 'failed';
  result?: 'authentic' | 'tampered' | null;
  confidence?: number | null;
  size: string;
  type: string;

  // Case management
  caseId?: string;
  caseNumber?: string;
  caseName?: string;
  evidenceName?: string;

  // Identifiers
  userId: string;

  // Dynamic payloads — only populated in full (detail) fetches, not list fetches
  metadata?: unknown;
  anomalies?: string[];
  aiDetection?: unknown;
  blockchainHash?: string | null;
  ipfsHash?: string | null;
  reportGenerated?: boolean;
  faceDetection?: unknown;
  weaponDetection?: unknown;
}

// ─── Column lists ─────────────────────────────────────────────────────────────

/**
 * Lightweight columns returned for list views.
 * EXCLUDES the heavy JSONB analysis columns (metadata, ai_detection, face_detection,
 * weapon_detection, anomalies) to dramatically reduce Neon data-transfer usage.
 */
const LIST_COLUMNS = `
  id, file_name, image_url, upload_date, analyzed_date,
  status, result, confidence, size, type,
  case_id, case_number, case_name, evidence_name,
  user_id, blockchain_hash, ipfs_hash, report_generated
`;

// ─── Row mappers ─────────────────────────────────────────────────────────────

/** Full mapper — includes all JSONB columns (used for detail/single-record fetches). */
function mapRow(row: Record<string, unknown>): Evidence {
  return {
    _id: row.id as string,
    fileName: row.file_name as string,
    imageData: (row.image_url as string) ?? '',   // URL returned as imageData for backward compat
    uploadDate: row.upload_date as string,
    analyzedDate: row.analyzed_date as string | undefined,
    status: row.status as Evidence['status'],
    result: row.result as Evidence['result'],
    confidence: row.confidence as number | null | undefined,
    size: row.size as string,
    type: row.type as string,
    caseId: row.case_id as string | undefined,
    caseNumber: row.case_number as string | undefined,
    caseName: row.case_name as string | undefined,
    evidenceName: row.evidence_name as string | undefined,
    userId: row.user_id as string,
    metadata: row.metadata,
    anomalies: row.anomalies as string[] | undefined,
    aiDetection: row.ai_detection,
    blockchainHash: row.blockchain_hash as string | null | undefined,
    ipfsHash: row.ipfs_hash as string | null | undefined,
    reportGenerated: row.report_generated as boolean | undefined,
    faceDetection: row.face_detection,
    weaponDetection: row.weapon_detection,
  };
}

/** Lightweight mapper — omits JSONB analysis fields (used for list views). */
function mapListRow(row: Record<string, unknown>): Evidence {
  return {
    _id: row.id as string,
    fileName: row.file_name as string,
    imageData: (row.image_url as string) ?? '',
    uploadDate: row.upload_date as string,
    analyzedDate: row.analyzed_date as string | undefined,
    status: row.status as Evidence['status'],
    result: row.result as Evidence['result'],
    confidence: row.confidence as number | null | undefined,
    size: row.size as string,
    type: row.type as string,
    caseId: row.case_id as string | undefined,
    caseNumber: row.case_number as string | undefined,
    caseName: row.case_name as string | undefined,
    evidenceName: row.evidence_name as string | undefined,
    userId: row.user_id as string,
    blockchainHash: row.blockchain_hash as string | null | undefined,
    ipfsHash: row.ipfs_hash as string | null | undefined,
    reportGenerated: row.report_generated as boolean | undefined,
    // Heavy JSONB fields intentionally omitted — fetch via getEvidenceById() when needed
    metadata: undefined,
    anomalies: undefined,
    aiDetection: undefined,
    faceDetection: undefined,
    weaponDetection: undefined,
  };
}

// ─── CRUD functions ───────────────────────────────────────────────────────────

export async function createEvidence(data: Omit<Evidence, '_id'>): Promise<Evidence> {
  // Upload base64 image to Cloudinary; if it's already a URL, keep it as-is
  let imageUrl = '';
  if (data.imageData) {
    if (data.imageData.startsWith('data:')) {
      imageUrl = await uploadImageToCloudinary(data.imageData);
    } else {
      imageUrl = data.imageData; // already a URL
    }
  }

  const result = await sql`
    INSERT INTO evidence (
      file_name, image_url, upload_date, analyzed_date,
      status, result, confidence,
      size, type,
      case_id, case_number, case_name, evidence_name,
      user_id,
      metadata, anomalies, ai_detection,
      blockchain_hash, ipfs_hash, report_generated, face_detection, weapon_detection
    ) VALUES (
      ${data.fileName},
      ${imageUrl},
      ${data.uploadDate},
      ${data.analyzedDate ?? null},
      ${data.status},
      ${data.result ?? null},
      ${data.confidence ?? null},
      ${data.size},
      ${data.type},
      ${data.caseId ?? null},
      ${data.caseNumber ?? null},
      ${data.caseName ?? null},
      ${data.evidenceName ?? null},
      ${data.userId},
      ${data.metadata ? JSON.stringify(data.metadata) : null},
      ${data.anomalies ?? null},
      ${data.aiDetection ? JSON.stringify(data.aiDetection) : null},
      ${data.blockchainHash ?? null},
      ${data.ipfsHash ?? null},
      ${data.reportGenerated ?? false},
      ${data.faceDetection ? JSON.stringify(data.faceDetection) : null},
      ${data.weaponDetection ? JSON.stringify(data.weaponDetection) : null}
    )
    RETURNING id, file_name, image_url, upload_date, analyzed_date,
      status, result, confidence, size, type,
      case_id, case_number, case_name, evidence_name,
      user_id, blockchain_hash, ipfs_hash, report_generated
  `;

  return mapListRow(result[0] as Record<string, unknown>);
}

/**
 * List all evidence for a user — lightweight columns only.
 * Heavy JSONB analysis payloads are NOT included to minimize Neon data transfer.
 * Use getEvidenceById() to load the full record when opening a detail view.
 */
export async function getEvidenceByUser(userId: string): Promise<Evidence[]> {
  const result = await query(
    `SELECT ${LIST_COLUMNS} FROM evidence WHERE user_id = $1 ORDER BY upload_date DESC`,
    [userId]
  );
  return result.map((row) => mapListRow(row as Record<string, unknown>));
}

/**
 * Admin list — lightweight columns only (same rationale as getEvidenceByUser).
 */
export async function getAllEvidenceAdmin(): Promise<Evidence[]> {
  const result = await query(
    `SELECT ${LIST_COLUMNS} FROM evidence ORDER BY upload_date DESC`,
    []
  );
  return result.map((row) => mapListRow(row as Record<string, unknown>));
}

/**
 * Fetch a single evidence record — includes ALL columns including heavy JSONB fields.
 * Used when opening the detail/workspace view for a specific piece of evidence.
 */
export async function getEvidenceById(id: string, userId?: string): Promise<Evidence | null> {
  const result = userId ? await sql`
    SELECT * FROM evidence WHERE id = ${id} AND user_id = ${userId} LIMIT 1
  ` : await sql`
    SELECT * FROM evidence WHERE id = ${id} LIMIT 1
  `;
  return result.length > 0 ? mapRow(result[0] as Record<string, unknown>) : null;
}

export async function updateEvidence(
  id: string,
  userId: string | undefined,
  updateData: Partial<Evidence>
): Promise<boolean> {
  // Remove protected fields
  delete updateData._id;
  delete (updateData as Record<string, unknown>).userId;

  // Map TypeScript field names → SQL column names
  const fieldToColumn: Record<string, string> = {
    analyzedDate:    'analyzed_date',
    status:          'status',
    result:          'result',
    confidence:      'confidence',
    metadata:        'metadata',
    anomalies:       'anomalies',
    aiDetection:     'ai_detection',
    blockchainHash:  'blockchain_hash',
    ipfsHash:        'ipfs_hash',
    reportGenerated: 'report_generated',
    faceDetection:   'face_detection',
    weaponDetection: 'weapon_detection',
    evidenceName:    'evidence_name',
    caseId:          'case_id',
    caseNumber:      'case_number',
    caseName:        'case_name',
    imageData:       'image_url',
  };

  // Fields that must be JSON-serialized before insertion
  const jsonFields = new Set(['metadata', 'aiDetection', 'faceDetection', 'weaponDetection']);

  const setClauses: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  for (const [tsKey, sqlCol] of Object.entries(fieldToColumn)) {
    if (tsKey in updateData) {
      let val = (updateData as Record<string, unknown>)[tsKey];

      // Serialize JSONB fields
      if (jsonFields.has(tsKey) && val !== null && val !== undefined) {
        val = typeof val === 'string' ? val : JSON.stringify(val);
      }

      // If imageData is a new base64, upload to Cloudinary first
      if (tsKey === 'imageData' && typeof val === 'string' && (val as string).startsWith('data:')) {
        val = await uploadImageToCloudinary(val as string);
      }

      setClauses.push(`${sqlCol} = $${paramIndex++}`);
      params.push(val ?? null);
    }
  }

  if (setClauses.length === 0) return true;

  params.push(id);
  if (userId) {
    params.push(userId);
  }

  const queryText = `
    UPDATE evidence
    SET ${setClauses.join(', ')}
    WHERE id = $${paramIndex} ${userId ? `AND user_id = $${paramIndex + 1}` : ''}
    RETURNING id
  `;

  const rows = await query(queryText, params);
  return rows.length > 0;
}

export async function deleteEvidence(id: string, userId?: string): Promise<boolean> {
  const result = userId ? await sql`
    DELETE FROM evidence WHERE id = ${id} AND user_id = ${userId} RETURNING id
  ` : await sql`
    DELETE FROM evidence WHERE id = ${id} RETURNING id
  `;
  return Array.isArray(result) && result.length > 0;
}
